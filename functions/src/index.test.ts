import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';

// Create persistent mocks for Firestore
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

// Mock firebase-functions
vi.mock('firebase-functions/v1', () => {
    return {
        https: {
            onCall: vi.fn((fn) => fn),
            HttpsError: class HttpsError extends Error {
                constructor(public code: string, message: string) {
                    super(message);
                }
            }
        },
        config: vi.fn(() => ({ gemini: { key: 'test-api-key' } })),
        firestore: {
            document: vi.fn(() => ({
                onCreate: vi.fn(),
                onWrite: vi.fn()
            }))
        }
    };
});

// Mock GoogleGenerativeAI
vi.mock('@google/generative-ai', () => {
    const generateContentMock = vi.fn().mockResolvedValue({
        response: {
            text: () => 'Mocked AI Response',
            candidates: [{ content: { parts: [{ text: 'Mocked AI Response' }] } }]
        }
    });
    
    // Use a class for the mock to ensure it works as a constructor
    class MockGoogleGenerativeAI {
        getGenerativeModel = vi.fn(() => ({
            generateContent: generateContentMock
        }))
    }

    return {
        GoogleGenerativeAI: MockGoogleGenerativeAI
    };
});

// Mock checkQuota
const { mockCheckQuota } = vi.hoisted(() => ({
    mockCheckQuota: vi.fn().mockResolvedValue({ allowed: true })
}));
vi.mock('./rateLimit', () => ({
    checkQuota: mockCheckQuota
}));

import { trackUsage } from './usage';
// @ts-ignore - these won't be exported yet
import { visionIdentification, smartSearch, healthAssessment, blogGeneration } from './index';

describe('trackUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should increment usage counters', async () => {
    await trackUsage('user1', 'test');
    expect(mockCollection).toHaveBeenCalledWith('users');
  });
});

describe('AI Cloud Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('visionIdentification should be defined and track usage', async () => {
        expect(visionIdentification).toBeDefined();
        const context = { auth: { uid: 'user123' } };
        const data = { image: 'base64data', task: 'identify' };
        
        // @ts-ignore
        await visionIdentification(data, context);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ visionIdentification: expect.anything() }),
            { merge: true }
        );
    });

    it('smartSearch should be defined and track usage', async () => {
        expect(smartSearch).toBeDefined();
        const context = { auth: { uid: 'user123' } };
        const data = { query: 'lost dog' };
        
        // @ts-ignore
        await smartSearch(data, context);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ smartSearch: expect.anything() }),
            { merge: true }
        );
    });

    it('healthAssessment should be defined and track usage', async () => {
        expect(healthAssessment).toBeDefined();
        const context = { auth: { uid: 'user123' } };
        const data = { pet: { name: 'Buddy' }, symptoms: 'coughing' };
        
        // @ts-ignore
        await healthAssessment(data, context);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ healthAssessment: expect.anything() }),
            { merge: true }
        );
    });

    it('blogGeneration should be defined and track usage', async () => {
        expect(blogGeneration).toBeDefined();
        const context = { auth: { uid: 'user123' } };
        const data = { topic: 'Pet safety' };
        
        // @ts-ignore
        await blogGeneration(data, context);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ blogGeneration: expect.anything() }),
            { merge: true }
        );
    });

    it('should throw unauthenticated if no context.auth', async () => {
        const data = { query: 'test' };
        // @ts-ignore
        await expect(smartSearch(data, {})).rejects.toThrow('Auth required.');
    });

    it('should throw invalid-argument if missing data', async () => {
        const context = { auth: { uid: 'user1' } };
        // @ts-ignore
        await expect(smartSearch({}, context)).rejects.toThrow('Query required.');
    });

    it('should throw resource-exhausted if quota exceeded', async () => {
        const context = { auth: { uid: 'user1' } };
        const data = { query: 'test' };
        mockCheckQuota.mockResolvedValueOnce({ allowed: false, reason: 'Quota exceeded' });
        
        // @ts-ignore
        await expect(smartSearch(data, context)).rejects.toThrow('Quota exceeded');
    });
});
