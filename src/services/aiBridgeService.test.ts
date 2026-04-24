import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiBridgeService } from './aiBridgeService';
import { dbService } from './firebase';
import { adminService } from './adminService';
import * as geminiService from './geminiService';
import { openRouterService } from './openRouterService';

vi.mock('./firebase', () => ({
  dbService: {
    getAISettings: vi.fn(),
  },
  db: {},
  auth: { currentUser: { email: 'admin@test.com' } }
}));

vi.mock('./adminService', () => ({
  adminService: {
    getAISettings: vi.fn(),
  }
}));

vi.mock('./geminiService', () => ({
  analyzeImageForDescription: vi.fn(),
  performAIHealthCheck: vi.fn(),
  generateChatSuggestions: vi.fn(),
  comparePets: vi.fn(),
}));

vi.mock('./openRouterService', () => ({
  openRouterService: {
    analyzeImageForDescription: vi.fn(),
    performAIHealthCheck: vi.fn(),
    generateChatSuggestions: vi.fn(),
    comparePets: vi.fn(),
  }
}));

describe('aiBridgeService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear the cache in aiBridgeService before each test
    await aiBridgeService.getSettings(true);
  });

  it('should delegate to Gemini when provider is google', async () => {
    (adminService.getAISettings as any).mockResolvedValue({ provider: 'google', modelMapping: {} });
    (geminiService.analyzeImageForDescription as any).mockResolvedValue('Gemini Desc');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('Gemini Desc');
    expect(geminiService.analyzeImageForDescription).toHaveBeenCalled();
    expect(openRouterService.analyzeImageForDescription).not.toHaveBeenCalled();
  });

  it('should delegate to OpenRouter when provider is openrouter', async () => {
    (adminService.getAISettings as any).mockResolvedValue({ provider: 'openrouter', modelMapping: {} });
    // Since we cleared cache in beforeEach, we just need to ensure the mock is set before it's used.
    // However, aiBridgeService might have already called getAISettings if something else triggered it.
    // To be absolutely sure, we force refresh again after setting the mock.
    await aiBridgeService.getSettings(true);

    (openRouterService.analyzeImageForDescription as any).mockResolvedValue('OpenRouter Desc');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('OpenRouter Desc');
    expect(openRouterService.analyzeImageForDescription).toHaveBeenCalled();
    expect(geminiService.analyzeImageForDescription).not.toHaveBeenCalled();
  });

  it('should default to Gemini if settings fail', async () => {
    (adminService.getAISettings as any).mockRejectedValue(new Error('DB Error'));
    await aiBridgeService.getSettings(true);

    (geminiService.analyzeImageForDescription as any).mockResolvedValue('Gemini Default');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('Gemini Default');
    expect(geminiService.analyzeImageForDescription).toHaveBeenCalled();
  });
});