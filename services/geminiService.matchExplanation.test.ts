import { describe, it, expect, vi } from 'vitest';
import { generateMatchExplanation } from './geminiService';
import { PetProfile } from '../types';

// Mock dependencies
vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(),
    httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ 
        data: { success: true, text: "This pet matches because..." } 
    }))
}));

vi.mock('./firebase', () => ({
    functions: {},
}));

const mockPet: PetProfile = {
    id: '1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: '2 years',
    size: 'Large',
    lastSeenLocation: { latitude: 40.7128, longitude: -74.0060, address: 'New York' },
    type: 'dog',
    status: 'forAdoption',
    photos: [],
    behavior: 'Friendly',
    weight: '30kg',
    description: 'Loves people',
    guardianEmails: [],
    homeLocations: [],
    searchRadius: null,
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
    ownerEmail: null,
    vetLinkStatus: 'unlinked',
    isLost: false,
};

describe('geminiService.generateMatchExplanation', () => {
    it('should generate an explanation', async () => {
        const result = await generateMatchExplanation(mockPet, { breed: 'Golden Retriever', lifestyle: 'Active' });
        expect(result).toBe("This pet matches because...");
    });
});
