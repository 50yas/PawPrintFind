import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import { logger } from './loggerService';
import {
  signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut,
  createUserWithEmailAndPassword, sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink, signInWithPhoneNumber
} from 'firebase/auth';
import { getDoc, setDoc, updateDoc, getDocs, addDoc } from 'firebase/firestore';
import { auth } from './firebase';
import { httpsCallable } from 'firebase/functions';

vi.mock('./loggerService');
vi.mock('./firebase', () => ({
    auth: { currentUser: null },
    db: { _isFirestore: true },
    functions: {},
    googleProvider: {}
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

describe('authService error handling and authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.currentUser as any) = null;
  });

  describe('loginWithEmail', () => {
    it('should call signInWithEmailAndPassword and return user credential on success', async () => {
      const mockCredential = { user: { uid: '123' } } as any;
      (signInWithEmailAndPassword as any).mockResolvedValue(mockCredential);
      const result = await authService.loginWithEmail('test@example.com', 'password');
      expect(result).toBe(mockCredential);
    });
  });

  describe('verifyAdminKey', () => {
    it('should return valid true for genesis key', async () => {
      const mockVerifyFn = vi.fn().mockResolvedValue({ data: { valid: true, type: 'GENESIS' } });
      (httpsCallable as any).mockReturnValue(mockVerifyFn);

      const result = await authService.verifyAdminKey('GENESIS_KEY');
      expect(result).toEqual({ valid: true, type: 'GENESIS' });
    });

    it('should return valid true for an active issued key', async () => {
      const mockVerifyFn = vi.fn().mockResolvedValue({ data: { valid: true, type: 'ISSUED', keyDocId: 'key123' } });
      (httpsCallable as any).mockReturnValue(mockVerifyFn);

      const result = await authService.verifyAdminKey('ISSUED_KEY');
      expect(result).toEqual({ valid: true, type: 'ISSUED', keyDocId: 'key123' });
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Key verification failed');
      const mockVerifyFn = vi.fn().mockRejectedValue(mockError);
      (httpsCallable as any).mockReturnValue(mockVerifyFn);

      await expect(authService.verifyAdminKey('ANY_KEY')).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should return empty array if no new badges', async () => {
       const mockUser = {
        uid: 'user1',
        email: 'test@test.com',
        badges: ['First Eyes', 'Sightings Scout'],
        stats: { sightingsReported: 10, reunionsSupported: 0 },
        roles: ['owner'],
        activeRole: 'owner',
        friends: [],
        friendRequests: [],
        points: 100
      };
      (getDoc as any).mockResolvedValue({ exists: () => true, data: () => mockUser });

      const result = await authService.checkAndAwardBadges('user1');
      expect(result).toEqual([]);
    });
  });
});
