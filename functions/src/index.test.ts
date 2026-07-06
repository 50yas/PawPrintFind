import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';

// Shared mock instances
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();

// Mock Firestore chain
const mockFirestore = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
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
    messaging: vi.fn(() => ({
        send: vi.fn().mockResolvedValue('msg-id')
    }))
  };
});

// Mock firebase-functions/params
vi.mock('firebase-functions/params', () => {
    return {
        defineSecret: vi.fn((name) => ({
            value: vi.fn(() => `mock-value-for-${name}`)
        }))
    };
});

// Mock firebase-functions/v2/firestore
vi.mock('firebase-functions/v2/firestore', () => {
    return {
        onDocumentCreated: vi.fn(() => vi.fn())
    };
});

// Mock firebase-functions/v2
vi.mock('firebase-functions/v2/https', () => {
    return {
        onCall: vi.fn((config, handler) => {
            return typeof config === 'function' ? config : handler;
        }),
        onRequest: vi.fn((config, handler) => {
            return typeof config === 'function' ? config : handler;
        }),
        HttpsError: class HttpsError extends Error {
            constructor(public code: string, message: string) {
                super(message);
            }
        }
    };
});

// Mock firebase-functions/v1
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

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
    const generateContentMock = vi.fn().mockResolvedValue({
        response: {
            text: () => '{"breed": "Golden Retriever"}',
            candidates: [{ content: { parts: [{ text: '{"breed": "Golden Retriever"}' }] } }]
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
import { visionIdentification, smartSearch, healthAssessment, blogGeneration } from './index';

describe('trackUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should increment usage counters', async () => {
    mockSet.mockResolvedValue({});
    await trackUsage('user1', 'test');
    expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    expect(mockFirestore.collection).toHaveBeenCalledWith('usageStats');
  });
});

describe('AI Cloud Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default system config mock
        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({
                provider: 'google',
                fallbackToGemini: true,
                modelMapping: {
                    vision: 'gemini-2.0-flash',
                    visionIdentification: 'gemini-2.0-flash',
                    smartSearch: 'gemini-2.0-flash',
                    healthAssessment: 'gemini-2.0-flash',
                    blogGeneration: 'gemini-2.0-flash'
                }
            })
        });
        mockSet.mockResolvedValue({});
    });

    it('visionIdentification should be defined and track usage', async () => {
        expect(visionIdentification).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { image: 'base64data', task: 'autofill' }
        };
        
        // @ts-ignore
        await visionIdentification(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('usageStats');
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
    });

    it('smartSearch should be defined and track usage', async () => {
        expect(smartSearch).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { query: 'lost dog' } 
        };
        
        // @ts-ignore
        await smartSearch(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('usageStats');
    });

    it('healthAssessment should be defined and track usage', async () => {
        expect(healthAssessment).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { pet: { name: 'Buddy' }, symptoms: 'coughing' } 
        };
        
        // @ts-ignore
        await healthAssessment(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('usageStats');
    });

    it('blogGeneration should be defined and track usage', async () => {
        expect(blogGeneration).toBeDefined();
        const request = { 
            auth: {
                uid: 'admin123',
                token: { role: 'super_admin' }
            },
            data: { topic: 'Pet safety' } 
        };
        
        // @ts-ignore
        await blogGeneration(request);
        
        expect(mockFirestore.collection).toHaveBeenCalledWith('usageStats');
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
