import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizationService } from './optimizationService';

// Mock firebase
vi.mock('./firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn()
}));

describe('OptimizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sampleParameters returns random values when no trials exist', async () => {
    // Mock getCompletedTrials to return empty array
    vi.spyOn(optimizationService as any, 'getCompletedTrials').mockResolvedValue([]);

    const params = await optimizationService.sampleParameters();
    
    expect(params).toHaveProperty('breedMatchWeight');
    expect(params).toHaveProperty('locationWeight');
    expect(params).toHaveProperty('ageWeight');
    expect(params.breedMatchWeight).toBeGreaterThanOrEqual(0);
    expect(params.breedMatchWeight).toBeLessThanOrEqual(1);
  });

  it('sampleParameters explores around best trial when trials exist', async () => {
    const mockBestTrial = {
      params: { breedMatchWeight: 0.5, locationWeight: 0.5, ageWeight: 0.5 },
      score: 10,
      status: 'completed'
    };
    
    vi.spyOn(optimizationService as any, 'getCompletedTrials').mockResolvedValue([
      mockBestTrial,
      { params: { breedMatchWeight: 0.1, locationWeight: 0.1, ageWeight: 0.1 }, score: 1, status: 'completed' },
      { params: { breedMatchWeight: 0.2, locationWeight: 0.2, ageWeight: 0.2 }, score: 2, status: 'completed' },
      { params: { breedMatchWeight: 0.3, locationWeight: 0.3, ageWeight: 0.3 }, score: 3, status: 'completed' },
      { params: { breedMatchWeight: 0.4, locationWeight: 0.4, ageWeight: 0.4 }, score: 4, status: 'completed' }
    ]);

    const params = await optimizationService.sampleParameters();
    
    // Values should be close to 0.5 (within noise range +/- 0.1 typically)
    expect(params.breedMatchWeight).toBeGreaterThan(0.3);
    expect(params.breedMatchWeight).toBeLessThan(0.7);
  });
});
