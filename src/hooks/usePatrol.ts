import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation, RiderType, PatrolSession } from '../types';
import { haversineKm } from '../utils/geoUtils';
import { dbService } from '../services/firebase';

interface PatrolState {
    isPatrolling: boolean;
    patrolTime: number;       // seconds elapsed
    patrolDistance: number;   // km traveled
    route: Geolocation[];     // GPS breadcrumb trail
    karmaEarned: number;
    currentLocation: Geolocation | null;
    error: string | null;
}

interface UsePatrolReturn extends PatrolState {
    startPatrol: () => void;
    stopPatrol: () => Promise<void>;
    formattedTime: string;
}

/**
 * @param userId       Firebase UID of the authenticated user.
 * @param riderType    Vehicle type that determines the karma multiplier.
 * @param missionId    Optional mission this patrol is linked to.
 * @param isAnonymous  When true, GPS tracking still works but all Firestore
 *                     writes (karma awards, session saves) are skipped.
 *                     This prevents permission errors for guest users.
 */
export const usePatrol = (userId: string, riderType: RiderType = 'walking', missionId?: string, isAnonymous = false): UsePatrolReturn => {
    const [isPatrolling, setIsPatrolling] = useState(false);
    const [patrolTime, setPatrolTime] = useState(0);
    const [patrolDistance, setPatrolDistance] = useState(0);
    const [route, setRoute] = useState<Geolocation[]>([]);
    const [karmaEarned, setKarmaEarned] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<Geolocation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const lastLocationRef = useRef<Geolocation | null>(null);

    const stopWatcher = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startPatrol = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported by your browser');
            return;
        }
        setError(null);
        setPatrolTime(0);
        setPatrolDistance(0);
        setRoute([]);
        setKarmaEarned(0);
        startTimeRef.current = Date.now();
        setIsPatrolling(true);

        // Timer
        timerRef.current = setInterval(() => {
            setPatrolTime(prev => prev + 1);
        }, 1000);

        // GPS watch
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const geo: Geolocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setCurrentLocation(geo);
                setRoute(prev => {
                    const newRoute = [...prev, geo];
                    // Calculate distance from last point
                    if (lastLocationRef.current) {
                        const dist = haversineKm(
                            lastLocationRef.current.latitude,
                            lastLocationRef.current.longitude,
                            geo.latitude,
                            geo.longitude
                        );
                        // Only count if moved > 10m (filter GPS noise)
                        if (dist > 0.01) {
                            setPatrolDistance(d => {
                                const newDist = d + dist;
                                // Award patrol karma every 0.5km — skipped for anonymous users
                                if (!isAnonymous && Math.floor(newDist / 0.5) > Math.floor(d / 0.5)) {
                                    dbService.awardKarma(userId, 'search_patrol', { distance: 0.5 })
                                        .then(tx => setKarmaEarned(k => k + tx.points))
                                        .catch(console.error);
                                }
                                return newDist;
                            });
                        }
                    }
                    lastLocationRef.current = geo;
                    return newRoute;
                });
            },
            (err) => setError(err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    }, [userId, isAnonymous]);

    const stopPatrol = useCallback(async () => {
        const endTime = Date.now();
        const durationMinutes = Math.round(patrolTime / 60);

        stopWatcher();
        setIsPatrolling(false);

        // Skip all Firestore writes for anonymous/guest users
        if (isAnonymous) return;

        // Award patrol time karma (every 15 min)
        if (durationMinutes >= 15) {
            try {
                const tx = await dbService.awardKarma(userId, 'patrol_time', { duration: durationMinutes });
                setKarmaEarned(k => k + tx.points);
            } catch (e) {
                console.error('Failed to award patrol karma:', e);
            }
        }

        // Save patrol session to Firestore
        if (patrolTime > 60) { // Only save sessions > 1 minute
            const session: Omit<PatrolSession, 'id'> = {
                userId,
                missionId,
                startTime: startTimeRef.current,
                endTime,
                durationMinutes,
                distanceKm: parseFloat(patrolDistance.toFixed(2)),
                route: route.slice(0, 500), // Limit route size
                sightingsReported: 0,
                karmaEarned,
                riderType,
            };

            try {
                await dbService.savePatrolSession(session);
            } catch (e) {
                console.error('Failed to save patrol session:', e);
            }
        }
    }, [userId, isAnonymous, patrolTime, patrolDistance, route, karmaEarned, riderType, missionId, stopWatcher]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWatcher();
        };
    }, [stopWatcher]);

    // Format time as MM:SS
    const formattedTime = `${Math.floor(patrolTime / 60).toString().padStart(2, '0')}:${(patrolTime % 60).toString().padStart(2, '0')}`;

    return {
        isPatrolling,
        patrolTime,
        patrolDistance,
        route,
        karmaEarned,
        currentLocation,
        error,
        startPatrol,
        stopPatrol,
        formattedTime,
    };
};
