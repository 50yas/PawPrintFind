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
    (openRouterService as any).cachedSettings = null;
    vi.stubGlobal('fetch', vi.fn());
  });

  it('analyzeImageForDescription should perform OpenRouter completion', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-key' },
      modelMapping: {
        vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
        visionIdentification: 'nvidia/nemotron-nano-12b-v2-vl:free',
        triage: 'qwen/qwen-2.5-72b-instruct:free',
        healthAssessment: 'qwen/qwen-2.5-72b-instruct:free',
        chat: 'qwen/qwen-2.5-72b-instruct:free',
        matching: 'qwen/qwen-2.5-72b-instruct:free',
        smartSearch: 'qwen/qwen-2.5-72b-instruct:free',
        blogGeneration: 'qwen/qwen-2.5-coder-32b-instruct:free',
      },
      lastUpdated: Date.now(),
      updatedBy: 'admin',
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A cute dog' } }],
      }),
    } as any);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });

    class MockFileReader {
      readAsDataURL = vi.fn().mockImplementation(function (this: any) {
        setTimeout(() => {
          this.result = 'data:image/jpeg;base64,BASE64_CONTENT';
          if (this.onloadend) this.onloadend();
        }, 0);
      });
    }

    vi.spyOn(window, 'FileReader').mockImplementation(MockFileReader as any);

    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-key' },
      modelMapping: {
        vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
        visionIdentification: 'nvidia/nemotron-nano-12b-v2-vl:free',
        triage: 'qwen/qwen-2.5-72b-instruct:free',
        healthAssessment: 'qwen/qwen-2.5-72b-instruct:free',
        chat: 'qwen/qwen-2.5-72b-instruct:free',
        matching: 'qwen/qwen-2.5-72b-instruct:free',
        smartSearch: 'qwen/qwen-2.5-72b-instruct:free',
        blogGeneration: 'qwen/qwen-2.5-coder-32b-instruct:free',
      },
      lastUpdated: Date.now(),
      updatedBy: 'admin',
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }],
      }),
    } as any);

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should call openrouter models endpoint', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4', name: 'GPT-4' }],
      }),
    } as any);

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});