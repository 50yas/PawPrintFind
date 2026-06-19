import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

vi.mock('./firebase', () => ({
  functions: {},
}));

describe('openRouterService', () => {
  const mockCallFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (httpsCallable as any).mockReturnValue(mockCallFunction);
  });

  it('analyzeImageForDescription should delegate to aiBridgeService', async () => {
    mockCallFunction.mockResolvedValue({ data: { success: true, text: 'A cute dog' } });
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    // It calls visionIdentification because that's what aiBridgeService.analyzeImageForDescription (via geminiService) does
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'visionIdentification');
  });

  it('generateChatSuggestions should delegate to aiBridgeService', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { 
        success: true, 
        text: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) 
      } 
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callGemini');
  });

  it('fetchAvailableModels should call fetchOpenRouterModels cloud function', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { models: [{ id: 'gpt-4', name: 'GPT-4' }] } 
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'fetchOpenRouterModels');
  });

  it('should handle errors via retry mechanism', async () => {
    mockCallFunction.mockRejectedValue(new Error('API Error'));

    await expect(openRouterService.performAIHealthCheck({} as any, 'cough'))
      .rejects.toThrow('API Error');
  }, 15000); // Increased timeout for retries
});