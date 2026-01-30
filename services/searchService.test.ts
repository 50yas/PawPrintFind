import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchService, SearchFilters } from './searchService';
import { PetProfile } from '../types';
import { optimizationService } from './optimizationService';

// Mock dependencies
vi.mock('./optimizationService', () => ({
    optimizationService: {
        getSearchConfig: vi.fn().mockResolvedValue({
            breedMatchWeight: 0.5,
            locationWeight: 0.3,
            ageWeight: 0.2
        }),
    },
}));

vi.mock('./firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
}));

const mockPets: PetProfile[] = [
    {
        id: '1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: '2 years',
        size: 'Large',
        lastSeenLocation: { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        type: 'dog',
        status: 'forAdoption',
        photos: [],
        behavior: '',
        weight: '30kg',
        description: '',
        guardianEmails: [],
        homeLocations: [],
        searchRadius: null,
        sightings: [],
    } as any,
    {
        id: '2',
        name: 'Mittens',
        breed: 'Tabby',
        age: '1 year',
        size: 'Small',
        lastSeenLocation: { latitude: 42.3601, longitude: -71.0589, address: 'Boston' },
        type: 'cat',
        status: 'forAdoption',
        photos: [],
        behavior: '',
        weight: '4kg',
        description: '',
        guardianEmails: [],
        homeLocations: [],
        searchRadius: null,
        sightings: [],
    } as any,
    {
        id: '3',
        name: 'Max',
        breed: 'Golden Retriever',
        age: '4 years',
        size: 'Large',
        lastSeenLocation: { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
        type: 'dog',
        status: 'forAdoption',
        photos: [],
        behavior: '',
        weight: '35kg',
        description: '',
        guardianEmails: [],
        homeLocations: [],
        searchRadius: null,
        sightings: [],
    } as any,
];

describe('SearchService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should filter pets by breed', async () => {
        const filters: SearchFilters = { breed: 'Golden Retriever' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(2);
        expect(results.map(p => p.name)).toContain('Buddy');
        expect(results.map(p => p.name)).toContain('Max');
        expect(results.map(p => p.name)).not.toContain('Mittens');
    });

    it('should filter pets by size', async () => {
        const filters: SearchFilters = { size: 'Small' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Mittens');
    });

    it('should filter pets by location', async () => {
        const filters: SearchFilters = { location: 'New York' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(2);
        expect(results.map(p => p.name)).toContain('Buddy');
        expect(results.map(p => p.name)).toContain('Max');
    });

    it('should filter pets by age', async () => {
        const filters: SearchFilters = { age: '2 years' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Buddy');
    });

    it('should combine filters (Breed + Location)', async () => {
        const filters: SearchFilters = { breed: 'Golden Retriever', location: 'New York' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(2);
        expect(results.map(p => p.name)).toContain('Buddy');
        expect(results.map(p => p.name)).toContain('Max');
    });

    it('should combine filters (Breed + Age) resulting in single match', async () => {
        const filters: SearchFilters = { breed: 'Golden Retriever', age: '4 years' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Max');
    });

    it('should return empty list if no matches', async () => {
        const filters: SearchFilters = { breed: 'Poodle' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(0);
    });

    it('should sort by relevance (default) even with filters', async () => {
        // Here we rely on the internal scoring.
        // Buddy: 2 years. Max: 4 years.
        // Filters: Breed 'Golden Retriever'. 
        // Both match breed. Scores should be equal unless other factors apply.
        // Let's add a keyword filter to differentiate.
        const filters: SearchFilters = { breed: 'Golden Retriever', keyword: 'Buddy' };
        const results = await searchService.rankPets(mockPets, filters);
        
        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Buddy'); // Higher score due to keyword match
    });
});