import { PetProfile, SearchConfig, SavedSearch, Geolocation } from '../types';
import { optimizationService } from './optimizationService';
import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { haversineKm } from '../utils/geoUtils';

export interface SearchFilters {
    breed?: string;
    species?: string;
    age?: string;
    color?: string;
    gender?: string;
    size?: string;
    tags?: string[];
    keyword?: string;
    location?: string;
    isLost?: boolean;
    userLocation?: Geolocation;
    maxRadiusKm?: number;
    sortBy?: 'relevance' | 'distance' | 'recency';
}

class SearchService {
    private static instance: SearchService;

    private constructor() {}

    public static getInstance(): SearchService {
        if (!SearchService.instance) {
            SearchService.instance = new SearchService();
        }
        return SearchService.instance;
    }

    /**
     * Ranks pets based on filters and dynamic weights from the optimization service.
     * Includes geo-proximity scoring, recency bonus, and configurable sort order.
     */
    public async rankPets(pets: PetProfile[], filters: SearchFilters): Promise<PetProfile[]> {
        const config = await optimizationService.getSearchConfig() || {
            breedMatchWeight: 0.5,
            locationWeight: 0.3,
            ageWeight: 0.2
        };

        // 1. Strict Filtering
        let filteredPets = pets;

        if (filters.breed) {
            filteredPets = filteredPets.filter(p => p.breed?.toLowerCase().includes(filters.breed!.toLowerCase()));
        }
        if (filters.age) {
            filteredPets = filteredPets.filter(p => p.age === filters.age);
        }
        if (filters.size) {
            filteredPets = filteredPets.filter(p => p.size === filters.size);
        }
        if (filters.location) {
            filteredPets = filteredPets.filter(p => p.lastSeenLocation?.address?.toLowerCase().includes(filters.location!.toLowerCase()) || false);
        }
        if (filters.gender) {
            filteredPets = filteredPets.filter(p => p.gender === filters.gender);
        }
        // Geo radius filter (pre-sort)
        if (filters.userLocation && filters.maxRadiusKm) {
            filteredPets = filteredPets.filter(p => {
                if (!p.lastSeenLocation) return true; // Include pets without location
                return haversineKm(
                    filters.userLocation!.latitude, filters.userLocation!.longitude,
                    p.lastSeenLocation.latitude, p.lastSeenLocation.longitude
                ) <= filters.maxRadiusKm!;
            });
        }

        // 2. Scoring & Ranking
        const maxRadius = filters.maxRadiusKm || 50;

        const scoredPets = filteredPets.map(pet => {
            let score = 0;

            // Species match (hard deprioritize)
            if (filters.species && pet.type !== filters.species.toLowerCase()) {
                score -= 1.0;
            }

            // Breed match (weighted)
            if (filters.breed && pet.breed?.toLowerCase().includes(filters.breed.toLowerCase())) {
                score += (config as any).breedMatchWeight || 0.5;
            }

            // Geolocation proximity scoring (weighted by locationWeight)
            if (filters.userLocation && pet.lastSeenLocation) {
                const distKm = haversineKm(
                    filters.userLocation.latitude, filters.userLocation.longitude,
                    pet.lastSeenLocation.latitude, pet.lastSeenLocation.longitude
                );
                const proximityScore = Math.max(0, 1 - (distKm / maxRadius));
                score += proximityScore * ((config as any).locationWeight || 0.3);
            }

            // Age match (weighted)
            if (filters.age && pet.age === filters.age) {
                score += (config as any).ageWeight || 0.2;
            }

            // Color match bonus
            if (filters.color && pet.color?.toLowerCase().includes(filters.color.toLowerCase())) {
                score += 0.1;
            }

            // Recency bonus: newer sightings rank higher (decay over 1 week)
            if (pet.sightings && pet.sightings.length > 0) {
                const latestSighting = Math.max(...pet.sightings.map(s => s.timestamp));
                const hoursSince = (Date.now() - latestSighting) / (1000 * 60 * 60);
                const recencyScore = Math.max(0, 1 - (hoursSince / 168));
                score += recencyScore * 0.15;
            }

            // Tag matching
            if (filters.tags && filters.tags.length > 0) {
                const petText = `${pet.behavior} ${pet.breed} ${pet.description} ${pet.color}`.toLowerCase();
                const matchesCount = filters.tags.filter((tag: string) => petText.includes(tag.toLowerCase())).length;
                score += (matchesCount / filters.tags.length) * 0.2;
            }

            // Keyword bonus
            if (filters.keyword) {
                const petText = `${pet.name} ${pet.breed} ${pet.behavior} ${pet.description}`.toLowerCase();
                if (petText.includes(filters.keyword.toLowerCase())) {
                    score += 0.3;
                }
            }

            return { pet, score };
        });

        // Sort by chosen method
        if (filters.sortBy === 'distance' && filters.userLocation) {
            return scoredPets
                .sort((a, b) => {
                    const distA = a.pet.lastSeenLocation
                        ? haversineKm(filters.userLocation!.latitude, filters.userLocation!.longitude, a.pet.lastSeenLocation.latitude, a.pet.lastSeenLocation.longitude)
                        : Infinity;
                    const distB = b.pet.lastSeenLocation
                        ? haversineKm(filters.userLocation!.latitude, filters.userLocation!.longitude, b.pet.lastSeenLocation.latitude, b.pet.lastSeenLocation.longitude)
                        : Infinity;
                    return distA - distB;
                })
                .map(sp => sp.pet);
        }

        if (filters.sortBy === 'recency') {
            return scoredPets
                .sort((a, b) => {
                    const timeA = a.pet.sightings?.length ? Math.max(...a.pet.sightings.map(s => s.timestamp)) : 0;
                    const timeB = b.pet.sightings?.length ? Math.max(...b.pet.sightings.map(s => s.timestamp)) : 0;
                    return timeB - timeA;
                })
                .map(sp => sp.pet);
        }

        // Default: sort by relevance score
        return scoredPets
            .sort((a, b) => b.score - a.score)
            .map(sp => sp.pet);
    }

    /**
     * Persists a search configuration for a specific user.
     */
    public async saveSearch(userEmail: string, name: string, filters: SearchFilters): Promise<string> {
        const savedSearch: Omit<SavedSearch, 'id'> = {
            userEmail,
            name,
            filters,
            timestamp: Date.now()
        };
        const docRef = await addDoc(collection(db, 'saved_searches'), savedSearch);
        return docRef.id;
    }

    /**
     * Retrieves all saved searches for a specific user.
     */
    public async getSavedSearches(userEmail: string): Promise<SavedSearch[]> {
        const q = query(
            collection(db, 'saved_searches'),
            where('userEmail', '==', userEmail),
            orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedSearch));
    }

    /**
     * Deletes a saved search.
     */
    public async deleteSavedSearch(id: string): Promise<void> {
        await deleteDoc(doc(db, 'saved_searches', id));
    }
}

export const searchService = SearchService.getInstance();
