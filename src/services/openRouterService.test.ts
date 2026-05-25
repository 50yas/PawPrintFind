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

  it('analyzeImageForDescription should call cloud function with correct parameters', async () => {
    mockCallFunction.mockResolvedValue({ data: { success: true, text: 'A cute dog' } });
    
    // Create a dummy file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader class
    class MockFileReader {
      readAsDataURL = vi.fn();
      onloadend = vi.fn();
      result = 'data:image/jpeg;base64,BASE64_CONTENT';
      
      constructor() {
        this.readAsDataURL.mockImplementation(() => {
           // Simulate async behavior
           setTimeout(() => {
             if (this.onloadend) this.onloadend();
           }, 0);
        });
      }
    }
    
    vi.spyOn(window, 'FileReader').mockImplementation(MockFileReader as any);

    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    // It now routes through aiBridge -> geminiService -> visionIdentification
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'visionIdentification');
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { 
        success: true, 
        text: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) 
      } 
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
    // It now routes through aiBridge -> callGemini (task: chat)
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callGemini');
  });

  it('fetchAvailableModels should use global fetch', async () => {
    const mockModels = [{ id: 'gpt-4', name: 'GPT-4' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockModels })
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual(mockModels);
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    mockCallFunction.mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Analysis unavailable.'); // Updated to match actual fallback in geminiService
  }, 15000); // Increase timeout for retries
});