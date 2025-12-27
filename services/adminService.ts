
import {
    collection,
    getDocs,
    setDoc,
    doc,
    deleteDoc,
    addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, UserRole } from '../types';
import { authService } from './authService';

export const adminService = {
    async getUsers(): Promise<User[]> {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
    },

    async saveUser(userData: Partial<User> & { uid: string }): Promise<void> {
        await setDoc(doc(db, 'users', userData.uid), userData, { merge: true });
    },

    async deleteUser(uid: string): Promise<void> {
        await deleteDoc(doc(db, 'users', uid));
    },

    async initializeSystem(): Promise<void> {
        await setDoc(doc(db, 'metadata', 'system'), { initialized: true, securityModel: 'V3-PROD' });
    },

    async verifyAdminSecret(key: string): Promise<boolean> {
        const result = await authService.verifyAdminKey(key);
        return result.valid;
    },

    async logAdminAction(log: { adminEmail: string, action: string, targetId?: string, details: string }) {
        await addDoc(collection(db, 'admin_audit_logs'), {
            ...log,
            timestamp: Date.now()
        });
    }
};
