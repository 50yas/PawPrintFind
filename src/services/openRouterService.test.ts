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
}));

describe('openRouterService', () => {
  const mockCallFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (httpsCallable as any).mockReturnValue(mockCallFunction);
  });

  it('call should call cloud function with correct parameters', async () => {
    mockCallFunction.mockResolvedValue({ data: { success: true, text: 'A response' } });
    
    const result = await openRouterService.call('gpt-4', [{ role: 'user', content: 'hi' }], {}, 'chat');

    expect(result).toBe('A response');
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callOpenRouter');
    expect(mockCallFunction).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'hi' }],
        config: {},
        task: 'chat'
    });
  });

  it('fetchAvailableModels should call fetchOpenRouterModels cloud function', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { models: [{ id: 'gpt-4', name: 'GPT-4' }] } 
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'fetchOpenRouterModels');
  });

  it('fetchAvailableModels should fallback to direct fetch if cloud function fails', async () => {
    mockCallFunction.mockRejectedValue(new Error('Auth required'));

    const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'claude-3', name: 'Claude 3' }] })
    });
    global.fetch = mockFetch;

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'claude-3', name: 'Claude 3' }]);
    expect(mockFetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });
});
