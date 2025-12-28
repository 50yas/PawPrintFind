/// <reference types="vitest/globals" />
import { recordInteractionAsDonation } from './donationService';
import { dbService } from './firebase';
import { logger } from './loggerService';
import type { Mock } from 'vitest';

vi.mock('./loggerService');
vi.mock('./firebase', () => ({
    dbService: {
        recordDonation: vi.fn(),
        getDonations: vi.fn()
    }
}));

describe('donationService', () => {
    describe('recordInteractionAsDonation', () => {
        it('should call dbService.recordDonation with correct data', async () => {
            (dbService.recordDonation as Mock).mockResolvedValue(undefined);
            const result = await recordInteractionAsDonation('tier1', '€50.00');
            expect(dbService.recordDonation).toHaveBeenCalled();
            expect(result.numericValue).toBe(50);
        });

        it('should propagate error from dbService', async () => {
            // Since donationService doesn't have try/catch, it should propagate.
            // But we might want it to handle it? The task is "improved error handling".
            // If it propagates, the caller must handle it. 
            // Let's assume for now it propagates, and we verify that.
            
            const mockError = new Error('DB Error');
            (dbService.recordDonation as Mock).mockRejectedValue(mockError);
            
            await expect(recordInteractionAsDonation('tier1', '€50.00')).rejects.toThrow(mockError);
        });
    });
});
