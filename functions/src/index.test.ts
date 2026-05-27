import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';

// Create persistent mocks for Firestore
const mockSet = vi.fn().mockResolvedValue({});
const mockDoc = vi.fn().mockReturnThis();
const mockCollection = vi.fn().mockReturnThis();
const mockGet = vi.fn().mockResolvedValue({ exists: false });

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    initializeApp: vi.fn(),
    firestore: Object.assign(vi.fn(() => ({
        collection: mockCollection,
        doc: mockDoc,
        set: mockSet,
        get: mockGet
    })), {
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

// Mock firebase-functions/v1 (keep for triggers if needed)
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

// Mock firebase-functions/params
vi.mock('firebase-functions/params', () => ({
    defineSecret: vi.fn(() => ({
        value: vi.fn(() => 'mock-secret')
    }))
}));

// Mock checkQuota
const { mockCheckQuota } = vi.hoisted(() => ({
    mockCheckQuota: vi.fn().mockResolvedValue({ allowed: true })
}));
vi.mock('./rateLimit', () => ({
    checkQuota: mockCheckQuota
}));

import { trackUsage } from './usage';
// @ts-ignore - these won't be exported yet
import * as Main from './index';

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
        expect(Main.visionIdentification).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { image: 'base64data', task: 'identify' } 
        };
        
        // @ts-ignore
        await Main.visionIdentification(request);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ visionIdentification: expect.anything() }),
            { merge: true }
        );
    });

    it('smartSearch should handle ping query correctly', async () => {
        expect(Main.smartSearch).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { query: 'ping' } 
        };
        
        // @ts-ignore
        const result = await Main.smartSearch(request);
        
        expect(result).toEqual({ success: true, message: "pong" });
        // Should NOT track usage for a ping
        expect(mockCollection).not.toHaveBeenCalledWith('usageStats');
    });

    it('smartSearch should be defined and track usage', async () => {
        expect(Main.smartSearch).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { query: 'lost dog' } 
        };
        
        // @ts-ignore
        await Main.smartSearch(request);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ smartSearch: expect.anything() }),
            { merge: true }
        );
    });

    it('healthAssessment should be defined and track usage', async () => {
        expect(Main.healthAssessment).toBeDefined();
        const request = { 
            auth: { uid: 'user123' }, 
            data: { pet: { name: 'Buddy' }, symptoms: 'coughing' } 
        };
        
        // @ts-ignore
        await Main.healthAssessment(request);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ healthAssessment: expect.anything() }),
            { merge: true }
        );
    });

    it('blogGeneration should be defined and track usage', async () => {
        expect(Main.blogGeneration).toBeDefined();
        const request = { 
            auth: { uid: 'user123', token: { role: 'admin' } },
            data: { topic: 'Pet safety' } 
        };
        
        // @ts-ignore
        await Main.blogGeneration(request);
        
        expect(mockCollection).toHaveBeenCalledWith('usageStats');
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ blogGeneration: expect.anything() }),
            { merge: true }
        );
    });

    it('should throw unauthenticated if no context.auth', async () => {
        const request = { data: { query: 'test' } };
        // @ts-ignore
        await expect(Main.smartSearch(request)).rejects.toThrow('Auth required.');
    });

    it('should throw invalid-argument if missing data', async () => {
        const request = { auth: { uid: 'user1' }, data: {} };
        // @ts-ignore
        await expect(Main.smartSearch(request)).rejects.toThrow('Query required.');
    });

    it('should throw resource-exhausted if quota exceeded', async () => {
        const request = { auth: { uid: 'user1' }, data: { query: 'test' } };
        mockCheckQuota.mockResolvedValueOnce({ allowed: false, reason: 'Quota exceeded' });
        
        // @ts-ignore
        await expect(Main.smartSearch(request)).rejects.toThrow('Quota exceeded');
    });

    it('callAI should fallback to Gemini if OpenRouter fails and fallbackToGemini is true', async () => {
        // Mock Firestore to return OpenRouter with fallback enabled
        mockGet.mockResolvedValueOnce({
            exists: true,
            data: () => ({
                provider: 'openrouter',
                modelMapping: { test: 'qwen/qwen-2.5-72b-instruct:free' },
                fallbackToGemini: true
            })
        });
        mockDoc.mockReturnValue({ get: mockGet });

        // Mock fetch to fail for OpenRouter
        const globalFetch = global.fetch;
        global.fetch = vi.fn().mockRejectedValue(new Error('OpenRouter error'));

        // Mock GoogleGenAI is already mocked to return 'Mocked AI Response'

        const result = await (Main as any).callAI('user1', 'test', { parts: [{ text: 'hello' }] });

        expect(result.success).toBe(true);
        expect(result.text).toBe('Mocked AI Response');

        global.fetch = globalFetch;
    });
});
