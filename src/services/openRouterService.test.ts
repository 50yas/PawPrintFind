import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { httpsCallable } from 'firebase/functions';
import { dbService } from './firebase';

// Mock Firebase Functions & dbService
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

vi.mock('./firebase', () => ({
  functions: {},
  dbService: {
    getAISettings: vi.fn().mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-openrouter-key' },
      modelMapping: {}
    })
  }
}));

// Mock global fetch to prevent actual network calls to OpenRouter
global.fetch = vi.fn();

describe('openRouterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (dbService.getAISettings as any).mockResolvedValue({
      provider: 'openrouter',
      apiKeys: { openrouter: 'test-openrouter-key' },
      modelMapping: {}
    });
  });

  it('analyzeImageForDescription should perform OpenRouter API fetch with base64 image', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A cute dog' } }]
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
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-openrouter-key'
        })
      })
    );
  });

  it('generateChatSuggestions should parse JSON response from fetch', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }]
      })
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchAvailableModels should fetch openrouter public models', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4', name: 'GPT-4' }]
      })
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});