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

    // Clear static settings cache on openRouterService
    (openRouterService as any).cachedSettings = null;
    (openRouterService as any).settingsCacheTime = 0;

    // Mock global fetch
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"suggestions": ["Hello", "Hi"]}' } }],
          data: [{ id: 'gpt-4', name: 'GPT-4' }]
        }),
        text: () => Promise.resolve('{"suggestions": ["Hello", "Hi"]}')
      } as any)
    );
  });

  it('analyzeImageForDescription should call fetch with correct parameters', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      provider: 'openrouter',
      fallbackToGemini: true,
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: {
        vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
        visionIdentification: 'nvidia/nemotron-nano-12b-v2-vl:free',
        triage: 'qwen/qwen-2.5-72b-instruct:free',
        healthAssessment: 'qwen/qwen-2.5-72b-instruct:free',
        chat: 'qwen/qwen-2.5-72b-instruct:free',
        matching: 'qwen/qwen-2.5-72b-instruct:free',
        smartSearch: 'qwen/qwen-2.5-72b-instruct:free',
        blogGeneration: 'qwen/qwen-2.5-coder-32b-instruct:free'
      },
      lastUpdated: Date.now(),
      updatedBy: 'admin'
    } as any);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'A cute dog' } }] })
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
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-api-key'
      })
    }));
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      provider: 'openrouter',
      fallbackToGemini: true,
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: {
        chat: 'qwen/qwen-2.5-72b-instruct:free'
      },
      lastUpdated: Date.now(),
      updatedBy: 'admin'
    } as any);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: '{"suggestions": ["Hello", "Hi"]}' } }] })
    } as any);

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
  });

  it('fetchAvailableModels should fetch openrouter models directly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'gpt-4', name: 'GPT-4' }] })
    } as any);

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(dbService.getAISettings).mockResolvedValue({
      provider: 'openrouter',
      fallbackToGemini: true,
      apiKeys: { openrouter: 'test-api-key' },
      modelMapping: {
        triage: 'qwen/qwen-2.5-72b-instruct:free'
      },
      lastUpdated: Date.now(),
      updatedBy: 'admin'
    } as any);

    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});
