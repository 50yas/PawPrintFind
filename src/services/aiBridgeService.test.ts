import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiBridgeService } from './aiBridgeService';
import { adminService } from './adminService';
import * as geminiService from './geminiService';

vi.mock('./adminService', () => ({
  adminService: {
    getAISettings: vi.fn(),
  },
}));

vi.mock('./geminiService', () => ({
  analyzeImageForDescription: vi.fn(),
  performAIHealthCheck: vi.fn(),
  generateChatSuggestions: vi.fn(),
  comparePets: vi.fn(),
  generateMatchExplanation: vi.fn(),
  chat: vi.fn(),
}));

describe('aiBridgeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state of aiBridgeService if possible,
    // or just ensure we force refresh settings if the service supports it.
  });

  it('should route through geminiService (which acts as a proxy for Cloud Functions)', async () => {
    (adminService.getAISettings as any).mockResolvedValue({ provider: 'google' });
    (geminiService.analyzeImageForDescription as any).mockResolvedValue('AI Response');

    const result = await aiBridgeService.analyzeImageForDescription(new File([], 'test.jpg'));

    expect(result).toBe('AI Response');
    expect(geminiService.analyzeImageForDescription).toHaveBeenCalled();
  });

  it('should initialize settings only once (singleton promise)', async () => {
    (adminService.getAISettings as any).mockResolvedValue({ provider: 'google' });

    // Concurrent calls
    const p1 = aiBridgeService.init();
    const p2 = aiBridgeService.init();

    await Promise.all([p1, p2]);

    expect(adminService.getAISettings).toHaveBeenCalledTimes(1);
  });
});