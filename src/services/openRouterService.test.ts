import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { dbService } from './firebase';

vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn()
  }
}));

describe('openRouterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Clear cache by resetting internal fields if needed
    (openRouterService as any).cachedSettings = null;
    (openRouterService as any).settingsCacheTime = 0;
  });

  it('analyzeImageForDescription should call openrouter api with correct parameters', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: { vision: 'test-model' }
    } as any);

    const mockResponse = {
      choices: [{ message: { content: 'A cute dog', role: 'assistant' } }]
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any);

    // Create a dummy file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader class
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
          'Authorization': 'Bearer test-api-key'
        }),
        body: expect.stringContaining('test-model')
      })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: { chat: 'test-chat-model' }
    } as any);

    const mockResponse = {
      choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }), role: 'assistant' } }]
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any);

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should call openrouter models endpoint', async () => {
    const mockResponse = {
      data: [{ id: 'gpt-4', name: 'GPT-4' }]
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any);

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: { chat: 'test-model' }
    } as any);

    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const result = await openRouterService.generateMatchExplanation({} as any, {});

    expect(result).toBe('Matches your preferences.');
  });
});
