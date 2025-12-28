/// <reference types="vitest/globals" />
import { vetService } from './vetService';
import { logger } from './loggerService';
import { auth } from './firebase';
import type { Mock } from 'vitest';
import { getDocs, setDoc, deleteDoc } from 'firebase/firestore';

vi.mock('./loggerService');
vi.mock('./firebase', () => ({
    auth: { currentUser: null },
    db: { _isFirestore: true }
}));

describe('vetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (auth.currentUser as any) = null;
    });

    describe('getVetClinics', () => {
        it('should return clinics', async () => {
            const mockSnapshot = {
                docs: [
                    { id: 'c1', data: () => ({ name: 'Clinic 1' }) }
                ]
            };
            (getDocs as Mock).mockResolvedValue(mockSnapshot);

            const clinics = await vetService.getVetClinics();
            expect(clinics).toHaveLength(1);
            expect(clinics[0].id).toBe('c1');
        });

        it('should log error and re-throw on failure', async () => {
            const mockError = new Error('Fetch failed');
            (getDocs as Mock).mockRejectedValue(mockError);

            await expect(vetService.getVetClinics()).rejects.toThrow(mockError);
            expect(logger.error).toHaveBeenCalledWith('Error fetching vet clinics:', mockError);
        });
    });

    describe('saveClinic', () => {
        it('should throw error if not authenticated', async () => {
            await expect(vetService.saveClinic({ id: 'c1' } as any)).rejects.toThrow('Authentication required');
        });

        it('should save clinic if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'vet-1' };
            (setDoc as Mock).mockResolvedValue(undefined);

            await vetService.saveClinic({ name: 'My Clinic' } as any);
            expect(setDoc).toHaveBeenCalled();
        });

        it('should log error and re-throw', async () => {
            (auth.currentUser as any) = { uid: 'vet-1' };
            const mockError = new Error('Save failed');
            (setDoc as Mock).mockRejectedValue(mockError);

            await expect(vetService.saveClinic({ id: 'c1' } as any)).rejects.toThrow(mockError);
            expect(logger.error).toHaveBeenCalledWith('Error saving vet clinic:', mockError);
        });
    });

    describe('getAppointments', () => {
        it('should throw error if not authenticated', async () => {
            await expect(vetService.getAppointments()).rejects.toThrow('Authentication required');
        });

        it('should return appointments if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'vet-1' };
            (getDocs as Mock).mockResolvedValue({ docs: [] });
            await vetService.getAppointments();
            expect(getDocs).toHaveBeenCalled();
        });
        
        it('should log error and re-throw', async () => {
             (auth.currentUser as any) = { uid: 'vet-1' };
             (getDocs as Mock).mockRejectedValue(new Error('fail'));
             await expect(vetService.getAppointments()).rejects.toThrow('fail');
             expect(logger.error).toHaveBeenCalled();
        });
    });
});
