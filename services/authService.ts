import {
    signInWithEmailAndPassword, OAuthProvider, signInWithPopup,
    sendPasswordResetEmail, signOut, createUserWithEmailAndPassword,
    User as FirebaseUser, signInAnonymously, sendSignInLinkToEmail,
    isSignInWithEmailLink, signInWithEmailLink, RecaptchaVerifier,
    signInWithPhoneNumber, ConfirmationResult
} from 'firebase/auth';
import {
    doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
    arrayUnion, increment, addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { User, UserRole, AdminKey, UserSchema } from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { checkBadgeEligibility } from './gamificationService';

export const authService = {
    async loginWithEmail(email: string, pass: string) {
        try {
            return await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            logger.error("Firebase Login Error:", error);
            throw new Error(`[${error.code}] ${error.message}`);
        }
    },

    async signInWithGoogle() {
        try {
            return await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            logger.error("Firebase Google Sign-In Error:", error);
            throw error;
        }
    },

    async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            logger.error("Error sending password reset email:", error);
            throw error;
        }
    },

    async logout() {
        try {
            return await signOut(auth);
        } catch (error) {
            logger.error("Error signing out:", error);
            throw error;
        }
    },

    async sendMagicLink(email: string, actionCodeSettings: any): Promise<void> {
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
        } catch (error: any) {
            logger.error("Magic Link Send Error:", error);
            throw error;
        }
    },

    async completeMagicLinkSignIn(email: string, href: string): Promise<any> {
        try {
            if (isSignInWithEmailLink(auth, href)) {
                return await signInWithEmailLink(auth, email, href);
            }
            throw new Error("Invalid or expired magic link.");
        } catch (error: any) {
            logger.error("Magic Link Sign-In Error:", error);
            throw error;
        }
    },

    async signInWithPhone(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
        try {
            return await signInWithPhoneNumber(auth, phoneNumber, verifier);
        } catch (error: any) {
            logger.error("Phone Sign-In Error:", error);
            throw error;
        }
    },

    async registerUser(email: string, pass: string, roles: UserRole[] = ['owner'], additionalData?: Partial<User>): Promise<void> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;
            const initialRole = roles[0] || 'owner';
            const profile: User = {
                uid: user.uid,
                email: email,
                roles: roles,
                activeRole: initialRole,
                friends: [],
                friendRequests: [],
                points: initialRole === 'super_admin' ? 1000000 : 50,
                badges: initialRole === 'super_admin' ? ['System-Root'] : ['Alpha-Tester'],
                joinedAt: Date.now(),
                lastLoginAt: Date.now(),
                isVerified: initialRole === 'super_admin',
                ...additionalData
            };
            console.log(`[Auth-Registry] Establishing user identity: ${email} (${user.uid})`);
            validationService.validate(UserSchema, profile, 'registerUser');
            await setDoc(doc(db, 'users', user.uid), profile);
        } catch (error: any) {
            logger.error("Registration Protocol Failure:", error);
            throw error;
        }
    },

    async syncUserProfile(fbUser: FirebaseUser): Promise<User> {
        try {
            if (fbUser.isAnonymous) {
                return {
                    uid: fbUser.uid,
                    email: 'anonymous@pawprint.ai',
                    roles: ['owner'],
                    activeRole: 'owner',
                    friends: [],
                    friendRequests: [],
                    points: 0,
                    badges: ['Guest'],
                    joinedAt: Date.now(),
                    lastLoginAt: Date.now()
                };
            }

            const userRef = doc(db, 'users', fbUser.uid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
                const data = snap.data() as any;
                let needsUpdate = false;
                const updates: any = { lastLoginAt: Date.now() };

                // Protocol Migration: legacy 'role' -> 'roles' & 'activeRole'
                if (data.role && !data.roles) {
                    data.roles = [data.role];
                    data.activeRole = data.role;
                    updates.roles = data.roles;
                    updates.activeRole = data.activeRole;
                    needsUpdate = true;
                }

                // Ensure data consistency
                if (!data.roles || data.roles.length === 0) {
                    data.roles = ['owner'];
                    updates.roles = data.roles;
                    needsUpdate = true;
                }
                if (!data.activeRole) {
                    data.activeRole = data.roles[0];
                    updates.activeRole = data.activeRole;
                    needsUpdate = true;
                }

                // Admin mapping upgrade
                if (data.activeRole === 'admin') {
                    data.activeRole = 'super_admin';
                    updates.activeRole = 'super_admin';
                    needsUpdate = true;
                }
                if (data.roles && data.roles.includes('admin')) {
                    data.roles = data.roles.map((r: string) => r === 'admin' ? 'super_admin' : r);
                    updates.roles = data.roles;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    console.log(`[Auth-Sync] Upgrading profile security protocols for ${fbUser.email}`);
                    const updatedData = { ...data, ...updates };
                    validationService.validate(UserSchema, updatedData, `syncUserProfile:${fbUser.uid}`);
                    await setDoc(userRef, updatedData, { merge: true });
                } else {
                    await updateDoc(userRef, { lastLoginAt: Date.now() });
                }

                const finalData = { ...data, ...updates, uid: fbUser.uid };
                return validationService.validate(UserSchema, finalData, `syncUserProfile:final:${fbUser.uid}`);
            } else {
                // Initialize new profile if missing (fallback)
                const newUser: User = {
                    uid: fbUser.uid,
                    email: fbUser.email || 'unknown@pawprint.ai',
                    roles: ['owner'],
                    activeRole: 'owner',
                    friends: [],
                    friendRequests: [],
                    points: 50,
                    badges: ['First-Contact'],
                    joinedAt: Date.now(),
                    lastLoginAt: Date.now()
                };
                console.log(`[Auth-Sync] Initializing fresh profile for ${fbUser.email}`);
                validationService.validate(UserSchema, newUser, 'syncUserProfile:new');
                await setDoc(userRef, newUser);
                return newUser;
            }
        } catch (error: any) {
            logger.error("Profile Sync Protocol Failure:", error);
            throw error;
        }
    },

    async verifyAdminKey(keyInput: string): Promise<{ valid: boolean, type: 'GENESIS' | 'ISSUED', keyDocId?: string }> {
        try {
            const msgBuffer = new TextEncoder().encode(keyInput);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (hashHex === '83036031472796eaf4267d6d664e6c4950db82ff4e0e0a9e59b894d4d9608915') {
                return { valid: true, type: 'GENESIS' };
            }

            const q = query(
                collection(db, 'admin_keys'),
                where('keyHash', '==', hashHex),
                where('status', '==', 'active')
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                return { valid: true, type: 'ISSUED', keyDocId: snapshot.docs[0].id };
            }

            return { valid: false, type: 'GENESIS' };
        } catch (error) {
            logger.error("Error verifying admin key:", error);
            throw error;
        }
    },

    async elevateUserRole(uid: string, method: 'GENESIS' | 'ISSUED', keyDocId?: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to elevate user role.");
            }

            await updateDoc(doc(db, 'users', uid), {
                roles: arrayUnion('super_admin'),
                activeRole: 'super_admin',
                badges: arrayUnion('System-Root'),
                points: increment(1000)
            });

            if (method === 'ISSUED' && keyDocId) {
                await updateDoc(doc(db, 'admin_keys', keyDocId), {
                    status: 'used',
                    usedBy: uid,
                    usedAt: Date.now()
                });
            }

            await addDoc(collection(db, 'admin_audit_logs'), {
                adminEmail: 'SYSTEM',
                action: 'ROLE_ELEVATION',
                targetId: uid,
                details: `User elevated via ${method} key`,
                timestamp: Date.now()
            });
        } catch (error) {
            logger.error("Error elevating user role:", error);
            throw error;
        }
    },

    async checkAndAwardBadges(uid: string): Promise<string[]> {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) return [];

            const user = userSnap.data() as User;
            const stats = user.stats || { sightingsReported: 0, reunionsSupported: 0 };
            
            const newBadges = checkBadgeEligibility(user, stats);

            if (newBadges.length > 0) {
                console.log(`[Gamification] Awarding new badges to ${user.email}:`, newBadges);
                await updateDoc(userRef, {
                    badges: arrayUnion(...newBadges),
                    points: increment(newBadges.length * 100) // 100 points per badge
                });
                return newBadges;
            }
            return [];
        } catch (error) {
            logger.error("Error checking/awarding badges:", error);
            return [];
        }
    }
};