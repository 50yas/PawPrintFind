/// <reference types="vitest/globals" />
import { adminService } from './adminService';
import { logger } from './loggerService';
import { auth } from './firebase';
import type { Mock } from 'vitest';
import { getDocs, setDoc, deleteDoc, addDoc, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';

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

// Override global firestore mock for this file to include aggregation functions
vi.mock('firebase/firestore', () => {
    return {
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        deleteDoc: vi.fn(),
        addDoc: vi.fn(),
        collection: vi.fn(),
        doc: vi.fn(() => ({ id: 'mockDoc' })),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getCountFromServer: vi.fn(),
        getAggregateFromServer: vi.fn(),
        sum: vi.fn(),
    };
});

describe('adminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: unauthenticated
        (auth.currentUser as any) = null;
    });

    describe('getSystemStats', () => {
        it('should throw error if user is not authenticated', async () => {
            await expect(adminService.getSystemStats()).rejects.toThrow('Authentication required');
        });

        it('should return system stats if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            
            // Mock counts
            (getCountFromServer as Mock).mockResolvedValue({ data: () => ({ count: 10 }) });
            
            // Mock aggregation (sum)
            (getAggregateFromServer as Mock).mockResolvedValue({ data: () => ({ totalAmount: 500 }) });

            const stats = await adminService.getSystemStats();
            
            // We expect counts for Users, Pets, Clinics
            expect(getCountFromServer).toHaveBeenCalledTimes(4); // Users, Pets, Clinics, Active Alerts (Pets where isLost=true)
            // Or maybe 3 and active alerts is a filter?
            
            // Let's verify structure
            expect(stats).toEqual({
                totalUsers: 10,
                totalPets: 10,
                totalClinics: 10,
                activeAlerts: 10,
                totalDonations: 500
            });
        });
    });

    describe('getUsers', () => {
        it('should throw error if user is not authenticated', async () => {
            await expect(adminService.getUsers()).rejects.toThrow('Authentication required');
        });

        it('should return users if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            const validUser = {
                email: 'u1@test.com',
                roles: ['owner'],
                activeRole: 'owner',
                friends: [],
                friendRequests: [],
                points: 0,
                badges: []
            };
            const mockSnapshot = {
                docs: [
                    { id: 'user1', data: () => ({ ...validUser }) },
                    { id: 'user2', data: () => ({ ...validUser, email: 'u2@test.com' }) }
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

    describe('logAdminAction', () => {
        it('should add a document to admin_audit_logs', async () => {
            const mockLog = {
                adminEmail: 'admin@test.com',
                action: 'VERIFY_USER',
                targetId: 'user-1',
                details: 'Verified user credentials'
            };
            (addDoc as Mock).mockResolvedValue({ id: 'log-123' });

            await adminService.logAdminAction(mockLog);
            expect(addDoc).toHaveBeenCalled();
        });

        it('should log console error on failure but not throw', async () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (addDoc as Mock).mockRejectedValue(new Error('Log failure'));

            await adminService.logAdminAction({ adminEmail: 'a', action: 'b', details: 'c', targetId: 'd' });
            expect(logger.error).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('verifyUser', () => {
        const fullValidUser = {
            uid: 'u1',
            email: 'test@test.com',
            roles: ['owner'],
            activeRole: 'owner',
            friends: [],
            friendRequests: [],
            points: 0,
            badges: []
        };

        it('should throw if unauthenticated', async () => {
            await expect(adminService.verifyUser({ uid: 'u1' } as any)).rejects.toThrow('Authentication required');
        });

        it('should call setDoc with isVerified: true', async () => {
            (auth.currentUser as any) = { uid: 'admin-1' };
            (setDoc as Mock).mockResolvedValue(undefined);
            await adminService.verifyUser(fullValidUser as any);
            expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isVerified: true }), { merge: true });
        });
    });

    describe('rejectVerification', () => {
        const fullValidUserWithData = {
            uid: 'u1',
            email: 'test@test.com',
            roles: ['owner'],
            activeRole: 'owner',
            friends: [],
            friendRequests: [],
            points: 0,
            badges: [],
            verificationData: { docUrl: 'http://doc.url', timestamp: 123 }
        };

        it('should throw if unauthenticated', async () => {
            await expect(adminService.rejectVerification({ uid: 'u1' } as any)).rejects.toThrow('Authentication required');
        });

        it('should call setDoc and remove verificationData', async () => {
            (auth.currentUser as any) = { uid: 'admin-1' };
            (setDoc as Mock).mockResolvedValue(undefined);
            await adminService.rejectVerification(fullValidUserWithData as any);
            
            const callArgs = (setDoc as Mock).mock.calls[0][1];
            expect(callArgs).not.toHaveProperty('verificationData');
            expect(callArgs.isVerified).toBe(false);
        });
    });

    describe('toggleUserSubscription', () => {
        it('should throw error if user is not authenticated', async () => {
            await expect(adminService.toggleUserSubscription('u1', true)).rejects.toThrow('Authentication required');
        });

        it('should set subscription to active when isPro is true', async () => {
            (auth.currentUser as any) = { uid: 'admin-123', email: 'admin@test.com' };
            (setDoc as Mock).mockResolvedValue(undefined);
            (addDoc as Mock).mockResolvedValue({ id: 'log-1' });

            await adminService.toggleUserSubscription('u1', true);

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                { subscription: expect.objectContaining({ status: 'active', planId: 'vet_pro' }) },
                { merge: true }
            );
            
            // Verify audit log
            expect(addDoc).toHaveBeenCalled();
        });

        it('should set subscription to inactive when isPro is false', async () => {
            (auth.currentUser as any) = { uid: 'admin-123', email: 'admin@test.com' };
            (setDoc as Mock).mockResolvedValue(undefined);

            await adminService.toggleUserSubscription('u1', false);

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                { subscription: expect.objectContaining({ status: 'inactive', planId: 'vet_free' }) },
                { merge: true }
            );
        });
    });

    describe('getAuditLogs', () => {
        it('should throw error if user is not authenticated', async () => {
            await expect(adminService.getAuditLogs()).rejects.toThrow('Authentication required');
        });

        it('should return audit logs if authenticated', async () => {
            (auth.currentUser as any) = { uid: 'admin-123' };
            const validLog = {
                adminEmail: 'a@a.com',
                action: 'DELETE_PET',
                details: 'Deleted pet 1',
                timestamp: 123
            };
            const mockSnapshot = {
                docs: [
                    { id: 'l1', data: () => ({ ...validLog }) },
                    { id: 'l2', data: () => ({ ...validLog, id: 'l2', action: 'VERIFY_USER', timestamp: 456 }) }
                ]
            };
            (getDocs as Mock).mockResolvedValue(mockSnapshot);

            const logs = await adminService.getAuditLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0].id).toBe('l1');
        });
    });
});
