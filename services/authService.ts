
import {
    signInWithEmailAndPassword, OAuthProvider, signInWithPopup,
    sendPasswordResetEmail, signOut, createUserWithEmailAndPassword,
    User as FirebaseUser, signInAnonymously
} from 'firebase/auth';
import {
    doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
    arrayUnion, increment, addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { User, UserRole, AdminKey } from '../types';
import { logger } from './loggerService';

export const authService = {
    async loginWithEmail(email: string, pass: string) {
        try {
            return await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            logger.error("Firebase Login Error:", error);
            // TODO: Add user-facing error notification
            throw new Error(`[${error.code}] ${error.message}`);
        }
    },

    async signInWithGoogle() {
        try {
            return await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            logger.error("Firebase Google Sign-In Error:", error);
            // TODO: Add user-facing error notification
            throw error;
        }
    },

    async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            logger.error("Error sending password reset email:", error);
            // TODO: Add user-facing error notification
            throw error;
        }
    },

    async logout() {
        try {
            return await signOut(auth);
        } catch (error) {
            logger.error("Error signing out:", error);
            // TODO: Add user-facing error notification
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
                badges: initialRole === 'super_admin' ? ['System-Root'] : ['Newcomer'],
                joinedAt: Date.now(),
                lastLoginAt: Date.now(),
                isVerified: initialRole === 'super_admin',
                ...additionalData
            };
            await setDoc(doc(db, 'users', user.uid), profile);
        } catch (error) {
            logger.error("Error registering user:", error);
            // TODO: Add user-facing error notification
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
                const data = snap.data() as any; // Use any to handle old and new user shapes
                await updateDoc(userRef, { lastLoginAt: Date.now() });

                // Migration for existing users
                if (data.role && !data.roles) {
                    data.roles = [data.role];
                    data.activeRole = data.role;
                    delete data.role;
                    // Persist the migrated data structure
                    await setDoc(userRef, data, { merge: true });
                }

                return { ...data, uid: fbUser.uid };
            } else {
                const newUser: User = {
                    uid: fbUser.uid,
                    email: fbUser.email || 'anonymous@pawprint.ai',
                    roles: ['owner'],
                    activeRole: 'owner',
                    friends: [],
                    friendRequests: [],
                    points: 50,
                    badges: ['Community-Member'],
                    joinedAt: Date.now(),
                    lastLoginAt: Date.now()
                };
                await setDoc(userRef, newUser);
                return newUser;
            }
        } catch (error) {
            logger.error("Error syncing user profile:", error);
            // TODO: Add user-facing error notification
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
            // TODO: Add user-facing error notification
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
            // TODO: Add user-facing error notification
            throw error;
        }
    }
};
