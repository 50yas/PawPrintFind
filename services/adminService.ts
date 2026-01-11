
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
import { User, AdminAuditLog, UserRole } from '../types';
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

    async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to update user role.");
            }
            // Update both the roles array and activeRole for simplicity in this context
            // In a real app, you might want more complex logic
            await setDoc(doc(db, 'users', uid), { 
                roles: [newRole], 
                activeRole: newRole 
            }, { merge: true });
            
            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'UPDATE_ROLE',
                targetId: uid,
                details: `Updated role to ${newRole}`
            });
        } catch (error) {
            logger.error('Error updating user role:', error);
            throw error;
        }
    },

    async toggleUserStatus(uid: string, newStatus: 'active' | 'suspended' | 'banned'): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to update user status.");
            }
            await setDoc(doc(db, 'users', uid), { status: newStatus }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'UPDATE_STATUS',
                targetId: uid,
                details: `Updated status to ${newStatus}`
            });
        } catch (error) {
            logger.error('Error updating user status:', error);
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

    async verifyUser(user: User): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to verify user.");
            }
            await setDoc(doc(db, 'users', user.uid), { ...user, isVerified: true }, { merge: true });
        } catch (error) {
            logger.error('Error verifying user:', error);
            throw error;
        }
    },

    async rejectVerification(user: User): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to reject verification.");
            }
            // Logic to clear verificationData while keeping the user
            const { verificationData, ...userWithoutVerification } = user;
            await setDoc(doc(db, 'users', user.uid), { ...userWithoutVerification, isVerified: false });
        } catch (error) {
            logger.error('Error rejecting verification:', error);
            throw error;
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
