import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { dbService } from './firebase';

vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn(),
  },
}));

describe('openRouterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (dbService.getAISettings as any).mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: { vision: 'google/gemini-2.5-flash', chat: 'google/gemini-2.5-flash' },
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  it('analyzeImageForDescription should perform OpenRouter API call', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A cute dog' } }] }),
    });

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });

    class MockFileReader {
      readAsDataURL = vi.fn().mockImplementation(function (this: any) {
        this.result = 'data:image/jpeg;base64,BASE64_CONTENT';
        if (this.onloadend) this.onloadend();
      });
    }
    vi.spyOn(window, 'FileReader').mockImplementation(MockFileReader as any);

    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    expect(globalThis.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-api-key',
      }),
    }));
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }] }),
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should fetch openrouter models endpoint', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'gpt-4', name: 'GPT-4' }] }),
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(globalThis.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});