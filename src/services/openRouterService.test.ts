import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

vi.mock('./firebase', () => ({
  functions: {},
  dbService: {
    getAISettings: vi.fn(),
  },
}));

import { dbService } from './firebase';

describe('openRouterService', () => {
  const mockCallFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    (httpsCallable as any).mockReturnValue(mockCallFunction);
    // Mock global fetch for direct HTTP calls in openRouterService
    global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/models')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: [{ id: 'gpt-4', name: 'GPT-4' }] }),
            });
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ choices: [{ message: { content: 'A cute dog' } }] }),
        });
    });
  });

  it('analyzeImageForDescription should call fetch with base64 image data', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      apiKeys: { openrouter: 'test-key' },
      modelMapping: { vision: 'nvidia/nemotron-nano-12b-v2-vl:free' }
    } as any);

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
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      apiKeys: { openrouter: 'test-key' },
      modelMapping: { chat: 'qwen/qwen-2.5-72b-instruct:free' }
    } as any);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) } }]
      })
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should call openrouter public models endpoint', async () => {
    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});