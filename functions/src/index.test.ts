import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';

// Create persistent mocks
const mockSet = vi.fn().mockResolvedValue({});
const mockDoc = vi.fn().mockReturnThis();
const mockCollection = vi.fn().mockReturnThis();

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    initializeApp: vi.fn(),
    firestore: Object.assign(vi.fn(() => ({
        collection: mockCollection,
        doc: mockDoc,
        set: mockSet
    })), {
      FieldValue: {
        increment: vi.fn((n) => ({ type: 'increment', value: n })),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
      },
    }),
  };
});

import { trackUsage } from './usage';

describe('trackUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(trackUsage).toBeDefined();
  });

  it('should increment usage counters for a user', async () => {
    const userId = 'test-user-123';
    const featureName = 'smartSearch';
    const today = new Date().toISOString().split('T')[0];
    
    await trackUsage(userId, featureName);
    
    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith(userId);
    expect(mockCollection).toHaveBeenCalledWith('usageStats');
    expect(mockDoc).toHaveBeenCalledWith(today);
    
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [featureName]: expect.objectContaining({ type: 'increment', value: 1 }),
        totalAIRequests: expect.objectContaining({ type: 'increment', value: 1 }),
        lastUsed: 'mock-timestamp'
      }),
      { merge: true }
    );
  });
});