import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { aiBridgeService } from './aiBridgeService';
import { httpsCallable } from 'firebase/functions';

// Mock aiBridgeService
vi.mock('./aiBridgeService', () => ({
  aiBridgeService: {
    analyzeImageForDescription: vi.fn(),
    performAIHealthCheck: vi.fn(),
    generateChatSuggestions: vi.fn(),
    comparePets: vi.fn(),
    generateMatchExplanation: vi.fn(),
    chat: vi.fn(),
  }
}));

// Mock Firebase Functions for fetchAvailableModels
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('./firebase', () => ({
  functions: {},
}));

describe('openRouterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('analyzeImageForDescription should delegate to aiBridgeService', async () => {
    vi.mocked(aiBridgeService.analyzeImageForDescription).mockResolvedValue('A cute dog');
    const file = new File([], 'test.jpg');
    
    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    expect(aiBridgeService.analyzeImageForDescription).toHaveBeenCalledWith(file);
  });

  it('generateChatSuggestions should delegate to aiBridgeService', async () => {
    vi.mocked(aiBridgeService.generateChatSuggestions).mockResolvedValue(['Hello']);

    const result = await openRouterService.generateChatSuggestions({}, 'test@example.com');

    expect(result).toEqual(['Hello']);
    expect(aiBridgeService.generateChatSuggestions).toHaveBeenCalled();
  });

  it('fetchAvailableModels should call fetchOpenRouterModels cloud function', async () => {
    const mockCall = vi.fn().mockResolvedValue({
      data: { models: [{ id: 'gpt-4', name: 'GPT-4' }] } 
    });
    vi.mocked(httpsCallable).mockReturnValue(mockCall as any);

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'fetchOpenRouterModels');
  });

  it('should handle errors gracefully by delegating and letting bridge handle it', async () => {
    vi.mocked(aiBridgeService.performAIHealthCheck).mockRejectedValue(new Error('Fail'));

    await expect(openRouterService.performAIHealthCheck({} as any, 'cough', 'en')).rejects.toThrow('Fail');
  });
});