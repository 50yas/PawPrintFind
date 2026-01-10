import { emailService } from './emailService';
import { logger } from './loggerService';
import type { Mock } from 'vitest';
import { addDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    beforeEach(() => {
        vi.clearAllMocks();
    });

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
            
            const result = await emailService.sendEmail('test@example.com', 'Subject', 'Body');
            expect(result.success).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to queue email'), mockError);
        });
    });

    it('sendWelcomeEmail calls sendEmail with correct role content', async () => {
        const spy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
        
        await emailService.sendWelcomeEmail('owner@test.com', 'owner');
        expect(spy).toHaveBeenCalledWith('owner@test.com', 'Welcome to Paw Print! 🐾', expect.stringContaining('Welcome to the Family'));

        await emailService.sendWelcomeEmail('vet@test.com', 'vet');
        expect(spy).toHaveBeenCalledWith('vet@test.com', 'Welcome Partner! 🏥', expect.stringContaining('Welcome Partner Clinic'));
    });

    it('sendLostPetAlert calls sendEmail if recipients exist', async () => {
        const spy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
        const mockPet: any = { name: 'Buddy', breed: 'Lab', lastSeenLocation: { latitude: 0, longitude: 0 }, photos: [{url: ''}] };
        
        await emailService.sendLostPetAlert(mockPet, ['r1@test.com']);
        expect(spy).toHaveBeenCalledWith('alerts@pawprint.ai', expect.stringContaining('Buddy'), expect.any(String), undefined, ['r1@test.com']);
    });

    it('sendAppointmentConfirmation calls sendEmail', async () => {
        const spy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
        const mockAppt: any = { petName: 'Buddy', date: '2026-01-10', time: '10:00' };
        
        await emailService.sendAppointmentConfirmation(mockAppt, 'owner@test.com');
        expect(spy).toHaveBeenCalledWith('owner@test.com', expect.stringContaining('Buddy'), expect.stringContaining('Appointment Details'));
    });

    it('send (generic) works correctly', async () => {
        const spy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
        
        const result = await emailService.send({ to_email: 'test@test.com', to_name: 'Test', message: 'Hello' });
        expect(result.success).toBe(true);
        expect(spy).toHaveBeenCalledWith('test@test.com', 'Paw Print Notification', expect.stringContaining('Hello Test'));
    });
});