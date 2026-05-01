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

  it('fetchAvailableModels should call fetchOpenRouterModels cloud function', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { models: [{ id: 'gpt-4', name: 'GPT-4' }] } 
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'fetchOpenRouterModels');
  });

  it('should handle errors in fetchAvailableModels gracefully', async () => {
    mockCallFunction.mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([]);
  });
});
