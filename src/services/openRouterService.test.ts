import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { dbService } from './firebase';

vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn(),
  },
}));

describe('openRouterService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('location', { origin: 'http://localhost' });

    vi.mocked(dbService.getAISettings).mockResolvedValue({
        provider: 'openrouter',
        fallbackToGemini: true,
        apiKeys: { openrouter: 'mock-key', google: 'mock-key' },
        modelMapping: {
            vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
            triage: 'qwen/qwen-2.5-72b-instruct:free',
            chat: 'qwen/qwen-2.5-72b-instruct:free',
            matching: 'qwen/qwen-2.5-72b-instruct:free',
        }
    } as any);
  });

  it('analyzeImageForDescription should fetch from OpenRouter with correct parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A cute dog', role: 'assistant' } }]
      })
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
          'Authorization': 'Bearer mock-key'
        })
      })
    );
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }), role: 'assistant' } }]
      })
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should call fetch available models from public endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4', name: 'GPT-4' }]
      })
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(mockFetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});