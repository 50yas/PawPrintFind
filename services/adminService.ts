
import {
    collection,
    getDocs,
    setDoc,
    doc,
    deleteDoc,
    addDoc,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User, AdminAuditLog } from '../types';
import { authService } from './authService';
import { logger } from './loggerService';

export const adminService = {
    async getUsers(): Promise<User[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch users.");
            }
            const snap = await getDocs(collection(db, 'users'));
            return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
        } catch (error) {
            logger.error('Error fetching users:', error);
            throw error;
        }
    },

    async saveUser(userData: Partial<User> & { uid: string }): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save user.");
            }
            await setDoc(doc(db, 'users', userData.uid), userData, { merge: true });
        } catch (error) {
            logger.error('Error saving user:', error);
            throw error;
        }
    },

    async deleteUser(uid: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to delete user.");
            }
            await deleteDoc(doc(db, 'users', uid));
        } catch (error) {
            logger.error('Error deleting user:', error);
            throw error;
        }
    },

    async initializeSystem(): Promise<void> {
        try {
            // Note: This might be called during setup where auth is not yet established or via a script.
            // If strictly admin, should check auth. For now, just error handling.
            await setDoc(doc(db, 'metadata', 'system'), { initialized: true, securityModel: 'V3-PROD' });
        } catch (error) {
            logger.error('Error initializing system:', error);
            throw error;
        }
    },

    async verifyAdminSecret(key: string): Promise<boolean> {
        try {
            const result = await authService.verifyAdminKey(key);
            return result.valid;
        } catch (error) {
            logger.error('Error verifying admin secret:', error);
            throw error;
        }
    },

    async logAdminAction(log: Omit<AdminAuditLog, 'id' | 'timestamp'>) {
        try {
            await addDoc(collection(db, 'admin_audit_logs'), {
                ...log,
                timestamp: Date.now()
            });
        } catch (error) {
            logger.error('Error logging admin action:', error);
            // We might not want to throw here to avoid interrupting the main action
            console.error("Failed to log admin action", error);
        }
    },

    async getAuditLogs(max: number = 100): Promise<AdminAuditLog[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch audit logs.");
            }
            const q = query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc'), limit(max));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminAuditLog));
        } catch (error) {
            logger.error('Error fetching audit logs:', error);
            throw error;
        }
    }
};
