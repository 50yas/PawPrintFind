
import {
    collection, getDocs, setDoc, doc, deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { VetClinic, Appointment, VetClinicSchema, AppointmentSchema } from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';

export const vetService = {
    async getVetClinics(): Promise<VetClinic[]> {
        try {
            const snap = await getDocs(collection(db, 'vet_clinics'));
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(VetClinicSchema, data, `getVetClinics:${d.id}`);
            });
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
            const clinicWithId = { ...clinic, id };
            validationService.validate(VetClinicSchema, clinicWithId, 'saveClinic');
            await setDoc(doc(db, 'vet_clinics', id), clinicWithId, { merge: true });
        } catch (error) {
            logger.error('Error saving vet clinic:', error);
            throw error;
        }
    },

    async deleteClinic(id: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to delete clinic.");
            }
            await deleteDoc(doc(db, 'vet_clinics', id));
        } catch (error) {
            logger.error('Error deleting vet clinic:', error);
            throw error;
        }
    },

    async getAppointments(): Promise<Appointment[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch appointments.");
            }
            const snap = await getDocs(collection(db, 'appointments'));
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(AppointmentSchema, data, `getAppointments:${d.id}`);
            });
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
            const appWithId = { ...app, id };
            validationService.validate(AppointmentSchema, appWithId, 'saveAppointment');
            await setDoc(doc(db, 'appointments', id), appWithId, { merge: true });
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
