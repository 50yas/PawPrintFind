
import {
    collection, getDocs, setDoc, doc, deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { VetClinic, Appointment } from '../types';
import { logger } from './loggerService';

export const vetService = {
    async getVetClinics(): Promise<VetClinic[]> {
        try {
            const snap = await getDocs(collection(db, 'vet_clinics'));
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as VetClinic));
        } catch (error) {
            logger.error('Error fetching vet clinics:', error);
            throw error;
        }
    },

    async saveClinic(clinic: VetClinic): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save clinic.");
            }
            const id = clinic.id || `clinic_${Date.now()}`;
            await setDoc(doc(db, 'vet_clinics', id), { ...clinic, id }, { merge: true });
        } catch (error) {
            logger.error('Error saving vet clinic:', error);
            throw error;
        }
    },

    async getAppointments(): Promise<Appointment[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch appointments.");
            }
            const snap = await getDocs(collection(db, 'appointments'));
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
        } catch (error) {
            logger.error('Error fetching appointments:', error);
            throw error;
        }
    },

    async saveAppointment(app: Appointment): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save appointment.");
            }
            const id = app.id || `app_${Date.now()}`;
            await setDoc(doc(db, 'appointments', id), { ...app, id }, { merge: true });
        } catch (error) {
            logger.error('Error saving appointment:', error);
            throw error;
        }
    },

    async deleteAppointment(id: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to delete appointment.");
            }
            await deleteDoc(doc(db, 'appointments', id));
        } catch (error) {
            logger.error('Error deleting appointment:', error);
            throw error;
        }
    }
};
