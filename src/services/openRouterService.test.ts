import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { dbService } from './firebase';

// Mock firebase
vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('openRouterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup for getAISettings
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: {
        vision: 'test-vision-model',
        triage: 'test-triage-model',
        chat: 'test-chat-model',
      },
    } as any);
  });

  it('analyzeImageForDescription should call fetch with correct parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A cute dog', role: 'assistant' } }],
      }),
    });

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
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
        body: expect.stringContaining('test-vision-model'),
      })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }), role: 'assistant' } }],
      }),
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('test-chat-model'),
      })
    );
  });

  it('fetchAvailableModels should call openrouter models endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4', name: 'GPT-4' }],
      }),
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(mockFetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    await expect(openRouterService.performAIHealthCheck({} as any, 'cough'))
      .rejects.toThrow('API Error');
  });
});
