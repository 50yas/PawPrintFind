import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';

// Create persistent mocks for Firestore
const mockSet = vi.fn().mockResolvedValue({});
const mockGet = vi.fn().mockResolvedValue({ exists: false, data: () => ({}) });

const mockCollectionInner = {
    doc: vi.fn(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    add: vi.fn().mockResolvedValue({ id: 'mock-id' }),
};

const mockDocInner = {
    set: mockSet,
    get: mockGet,
    collection: vi.fn(() => mockCollectionInner),
    delete: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
};

mockCollectionInner.doc.mockReturnValue(mockDocInner);

const mockFirestore = {
    collection: vi.fn(() => mockCollectionInner),
    doc: vi.fn(() => mockDocInner),
};

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    initializeApp: vi.fn(),
    firestore: Object.assign(vi.fn(() => mockFirestore), {
      FieldValue: {
        increment: vi.fn((n) => ({ type: 'increment', value: n })),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
      },
    }),
  };
});

// Mock firebase-functions/v2
vi.mock('firebase-functions/v2/https', () => {
    return {
        onCall: vi.fn((config, handler) => {
            // Return the handler so it can be called directly in tests
            return typeof config === 'function' ? config : handler;
        }),
        onRequest: vi.fn(),
        HttpsError: class HttpsError extends Error {
            constructor(public code: string, message: string) {
                super(message);
            }
        }
    };
});

// Mock firebase-functions/params
vi.mock('firebase-functions/params', () => {
    return {
        defineSecret: vi.fn((name) => ({
            value: () => name === 'GEMINI_API_KEY' ? 'test-api-key' : 'test-secret-value'
        }))
    };
});

// Mock firebase-functions/v1 (keep for triggers if needed)
vi.mock('firebase-functions/v1', () => {
    return {
        https: {
            onCall: vi.fn((fn) => fn),
            onRequest: vi.fn(),
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

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
    const generateContentMock = vi.fn().mockResolvedValue({
        response: {
            text: () => 'Mocked AI Response',
            candidates: [{ content: { parts: [{ text: 'Mocked AI Response' }] } }]
        }
    });
    
    return {
        GoogleGenAI: vi.fn().mockImplementation(function() {
            return {
                getGenerativeModel: vi.fn(() => ({
                    generateContent: generateContentMock
                }))
            };
        })
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
    expect(mockFirestore.collection).toHaveBeenCalledWith('users');
  });
});

describe('AI Cloud Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('visionIdentification should be defined and track usage', async () => {
        expect(visionIdentification).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { image: 'base64data', task: 'identify' } 
        };
        
        // @ts-ignore
        await visionIdentification(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ visionIdentification: expect.anything() }),
            { merge: true }
        );
    });

    it('smartSearch should handle ping query correctly', async () => {
        expect(smartSearch).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { query: 'ping' } 
        };
        
        // @ts-ignore
        const result = await smartSearch(request);
        
        expect(result).toEqual({ success: true, message: "pong" });
        // Should NOT track usage for a ping (at least not in users collection)
        const usageStatsCalled = mockFirestore.collection.mock.calls.some(call => call[0] === 'usageStats' || call[0] === 'users');
        // Actually, it might be called for system_config. Let's just check 'users'
        const usersCalled = mockFirestore.collection.mock.calls.some(call => call[0] === 'users');
        expect(usersCalled).toBe(false);
    });

    it('smartSearch should be defined and track usage', async () => {
        expect(smartSearch).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { query: 'lost dog' } 
        };
        
        // @ts-ignore
        await smartSearch(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ smartSearch: expect.anything() }),
            { merge: true }
        );
    });

    it('healthAssessment should be defined and track usage', async () => {
        expect(healthAssessment).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { pet: { name: 'Buddy' }, symptoms: 'coughing' } 
        };
        
        // @ts-ignore
        await healthAssessment(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ healthAssessment: expect.anything() }),
            { merge: true }
        );
    });

    it('blogGeneration should be defined and track usage', async () => {
        expect(blogGeneration).toBeDefined();
        const request = { 
            auth: {
                uid: 'user123',
                token: { role: 'admin' }
            },
            data: { topic: 'Pet safety' } 
        };
        
        // @ts-ignore
        await blogGeneration(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ blogGeneration: expect.anything() }),
            { merge: true }
        );
    });

    it('should throw unauthenticated if no context.auth', async () => {
        const request = { data: { query: 'test' } };
        // @ts-ignore
        await expect(smartSearch(request)).rejects.toThrow('Auth required.');
    });

    it('should throw invalid-argument if missing data', async () => {
        const request = { auth: { uid: 'user1' }, data: {} };
        // @ts-ignore
        await expect(smartSearch(request)).rejects.toThrow('Query required.');
    });

    it('should throw resource-exhausted if quota exceeded', async () => {
        const request = { auth: { uid: 'user1' }, data: { query: 'test' } };
        mockCheckQuota.mockResolvedValueOnce({ allowed: false, reason: 'Quota exceeded' });
        
        // @ts-ignore
        await expect(smartSearch(request)).rejects.toThrow('Quota exceeded');
    });
});
