/// <reference types="vitest/globals" />
import { adminService } from './adminService';
import { logger } from './loggerService';
import { auth } from './firebase';
import type { Mock } from 'vitest';
import { getDocs, setDoc, deleteDoc, addDoc } from 'firebase/firestore';

// Mock dependencies
vi.mock('./loggerService');
vi.mock('./authService', () => ({
    authService: {
        verifyAdminKey: vi.fn()
    }
}));
vi.mock('./firebase', () => ({
    auth: { currentUser: null },
    db: { _isFirestore: true }
}));

describe('adminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: unauthenticated
        (auth.currentUser as any) = null;
    });

    describe('getUsers', () => {
        it('should throw error if user is not authenticated', async () => {
            await expect(adminService.getUsers()).rejects.toThrow('Authentication required');
        });

        it('should return users if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            const mockSnapshot = {
                docs: [
                    { id: 'user1', data: () => ({ email: 'u1@test.com' }) },
                    { id: 'user2', data: () => ({ email: 'u2@test.com' }) }
                ]
            };
            (getDocs as Mock).mockResolvedValue(mockSnapshot);

            const users = await adminService.getUsers();
            expect(users).toHaveLength(2);
            expect(users[0].uid).toBe('user1');
        });

        it('should log error and re-throw on failure', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            const mockError = new Error('Firestore failure');
            (getDocs as Mock).mockRejectedValue(mockError);

            await expect(adminService.getUsers()).rejects.toThrow(mockError);
            expect(logger.error).toHaveBeenCalledWith('Error fetching users:', mockError);
        });
    });

    describe('saveUser', () => {
        it('should throw error if user is not authenticated', async () => {
            await expect(adminService.saveUser({ uid: 'u1', email: 'test' })).rejects.toThrow('Authentication required');
        });

        it('should save user if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            (setDoc as Mock).mockResolvedValue(undefined);

            await adminService.saveUser({ uid: 'u1', email: 'test' });
            expect(setDoc).toHaveBeenCalled();
        });

        it('should log error and re-throw', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            const mockError = new Error('Save failed');
            (setDoc as Mock).mockRejectedValue(mockError);

            await expect(adminService.saveUser({ uid: 'u1' })).rejects.toThrow(mockError);
            expect(logger.error).toHaveBeenCalledWith('Error saving user:', mockError);
        });
    });
});
