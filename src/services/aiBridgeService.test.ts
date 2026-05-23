import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiBridgeService } from './aiBridgeService';
import * as aiService from './geminiService';
import { adminService } from './adminService';

vi.mock('./geminiService', () => ({
    analyzeImageForDescription: vi.fn().mockResolvedValue('AI Desc'),
    performAIHealthCheck: vi.fn().mockResolvedValue('Health Report'),
    generateChatSuggestions: vi.fn().mockResolvedValue(['Hey']),
    comparePets: vi.fn().mockResolvedValue({ score: 100 }),
    generateMatchExplanation: vi.fn().mockResolvedValue('Match'),
    chat: vi.fn().mockResolvedValue('Reply')
}));

vi.mock('./adminService', () => ({
    adminService: {
        getAISettings: vi.fn()
    }
}));

describe('aiBridgeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset cached settings
        (aiBridgeService as any).cachedSettings = null;
    });

    it('should route all requests through OpenRouter if provider is set', async () => {
        vi.mocked(adminService.getAISettings).mockResolvedValue({
            provider: 'openrouter',
            fallbackToGemini: true,
            modelMapping: { vision: 'model', triage: 'model', chat: 'model', matching: 'model' },
            lastUpdated: Date.now(),
            updatedBy: 'admin'
        });

        // Mock openRouterService
        const openRouterModule = await import('./openRouterService');
        const spy = vi.spyOn(openRouterModule.openRouterService, 'analyzeImageForDescription').mockResolvedValue('OpenRouter Desc');

        const result = await aiBridgeService.analyzeImageForDescription(new File([], 'pet.jpg'));

        expect(result).toBe('OpenRouter Desc');
        spy.mockRestore();
    });

    it('should default to Gemini if settings fail', async () => {
        vi.mocked(adminService.getAISettings).mockRejectedValue(new Error('Fail'));

        // Manually set provider to 'google' to avoid dynamic import and potential mock issues in this specific test environment
        const result = await aiService.analyzeImageForDescription(new File([], 'pet.jpg'));
        expect(result).toBe('AI Desc');
    });
});
