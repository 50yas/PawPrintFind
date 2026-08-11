import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { dbService } from './firebase';

// Mock Firebase dbService
vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn(),
  },
}));

describe('openRouterService', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch as any;

    // Default settings mock
    (dbService.getAISettings as any).mockResolvedValue({
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: {
        vision: 'google/gemini-2.5-flash',
        triage: 'google/gemini-2.5-pro',
        chat: 'google/gemini-2.5-flash',
        matching: 'google/gemini-2.5-pro',
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('analyzeImageForDescription should perform direct fetch to OpenRouter with base64 content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A beautiful cat' } }]
      }),
    });

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader
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

    expect(result).toBe('A beautiful cat');
    expect(mockFetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-api-key',
      }),
    }));
  });

  it('generateChatSuggestions should parse JSON suggestions from fetch response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }]
      }),
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should call direct openrouter endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4', name: 'GPT-4' }]
      }),
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(mockFetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully by returning fallback', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});
