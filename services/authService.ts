
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

export const authService = {
    async loginWithEmail(email: string, pass: string) {
        try {
            return await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error("Firebase Login Error:", error);
            throw new Error(`[${error.code}] ${error.message}`);
        }
    },

    async signInWithGoogle() {
        try {
            return await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Firebase Google Sign-In Error:", error);
            throw error;
        }
    },

    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    },

    async logout() {
        return signOut(auth);
    },

    async registerUser(email: string, pass: string, role: UserRole = 'owner', additionalData?: Partial<User>): Promise<void> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const profile: User = {
            uid: user.uid,
            email: email,
            role: role,
            friends: [],
            friendRequests: [],
            points: role === 'super_admin' ? 1000000 : 50,
            badges: role === 'super_admin' ? ['System-Root'] : ['Newcomer'],
            joinedAt: Date.now(),
            lastLoginAt: Date.now(),
            isVerified: role === 'super_admin',
            ...additionalData
        };
        await setDoc(doc(db, 'users', user.uid), profile);
    },

    async syncUserProfile(fbUser: FirebaseUser): Promise<User> {
        if (fbUser.isAnonymous) {
            return {
                uid: fbUser.uid,
                email: 'anonymous@pawprint.ai',
                role: 'owner',
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
            const data = snap.data() as User;
            await updateDoc(userRef, { lastLoginAt: Date.now() });
            return { ...data, uid: fbUser.uid };
        } else {
            const newUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || 'anonymous@pawprint.ai',
                role: 'owner',
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
    },

    async verifyAdminKey(keyInput: string): Promise<{ valid: boolean, type: 'GENESIS' | 'ISSUED', keyDocId?: string }> {
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
    },

    async elevateUserRole(uid: string, method: 'GENESIS' | 'ISSUED', keyDocId?: string): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            role: 'super_admin',
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
    }
};
