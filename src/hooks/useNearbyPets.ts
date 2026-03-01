import { useState, useEffect } from 'react';
import { PetProfile, Geolocation } from '../types';
import { isWithinRadius, sortByProximity } from '../utils/geoUtils';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface UseNearbyPetsReturn {
    nearbyPets: PetProfile[];
    isLoading: boolean;
    count: number;
}

/**
 * Real-time subscription to lost pets near the user's location.
 * Uses Haversine distance client-side (Firestore doesn't support native geo queries).
 */
export const useNearbyPets = (
    userLocation: Geolocation | null,
    radiusKm: number = 5
): UseNearbyPetsReturn => {
    const [allLostPets, setAllLostPets] = useState<PetProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'pets'), where('isLost', '==', true));
        const unsubscribe = onSnapshot(q, (snap) => {
            const pets = snap.docs.map(d => d.data() as PetProfile);
            setAllLostPets(pets);
            setIsLoading(false);
        }, (err) => {
            console.error('useNearbyPets error:', err);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const nearbyPets: PetProfile[] = userLocation
        ? sortByProximity(
            allLostPets.filter(p =>
                p.lastSeenLocation && isWithinRadius(p.lastSeenLocation, userLocation, radiusKm)
            ),
            p => p.lastSeenLocation || null,
            userLocation
          )
        : allLostPets;

    return {
        nearbyPets,
        isLoading,
        count: nearbyPets.length,
    };
};
