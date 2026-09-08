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
      apiKeys: { openrouter: 'test-openrouter-key' },
      modelMapping: {
        vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
        triage: 'qwen/qwen-2.5-72b-instruct:free',
        chat: 'qwen/qwen-2.5-72b-instruct:free',
      },
    });
  });

  it('analyzeImageForDescription should fetch OpenRouter API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A cute dog' } }]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

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
          Authorization: 'Bearer test-openrouter-key'
        })
      })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should fetch public OpenRouter models', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4', name: 'GPT-4' }]
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
  });

  it('should handle errors gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});