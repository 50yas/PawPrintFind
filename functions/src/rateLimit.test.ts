import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';

// Create persistent mocks for Firestore
const mockGet = vi.fn().mockResolvedValue({ exists: false, data: () => ({}) });

// Mock implementation that allows chaining
const mockDoc = vi.fn().mockReturnThis();
const mockCollection = vi.fn().mockReturnThis();

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    initializeApp: vi.fn(),
    firestore: Object.assign(vi.fn(() => ({
        collection: mockCollection,
        doc: mockDoc,
        get: mockGet
    })), {
      FieldValue: {
        increment: vi.fn((n) => ({ type: 'increment', value: n })),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
      },
    }),
  };
});

import { checkQuota } from './rateLimit';

describe('checkQuota', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(checkQuota).toBeDefined();
    });

    it('should allow request if quota not exceeded', async () => {
        // No stats exist yet
        mockGet.mockResolvedValueOnce({ exists: false });
        
        const result = await checkQuota('user1', 'healthAssessment');
        expect(result.allowed).toBe(true);
        expect(mockCollection).toHaveBeenCalledWith('users');
        expect(mockDoc).toHaveBeenCalledWith('user1');
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
    });

    it('should deny request if quota exceeded', async () => {
        // Mock current usage as 5 (assuming quota is 5)
        mockGet.mockResolvedValueOnce({ 
            exists: true, 
            data: () => ({ healthAssessment: 5 }) 
        });
        
        const result = await checkQuota('user1', 'healthAssessment');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('exceeded');
    });
});