
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from './analyticsService';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { logger } from './loggerService';

vi.mock('firebase/analytics', () => ({
    getAnalytics: vi.fn(),
    logEvent: vi.fn()
}));

vi.mock('./firebase', () => ({
    auth: { currentUser: { uid: 'user-123' } }
}));

vi.mock('./loggerService', () => ({
    logger: {
        info: vi.fn()
    }
}));

describe('analyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        global.window = {}; // Ensure window is defined for getAnalytics
    });

    it('should log an event with enriched parameters', () => {
        (getAnalytics as any).mockReturnValue({});
        
        analyticsService.logEvent('smart_search_performed', { query: 'test' });
        
        expect(logEvent).toHaveBeenCalledWith(
            expect.any(Object),
            'smart_search_performed',
            expect.objectContaining({
                query: 'test',
                user_id: 'user-123',
                timestamp: expect.any(Number)
            })
        );
        expect(logger.info).toHaveBeenCalled();
    });

    it('should track adoption inquiries specifically', () => {
        (getAnalytics as any).mockReturnValue({});
        
        analyticsService.trackAdoptionInquiry('pet-1', 'Buddy');
        
        expect(logEvent).toHaveBeenCalledWith(
            expect.any(Object),
            'adopt_inquiry',
            expect.objectContaining({
                pet_id: 'pet-1',
                pet_name: 'Buddy'
            })
        );
    });
});
