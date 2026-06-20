import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { aiBridgeService } from './aiBridgeService';

// Mock aiBridgeService since openRouterService now delegates to it
vi.mock('./aiBridgeService', () => ({
  aiBridgeService: {
    analyzeImageForDescription: vi.fn(),
    performAIHealthCheck: vi.fn(),
    generateChatSuggestions: vi.fn(),
    comparePets: vi.fn(),
    generateMatchExplanation: vi.fn(),
    chat: vi.fn(),
    getSettings: vi.fn(),
  }
}));

describe('openRouterService (Delegation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('analyzeImageForDescription should delegate to aiBridgeService', async () => {
    const file = new File([''], 'test.jpg');
    (aiBridgeService.analyzeImageForDescription as any).mockResolvedValue('A dog');
    
    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A dog');
    expect(aiBridgeService.analyzeImageForDescription).toHaveBeenCalledWith(file);
  });

  it('performAIHealthCheck should delegate to aiBridgeService', async () => {
    (aiBridgeService.performAIHealthCheck as any).mockResolvedValue('Health report');

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health report');
    expect(aiBridgeService.performAIHealthCheck).toHaveBeenCalledWith({} as any, 'cough', 'en');
  });

  it('fetchAvailableModels should still call fetch directly', async () => {
    const mockModels = [{ id: 'm1', name: 'Model 1' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockModels })
    });

    const result = await openRouterService.fetchAvailableModels();
    expect(result).toEqual(mockModels);
  });
});
