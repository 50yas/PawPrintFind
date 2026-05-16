
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './aiService';
import { httpsCallable } from 'firebase/functions';

vi.mock('firebase/functions', () => ({
    httpsCallable: vi.fn(),
}));

vi.mock('./firebase', () => ({
    functions: {},
}));

vi.mock('./monitoringService', () => ({
    captureError: vi.fn(),
}));

describe('aiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call visionIdentification for autoFillPetDetails', async () => {
        const mockFn = vi.fn().mockResolvedValue({ data: { success: true, text: '{"breed": "Labrador"}' } });
        (httpsCallable as any).mockReturnValue(mockFn);

        const mockFile = new File([''], 'pet.jpg', { type: 'image/jpeg' });
        const result = await aiService.autoFillPetDetails(mockFile);

        expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'visionIdentification');
        expect(result.breed).toBe('Labrador');
    });

    it('should call callGemini (universal caller) for chat', async () => {
        const mockFn = vi.fn().mockResolvedValue({ data: { success: true, text: 'Hello!' } });
        (httpsCallable as any).mockReturnValue(mockFn);

        const history = [{ role: 'user' as const, text: 'Hi' }];
        const result = await aiService.chat(history, 'System prompt');

        expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callGemini');
        expect(result).toBe('Hello!');
    });

    it('should calculate profile completeness correctly', () => {
        const mockPet: any = {
            name: 'Buddy',
            breed: 'Golden Retriever',
            photos: [{}, {}],
            homeLocations: [{}],
            medicalRecord: { vaccinations: [{}] }
        };

        const score = aiService.calculateProfileCompleteness(mockPet);
        expect(score).toBe(60); // 20 (name/breed) + 20 (2 photos) + 10 (home) + 10 (medical)
    });
});
