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
        const validClinic = {
            vetEmail: 'vet@test.com',
            name: 'Clinic 1',
            address: '123 Main St',
            phone: '555-1234'
        };

        it('should return clinics', async () => {
            const mockSnapshot = {
                docs: [
                    { id: 'c1', data: () => ({ ...validClinic }) }
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
            const validClinic = {
                vetEmail: 'vet@test.com',
                name: 'My Clinic',
                address: '123 Main St',
                phone: '555-1234'
            };

            await vetService.saveClinic(validClinic as any);
            expect(setDoc).toHaveBeenCalled();
        });

        it('should log error and re-throw', async () => {
            (auth.currentUser as any) = { uid: 'vet-1' };
            const mockError = new Error('Save failed');
            (setDoc as Mock).mockRejectedValue(mockError);
            const validClinic = {
                vetEmail: 'vet@test.com',
                name: 'My Clinic',
                address: '123 Main St',
                phone: '555-1234'
            };

            await expect(vetService.saveClinic(validClinic as any)).rejects.toThrow(mockError);
            expect(logger.error).toHaveBeenCalledWith('Error saving vet clinic:', mockError);
        });
    });

    describe('getAppointments', () => {
        const validAppt = {
            vetEmail: 'vet@test.com',
            petId: 'p1',
            petName: 'Buddy',
            date: '2023-01-01',
            time: '10:00',
            notes: 'Checkup',
            status: 'pending',
            requestedBy: 'owner'
        };

        it('should throw error if not authenticated', async () => {
            await expect(vetService.getAppointments()).rejects.toThrow('Authentication required');
        });

        it('should return appointments if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'vet-1' };
            (getDocs as Mock).mockResolvedValue({ 
                docs: [{ id: 'a1', data: () => ({ ...validAppt }) }] 
            });
            const appts = await vetService.getAppointments();
            expect(getDocs).toHaveBeenCalled();
            expect(appts).toHaveLength(1);
        });
        
        it('should log error and re-throw', async () => {
             (auth.currentUser as any) = { uid: 'vet-1' };
             (getDocs as Mock).mockRejectedValue(new Error('fail'));
             await expect(vetService.getAppointments()).rejects.toThrow('fail');
             expect(logger.error).toHaveBeenCalled();
        });
    });
});
