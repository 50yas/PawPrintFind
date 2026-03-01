import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation, PetProfile } from '../types';
import { haversineKm } from '../utils/geoUtils';
import { dbService } from '../services/firebase';

interface UseWaitingModeReturn {
    isWaiting: boolean;
    idleSeconds: number;
    nearbyAlerts: PetProfile[];
    dismiss: () => void;
    hasNewAlerts: boolean;
}

const IDLE_THRESHOLD_SECONDS = 120; // 2 minutes idle = waiting mode
const IDLE_DISTANCE_THRESHOLD_M = 0.05; // 50m movement resets idle
const SCAN_RADIUS_KM = 1; // 1km radius when waiting

/**
 * Detects when a food delivery rider is stationary (waiting for order)
 * and automatically scans for nearby lost pets.
 */
export const useWaitingMode = (
    isDeliveryRider: boolean,
    location: Geolocation | null,
    userId: string
): UseWaitingModeReturn => {
    const [isWaiting, setIsWaiting] = useState(false);
    const [idleSeconds, setIdleSeconds] = useState(0);
    const [nearbyAlerts, setNearbyAlerts] = useState<PetProfile[]>([]);
    const [hasNewAlerts, setHasNewAlerts] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const lastMoveRef = useRef<number>(Date.now());
    const lastLocationRef = useRef<Geolocation | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scannedRef = useRef(false);

    // Track movement
    useEffect(() => {
        if (!isDeliveryRider || !location) return;

        if (lastLocationRef.current) {
            const dist = haversineKm(
                lastLocationRef.current.latitude,
                lastLocationRef.current.longitude,
                location.latitude,
                location.longitude
            );
            if (dist > IDLE_DISTANCE_THRESHOLD_M) {
                // Moved: reset idle
                lastMoveRef.current = Date.now();
                setIdleSeconds(0);
                setIsWaiting(false);
                scannedRef.current = false;
            }
        }
        lastLocationRef.current = location;
    }, [location, isDeliveryRider]);

    // Idle counter
    useEffect(() => {
        if (!isDeliveryRider) return;

        idleTimerRef.current = setInterval(() => {
            const idle = Math.floor((Date.now() - lastMoveRef.current) / 1000);
            setIdleSeconds(idle);

            if (idle >= IDLE_THRESHOLD_SECONDS && !isWaiting) {
                setIsWaiting(true);
                setDismissed(false);
            }
        }, 5000);

        return () => {
            if (idleTimerRef.current) clearInterval(idleTimerRef.current);
        };
    }, [isDeliveryRider, isWaiting]);

    // Auto-scan when waiting mode activates
    useEffect(() => {
        if (!isWaiting || scannedRef.current || !location || dismissed) return;
        scannedRef.current = true;

        const scanNearby = async () => {
            try {
                const allPets = await dbService.getPets();
                const lost = allPets.filter(p => p.isLost && p.lastSeenLocation);
                const nearby = lost.filter(p => {
                    if (!p.lastSeenLocation) return false;
                    return haversineKm(
                        location.latitude, location.longitude,
                        p.lastSeenLocation.latitude, p.lastSeenLocation.longitude
                    ) <= SCAN_RADIUS_KM;
                });

                if (nearby.length > 0) {
                    setNearbyAlerts(nearby);
                    setHasNewAlerts(true);
                    // Award karma for the scan
                    await dbService.awardKarma(userId, 'waiting_mode_scan', {}).catch(console.error);
                }
            } catch (e) {
                console.error('Waiting mode scan failed:', e);
            }
        };

        scanNearby();
    }, [isWaiting, location, dismissed, userId]);

    const dismiss = useCallback(() => {
        setDismissed(true);
        setHasNewAlerts(false);
        setNearbyAlerts([]);
    }, []);

    if (!isDeliveryRider) {
        return { isWaiting: false, idleSeconds: 0, nearbyAlerts: [], dismiss: () => {}, hasNewAlerts: false };
    }

    return { isWaiting: isWaiting && !dismissed, idleSeconds, nearbyAlerts, dismiss, hasNewAlerts };
};
