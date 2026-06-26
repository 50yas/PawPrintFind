import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { aiBridgeService } from './aiBridgeService';
import { httpsCallable } from 'firebase/functions';

// Mock Dependencies
vi.mock('./aiBridgeService', () => ({
    aiBridgeService: {
        analyzeImageForDescription: vi.fn(),
        performAIHealthCheck: vi.fn(),
        generateChatSuggestions: vi.fn(),
        comparePets: vi.fn(),
        generateMatchExplanation: vi.fn(),
        chat: vi.fn(),
    }
}));

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

    it('analyzeImageForDescription should delegate to aiBridgeService', async () => {
        vi.mocked(aiBridgeService.analyzeImageForDescription).mockResolvedValue('A cute dog');
        const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
        const result = await openRouterService.analyzeImageForDescription(file);
        expect(result).toBe('A cute dog');
        expect(aiBridgeService.analyzeImageForDescription).toHaveBeenCalledWith(file);
    });

    it('fetchAvailableModels should call fetchOpenRouterModels cloud function', async () => {
        mockCallFunction.mockResolvedValue({
            data: { models: [{ id: 'gpt-4', name: 'GPT-4' }] }
        });

        const result = await openRouterService.fetchAvailableModels();

        expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
        expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'fetchOpenRouterModels');
    });
});