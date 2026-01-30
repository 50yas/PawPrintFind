import { PetProfile, SearchConfig, SavedSearch } from '../types';
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
            filteredPets = filteredPets.filter(p => p.breed === filters.breed);
        }
        if (filters.age) {
            filteredPets = filteredPets.filter(p => p.age === filters.age);
        }
        if (filters.size) {
            filteredPets = filteredPets.filter(p => p.size === filters.size);
        }
        if (filters.location) {
             filteredPets = filteredPets.filter(p => p.location?.toLowerCase().includes(filters.location!.toLowerCase()) || false);
        }
        if (filters.gender) {
            filteredPets = filteredPets.filter(p => p.gender === filters.gender);
        }

        // 2. Scoring & Ranking
        const scoredPets = filteredPets.map(pet => {
            let score = 0;

            // Species (Hard filter usually, but here we can weight it or just filter)
            if (filters.species && pet.type !== filters.species.toLowerCase()) {
                // If it's a completely different species, we might want to deprioritize heavily
                score -= 1.0; 
            }


            // Tag matching (Bonus)
            if (filters.tags && filters.tags.length > 0) {
                const petText = `${pet.behavior} ${pet.breed} ${pet.description} ${pet.color}`.toLowerCase();
                const matchesCount = filters.tags.filter((tag: string) => petText.includes(tag.toLowerCase())).length;
                score += (matchesCount / filters.tags.length) * 0.2; 
            }

            // Keyword (Bonus)
            if (filters.keyword) {
                const petText = `${pet.name} ${pet.breed} ${pet.behavior} ${pet.description}`.toLowerCase();
                if (petText.includes(filters.keyword.toLowerCase())) {
                    score += 0.3;
                }
            }

            return { pet, score };
        });

        // Filter out very low scores if needed, or just sort
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
