
import {
    collection, getDocs, setDoc, doc, deleteDoc, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { VetClinic, Appointment } from '../types';

export const vetService = {
    async getVetClinics(): Promise<VetClinic[]> {
        const snap = await getDocs(collection(db, 'vet_clinics'));
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as VetClinic));
    },

    async saveClinic(clinic: VetClinic): Promise<void> {
        const id = clinic.id || `clinic_${Date.now()}`;
        await setDoc(doc(db, 'vet_clinics', id), { ...clinic, id }, { merge: true });
    },

    async getAppointments(): Promise<Appointment[]> {
        const snap = await getDocs(collection(db, 'appointments'));
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
    },

    async saveAppointment(app: Appointment): Promise<void> {
        const id = app.id || `app_${Date.now()}`;
        await setDoc(doc(db, 'appointments', id), { ...app, id }, { merge: true });
    },

    async deleteAppointment(id: string): Promise<void> {
        await deleteDoc(doc(db, 'appointments', id));
    }
};
