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
    global.fetch = vi.fn();
    (openRouterService as any).getSettings.cachedSettings = null;
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-key' },
      modelMapping: {
        vision: 'google/gemini-2.5-flash',
        triage: 'google/gemini-2.5-pro',
        chat: 'google/gemini-2.5-flash',
        matching: 'google/gemini-2.5-pro',
      },
      lastUpdated: Date.now(),
      updatedBy: 'admin@pawprint.ai',
    } as any);
  });

  it('analyzeImageForDescription should call openrouter endpoint with image', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'A cute dog' } }] }),
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
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }],
      }),
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should call fetch on openrouter models endpoint', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'gpt-4', name: 'GPT-4' }] }),
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});