import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiBridgeService } from './aiBridgeService';
import { dbService } from './firebase';
import * as geminiService from './geminiService';
import * as openRouterService from './openRouterService';

vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn(),
  },
}));

vi.mock('./geminiService', () => ({
  analyzeImageForDescription: vi.fn(),
  performAIHealthCheck: vi.fn(),
  generateChatSuggestions: vi.fn(),
  comparePets: vi.fn(),
}));

vi.mock('./openRouterService', () => ({
  analyzeImageForDescription: vi.fn(),
  performAIHealthCheck: vi.fn(),
  generateChatSuggestions: vi.fn(),
  comparePets: vi.fn(),
}));

describe('aiBridgeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate to Gemini when provider is google', async () => {
    (dbService.getAISettings as any).mockResolvedValue({ provider: 'google' });
    (geminiService.analyzeImageForDescription as any).mockResolvedValue('Gemini Desc');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('Gemini Desc');
    expect(geminiService.analyzeImageForDescription).toHaveBeenCalled();
    expect(openRouterService.analyzeImageForDescription).not.toHaveBeenCalled();
  });

  it('should delegate to OpenRouter when provider is openrouter', async () => {
    (dbService.getAISettings as any).mockResolvedValue({ provider: 'openrouter' });
    (openRouterService.analyzeImageForDescription as any).mockResolvedValue('OpenRouter Desc');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('OpenRouter Desc');
    expect(openRouterService.analyzeImageForDescription).toHaveBeenCalled();
    expect(geminiService.analyzeImageForDescription).not.toHaveBeenCalled();
  });

  it('should default to Gemini if settings fail', async () => {
    (dbService.getAISettings as any).mockRejectedValue(new Error('DB Error'));
    (geminiService.analyzeImageForDescription as any).mockResolvedValue('Gemini Default');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('Gemini Default');
    expect(geminiService.analyzeImageForDescription).toHaveBeenCalled();
  });
});