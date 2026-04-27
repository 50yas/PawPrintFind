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

    it('should route all requests through unified aiService (via Cloud Functions)', async () => {
        vi.mocked(adminService.getAISettings).mockResolvedValue({
            provider: 'openrouter',
            modelMapping: { vision: 'model', triage: 'model', chat: 'model', matching: 'model' },
            lastUpdated: Date.now(),
            updatedBy: 'admin'
        });

        const result = await aiBridgeService.analyzeImageForDescription(new File([], 'pet.jpg'));

        expect(result).toBe('AI Desc');
        expect(aiService.analyzeImageForDescription).toHaveBeenCalled();
    });

    it('should default to Gemini if settings fail', async () => {
        vi.mocked(adminService.getAISettings).mockRejectedValue(new Error('Fail'));

        const result = await aiBridgeService.analyzeImageForDescription(new File([], 'pet.jpg'));
        expect(result).toBe('AI Desc');
        expect(aiService.analyzeImageForDescription).toHaveBeenCalled();
    });
});
