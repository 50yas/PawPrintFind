/// <reference types="vitest/globals" />
import { emailService } from './emailService';
import { logger } from './loggerService';
import type { Mock } from 'vitest';
import { addDoc } from 'firebase/firestore';

vi.mock('./loggerService');
vi.mock('./firebase', () => ({
    db: { _isFirestore: true }
}));
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        collection: vi.fn(),
        addDoc: vi.fn(),
    };
});

describe('emailService', () => {
    describe('sendEmail', () => {
        it('should call addDoc with correct parameters', async () => {
            (addDoc as Mock).mockResolvedValue({ id: 'mail1' });
            const result = await emailService.sendEmail('test@example.com', 'Subject', 'Body');
            expect(addDoc).toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        it('should log error using loggerService on failure', async () => {
            const mockError = new Error('Mail failed');
            (addDoc as Mock).mockRejectedValue(mockError);
            
            // Note: emailService.sendEmail catches the error and returns { success: false, error }
            // It currently logs to console.error. We want it to use logger.error.
            
            // To test this failure (Red phase), we expect logger.error to be called.
            // If the code uses console.error, this expectation will fail.
            
            const result = await emailService.sendEmail('test@example.com', 'Subject', 'Body');
            expect(result.success).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to queue email'), mockError);
        });
    });
});
