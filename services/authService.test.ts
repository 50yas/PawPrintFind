/// <reference types="vitest/globals" />
import { authService } from './authService';
import { logger } from './loggerService';
import type { Mock } from 'vitest';
import {
  signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut,
  createUserWithEmailAndPassword, User as FirebaseUser,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where, arrayUnion, increment, addDoc } from 'firebase/firestore';
import { auth } from './firebase'; // Import the actual auth from firebase.ts, but it's mocked globally

vi.mock('./loggerService');
vi.mock('./firebase', () => ({
    auth: { currentUser: null }, // Mock current user initially
    db: { _isFirestore: true }, // More realistic mock for db
    googleProvider: {}
}));

describe('authService error handling and authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.currentUser as any) = null; // Reset current user for each test
  });

  describe('loginWithEmail', () => {
    it('should call signInWithEmailAndPassword and return user credential on success', async () => {
      const mockCredential = { user: { uid: '123' } } as any;
      (signInWithEmailAndPassword as Mock).mockResolvedValue(mockCredential);

      const result = await authService.loginWithEmail('test@example.com', 'password');
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
      expect(result).toBe(mockCredential);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };
      (signInWithEmailAndPassword as Mock).mockRejectedValue(mockError);

      await expect(authService.loginWithEmail('test@example.com', 'password')).rejects.toThrow(`[${mockError.code}] ${mockError.message}`);
      expect(logger.error).toHaveBeenCalledWith('Firebase Login Error:', mockError);
    });
  });

  describe('signInWithGoogle', () => {
    it('should call signInWithPopup and return user credential on success', async () => {
      const mockCredential = { user: { uid: '123' } } as any;
      (signInWithPopup as Mock).mockResolvedValue(mockCredential);

      const result = await authService.signInWithGoogle();
      expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
      expect(result).toBe(mockCredential);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Google sign-in failed');
      (signInWithPopup as Mock).mockRejectedValue(mockError);

      await expect(authService.signInWithGoogle()).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Firebase Google Sign-In Error:', mockError);
    });
  });

  describe('resetPassword', () => {
    it('should call sendPasswordResetEmail on success', async () => {
      (sendPasswordResetEmail as Mock).mockResolvedValue(undefined);

      await authService.resetPassword('test@example.com');
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Reset password failed');
      (sendPasswordResetEmail as Mock).mockRejectedValue(mockError);

      await expect(authService.resetPassword('test@example.com')).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error sending password reset email:', mockError);
    });
  });

  describe('logout', () => {
    it('should call signOut on success', async () => {
      (signOut as Mock).mockResolvedValue(undefined);

      await authService.logout();
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Logout failed');
      (signOut as Mock).mockRejectedValue(mockError);

      await expect(authService.logout()).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error signing out:', mockError);
    });
  });

  describe('sendMagicLink', () => {
    it('should call sendSignInLinkToEmail on success', async () => {
      (sendSignInLinkToEmail as Mock).mockResolvedValue(undefined);
      const actionCodeSettings = { url: 'http://localhost:3000', handleCodeInApp: true };

      await authService.sendMagicLink('test@example.com', actionCodeSettings);
      expect(sendSignInLinkToEmail).toHaveBeenCalledWith(auth, 'test@example.com', actionCodeSettings);
      expect(window.localStorage.getItem('emailForSignIn')).toBe('test@example.com');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Magic link failed');
      (sendSignInLinkToEmail as Mock).mockRejectedValue(mockError);

      await expect(authService.sendMagicLink('test@example.com', {})).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Magic Link Send Error:', mockError);
    });
  });

  describe('completeMagicLinkSignIn', () => {
    it('should complete sign-in if link is valid', async () => {
      (isSignInWithEmailLink as Mock).mockReturnValue(true);
      const mockCredential = { user: { uid: '123' } };
      (signInWithEmailLink as Mock).mockResolvedValue(mockCredential);

      const result = await authService.completeMagicLinkSignIn('test@example.com', 'http://link');
      expect(signInWithEmailLink).toHaveBeenCalledWith(auth, 'test@example.com', 'http://link');
      expect(result).toBe(mockCredential);
    });

    it('should throw error if link is invalid', async () => {
      (isSignInWithEmailLink as Mock).mockReturnValue(false);

      await expect(authService.completeMagicLinkSignIn('test@example.com', 'http://link')).rejects.toThrow('Invalid or expired magic link.');
      expect(signInWithEmailLink).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Magic Link Sign-In Error:', expect.any(Error));
    });
  });

  describe('signInWithPhone', () => {
    it('should call signInWithPhoneNumber on success', async () => {
      const mockResult = { verificationId: '123' };
      (signInWithPhoneNumber as Mock).mockResolvedValue(mockResult);
      const mockVerifier = {} as any;

      const result = await authService.signInWithPhone('+1234567890', mockVerifier);
      expect(signInWithPhoneNumber).toHaveBeenCalledWith(auth, '+1234567890', mockVerifier);
      expect(result).toBe(mockResult);
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Phone auth failed');
      (signInWithPhoneNumber as Mock).mockRejectedValue(mockError);

      await expect(authService.signInWithPhone('+123', {} as any)).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Phone Sign-In Error:', mockError);
    });
  });

  describe('registerUser', () => {
    const mockUserCredential = { user: { uid: 'new-uid', email: 'new@example.com' } } as any;
    const mockUser = { uid: 'new-uid', email: 'new@example.com', roles: ['owner'], activeRole: 'owner', friends: [], friendRequests: [], points: 50, badges: ['Alpha-Tester'], joinedAt: expect.any(Number), lastLoginAt: expect.any(Number), isVerified: false };

    beforeEach(() => {
        (createUserWithEmailAndPassword as Mock).mockResolvedValue(mockUserCredential);
        (setDoc as Mock).mockResolvedValue(undefined);
    });

    it('should register user and save profile on success', async () => {
      await authService.registerUser('new@example.com', 'password123', ['owner']);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'new@example.com', 'password123');
      expect(setDoc).toHaveBeenCalledWith(expect.any(Object), mockUser);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Registration failed');
      (createUserWithEmailAndPassword as Mock).mockRejectedValue(mockError);

      await expect(authService.registerUser('new@example.com', 'password123', ['owner'])).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Registration Protocol Failure:', mockError);
    });
  });

  describe('syncUserProfile', () => {
    const mockFbUser = { uid: 'test-uid', email: 'test@example.com', isAnonymous: false } as FirebaseUser;
    const mockAnonymousFbUser = { uid: 'anon-uid', isAnonymous: true } as FirebaseUser;
    const mockExistingUser: FirebaseUser = { uid: 'existing-uid', email: 'existing@example.com', isAnonymous: false } as any;
    const mockNewUser: FirebaseUser = { uid: 'new-uid', email: 'new@example.com', isAnonymous: false } as any;

    it('should return anonymous user profile if fbUser is anonymous', async () => {
      const result = await authService.syncUserProfile(mockAnonymousFbUser);
      expect(result.uid).toBe('anon-uid');
      expect(result.roles).toEqual(['owner']);
      expect(result.activeRole).toEqual('owner');
      expect(getDoc).not.toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should fetch and update existing user profile', async () => {
      (getDoc as Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ email: 'existing@example.com', roles: ['owner'], activeRole: 'owner', friends: [], friendRequests: [], points: 100, badges: ['Veteran'] })
      });
      (updateDoc as Mock).mockResolvedValue(undefined);

      const result = await authService.syncUserProfile(mockExistingUser);
      expect(getDoc).toHaveBeenCalledWith(expect.any(Object));
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), { lastLoginAt: expect.any(Number) });
      expect(result.uid).toBe('existing-uid');
      expect(result.roles).toEqual(['owner']);
    });

    it('should create new user profile if not found', async () => {
      (getDoc as Mock).mockResolvedValueOnce({ exists: () => false });
      (setDoc as Mock).mockResolvedValue(undefined);

      const result = await authService.syncUserProfile(mockNewUser);
      expect(getDoc).toHaveBeenCalledWith(expect.any(Object));
      expect(setDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ uid: 'new-uid', email: 'new@example.com', roles: ['owner'], activeRole: 'owner' }));
      expect(result.uid).toBe('new-uid');
      expect(result.roles).toEqual(['owner']);
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Sync failed');
      (getDoc as Mock).mockRejectedValue(mockError);

      await expect(authService.syncUserProfile(mockExistingUser)).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Profile Sync Protocol Failure:', mockError);
    });
  });

  describe('verifyAdminKey', () => {
    const GENESIS_KEY_HASH = '83036031472796eaf4267d6d664e6c4950db82ff4e0e0a9e59b894d4d9608915';
    const TEST_KEY_INPUT = 'GENESIS_KEY_INPUT'; // Matches the mock in vitest.setup.ts

    beforeEach(() => {
      (getDocs as Mock).mockResolvedValue({ empty: true }); // Default to no issued keys
    });

    it('should return valid true for genesis key', async () => {
      const result = await authService.verifyAdminKey(TEST_KEY_INPUT);
      expect(result).toEqual({ valid: true, type: 'GENESIS' });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return valid true for an active issued key', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'key123' }]
      };
      (getDocs as Mock).mockResolvedValue(mockSnapshot);

      const result = await authService.verifyAdminKey('ISSUED_KEY_INPUT'); // will produce a generic hash
      expect(result).toEqual({ valid: true, type: 'ISSUED', keyDocId: 'key123' });
    });

    it('should return valid false for an invalid key', async () => {
      const result = await authService.verifyAdminKey('INVALID_KEY_INPUT');
      expect(result).toEqual({ valid: false, type: 'GENESIS' }); // Falls back to GENESIS type if not found
    });

    it('should log error and re-throw on failure', async () => {
      const mockError = new Error('Key verification failed');
      (getDocs as Mock).mockRejectedValue(mockError);

      await expect(authService.verifyAdminKey('ANY_KEY')).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error verifying admin key:', mockError);
    });
  });

  describe('elevateUserRole', () => {
    const mockUid = 'user-to-elevate';

    beforeEach(() => {
      (updateDoc as Mock).mockResolvedValue(undefined);
      (addDoc as Mock).mockResolvedValue(undefined);
    });

    it('should throw error if user is not authenticated', async () => {
      await expect(authService.elevateUserRole(mockUid, 'GENESIS')).rejects.toThrow('Authentication required to elevate user role.');
      expect(updateDoc).not.toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should elevate user role and log action for GENESIS method', async () => {
      (auth.currentUser as any) = { uid: 'admin-uid' }; // Authenticate user
      await authService.elevateUserRole(mockUid, 'GENESIS');

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        roles: arrayUnion('super_admin'),
        activeRole: 'super_admin',
        badges: arrayUnion('System-Root'),
        points: increment(1000)
      });
      expect(addDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        action: 'ROLE_ELEVATION',
        targetId: mockUid,
        details: 'User elevated via GENESIS key'
      }));
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should elevate user role, update key status, and log action for ISSUED method', async () => {
      (auth.currentUser as any) = { uid: 'admin-uid' }; // Authenticate user
      const keyDocId = 'issued-key-123';
      await authService.elevateUserRole(mockUid, 'ISSUED', keyDocId);

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        roles: arrayUnion('super_admin'),
        activeRole: 'super_admin',
        badges: arrayUnion('System-Root'),
        points: increment(1000)
      });
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        status: 'used',
        usedBy: mockUid,
        usedAt: expect.any(Number)
      });
      expect(addDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        action: 'ROLE_ELEVATION',
        targetId: mockUid,
        details: 'User elevated via ISSUED key'
      }));
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and re-throw on failure even if user is authenticated', async () => {
      (auth.currentUser as any) = { uid: 'admin-uid' }; // Authenticate user
      const mockError = new Error('Elevation failed');
      (updateDoc as Mock).mockRejectedValue(mockError);

      await expect(authService.elevateUserRole(mockUid, 'GENESIS')).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error elevating user role:', mockError);
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award new badges if eligible', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@test.com',
        badges: [],
        stats: { sightingsReported: 10, reunionsSupported: 0 },
        roles: ['owner'],
        activeRole: 'owner',
        friends: [],
        friendRequests: [],
        points: 0
      };
      (getDoc as Mock).mockResolvedValue({ exists: () => true, data: () => mockUser });
      (updateDoc as Mock).mockResolvedValue(undefined);

      const result = await authService.checkAndAwardBadges('user1');
      
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
          badges: arrayUnion('Sightings Scout'),
          points: increment(100)
      });
      expect(result).toContain('Sightings Scout');
    });

    it('should return empty array if no new badges', async () => {
       const mockUser = {
        uid: 'user1',
        email: 'test@test.com',
        badges: ['Sightings Scout'],
        stats: { sightingsReported: 10, reunionsSupported: 0 },
        roles: ['owner'],
        activeRole: 'owner',
        friends: [],
        friendRequests: [],
        points: 0
      };
      (getDoc as Mock).mockResolvedValue({ exists: () => true, data: () => mockUser });

      const result = await authService.checkAndAwardBadges('user1');
      expect(updateDoc).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
