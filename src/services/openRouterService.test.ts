import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { dbService } from './firebase';

vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn().mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-key' },
      modelMapping: {
        vision: 'google/gemini-2.5-flash',
        triage: 'google/gemini-2.5-pro',
        chat: 'google/gemini-2.5-flash',
        matching: 'google/gemini-2.5-pro'
      }
    })
  }
}));

describe('openRouterService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    // Reset cache by resetting internal stale variables (since we can't easily, we just ensure mock getAISettings resolved)
    (openRouterService as any).cachedSettings = null;
  });

  it('analyzeImageForDescription should call openrouter completions endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'A cute dog', role: 'assistant' } }]
      })
    });
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    class MockFileReader {
      readAsDataURL = vi.fn();
      onloadend = vi.fn();
      result = 'data:image/jpeg;base64,BASE64_CONTENT';
      
      constructor() {
        this.readAsDataURL.mockImplementation(() => {
           setTimeout(() => {
             if (this.onloadend) this.onloadend();
           }, 0);
        });
      }
    }
    
    vi.spyOn(window, 'FileReader').mockImplementation(MockFileReader as any);

    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }), role: 'assistant' } }]
      })
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should fetch openrouter models endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [{ id: 'gpt-4', name: 'GPT-4' }]
      })
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
  });

  it('should handle errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    await expect(openRouterService.performAIHealthCheck({} as any, 'cough')).rejects.toThrow('API Error');
  });
});
