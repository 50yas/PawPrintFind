
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    initializeFirestore,
    collection,
    getDocs,
    setDoc,
    doc,
    query,
    where,
    addDoc,
    deleteDoc,
    getDoc,
    orderBy,
    onSnapshot,
    increment,
    updateDoc,
    writeBatch,
    or,
    arrayUnion
} from 'firebase/firestore';
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut,
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    User as FirebaseUser,
    browserLocalPersistence,
    setPersistence,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { PetProfile, User, Donation, VetClinic, BlogPost, UserRole, Appointment, ChatSession, ChatMessage, AdminKey, ContactMessage } from '../types';
import { logger } from './loggerService';

const firebaseConfig = {
    apiKey: "AIzaSyAluD8clP5w8Z__xOUzJXcg_ztOvqRtPJU",
    authDomain: "pawprint-50.firebaseapp.com",
    projectId: "pawprint-50",
    storageBucket: "pawprint-50.firebasestorage.app",
    messagingSenderId: "334191920438",
    appId: "1:334191920438:web:7c14f1752e5400a7fe1f97",
    measurementId: "G-N79TRYCT0B"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to avoid timeout errors in some environments
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence).catch(console.error);

// EXPORTS (Base Instances)
export { db, auth, storage, googleProvider };

// Circular Dependency Guard: Import service AFTER base exports
import { authService } from './authService';
import { petService } from './petService';
import { vetService } from './vetService';
import { contentService } from './contentService';
import { adminService } from './adminService';

export const dbService = {
    auth,

    // --- AUTHENTICATION (Delegated to authService) ---
    async loginWithEmail(email: string, pass: string) {
        return authService.loginWithEmail(email, pass);
    },

    async signInWithGoogle() {
        return authService.signInWithGoogle();
    },

    async resetPassword(email: string): Promise<void> {
        return authService.resetPassword(email);
    },

    async logout() {
        return authService.logout();
    },

    async registerUser(email: string, pass: string, roles: UserRole[] = ['owner'], additionalData?: Partial<User>): Promise<void> {
        return authService.registerUser(email, pass, roles, additionalData);
    },

    async syncUserProfile(fbUser: FirebaseUser): Promise<User> {
        return authService.syncUserProfile(fbUser);
    },

    // --- ADMIN & USERS (Delegated to adminService) ---
    async getUsers(): Promise<User[]> {
        return adminService.getUsers();
    },

    async saveUser(userData: Partial<User> & { uid: string }): Promise<void> {
        return adminService.saveUser(userData);
    },

    async updateUser(userData: User): Promise<void> {
        return adminService.saveUser(userData);
    },

    async deleteUser(uid: string): Promise<void> {
        return adminService.deleteUser(uid);
    },

    async initializeSystem(): Promise<void> {
        return adminService.initializeSystem();
    },

    async verifyAdminKey(keyInput: string) {
        return authService.verifyAdminKey(keyInput);
    },

    async elevateUserRole(uid: string, method: 'GENESIS' | 'ISSUED', keyDocId?: string): Promise<void> {
        return authService.elevateUserRole(uid, method, keyDocId);
    },

    async verifyAdminSecret(key: string): Promise<boolean> {
        return adminService.verifyAdminSecret(key);
    },

    setupRecaptcha(containerId: string): RecaptchaVerifier {
        if ((window as any).recaptchaVerifier) (window as any).recaptchaVerifier.clear();
        const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
        (window as any).recaptchaVerifier = verifier;
        return verifier;
    },

    async signInPhone(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
        try {
            return await signInWithPhoneNumber(auth, phoneNumber, verifier);
        } catch (error) {
            logger.error('Error signing in with phone number:', error);
            // TODO: Add user-facing error notification
            throw error;
        }
    },

    // --- PET OPERATIONS (Delegated to petService) ---
    async getPets() {
        return petService.getPets();
    },

    async savePet(pet: PetProfile) {
        return petService.savePet(pet);
    },

    async deletePet(id: string) {
        return petService.deletePet(id);
    },

    async uploadPetPhoto(petId: string, file: File) {
        return petService.uploadPetPhoto(petId, file);
    },

    async reportMultipleSightings(updates: { id: string, isLost: boolean, lastSeenLocation: any }[]) {
        return petService.reportMultipleSightings(updates);
    },

    subscribeToPets(callback: (pets: PetProfile[]) => void) {
        return onSnapshot(collection(db, 'pets'), (s) => callback(s.docs.map(d => d.data() as PetProfile)));
    },

    // --- VET & CLINIC OPERATIONS (Delegated to vetService) ---
    async saveClinic(clinic: VetClinic) {
        return vetService.saveClinic(clinic);
    },

    async getClinics() {
        return vetService.getVetClinics();
    },

    subscribeToClinics(callback: (clinics: VetClinic[]) => void) {
        return onSnapshot(collection(db, 'clinics'), (s) => callback(s.docs.map(d => d.data() as VetClinic)));
    },

    // --- SYSTEM MESSAGES ---
    async saveContactMessage(msg: ContactMessage): Promise<void> {
        try {
            // No auth check needed here as contact messages are typically anonymous or from unauthenticated users.
            // If an auth check were needed for a similar function, it would look like this:
            // if (!dbService.auth.currentUser) {
            //     throw new Error("Authentication required to save contact message.");
            // }
            await addDoc(collection(db, 'contact_messages'), { ...msg, timestamp: Date.now() });
        } catch (error) {
            logger.error('Error saving contact message:', error);
            // TODO: Add user-facing error notification
            throw error;
        }
    },

    // --- CHAT (Delegated to contentService) ---
    async sendChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
        return contentService.sendChatMessage(sessionId, message);
    },

    async saveChatSession(session: ChatSession): Promise<void> {
        return contentService.saveChatSession(session);
    },

    subscribeToChats(email: string, callback: (chats: ChatSession[]) => void) {
        return contentService.subscribeToChats(email, callback);
    },

    // --- DONATIONS (Delegated to contentService) ---
    async recordDonation(donation: Donation): Promise<void> {
        return contentService.recordDonation(donation);
    },

    async getDonations(): Promise<Donation[]> {
        return contentService.getDonations();
    },

    subscribeToDonations(callback: (donations: Donation[]) => void) {
        return contentService.subscribeToDonations(callback);
    },

    // --- APPOINTMENTS (Delegated to vetService) ---
    async saveAppointment(appt: Appointment) {
        return vetService.saveAppointment(appt);
    },

    subscribeToAppointments(email: string, callback: (appts: Appointment[]) => void) {
        const q = query(collection(db, 'appointments'), or(where('vetEmail', '==', email), where('ownerEmail', '==', email)));
        return onSnapshot(q, (s) => callback(s.docs.map(d => d.data() as Appointment)));
    },

    // --- STORAGE (Delegated to petService where appropriate) ---
    async uploadImage(file: File, path: string): Promise<string> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to upload image.");
            }
            // Sanitize filename to avoid path issues
            const safePath = path.replace(/\s+/g, '_');
            const storageRef = ref(storage, safePath);
            
            console.log(`[Upload] Starting upload to ${safePath} for user ${auth.currentUser.uid}`);
            
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error: any) {
            logger.error(`Error uploading image to ${path}:`, error);
            // Re-throw with more context
            throw new Error(`Upload failed: ${error.message}`);
        }
    },

    // --- CONTENT (Delegated to contentService) ---
    async getBlogPosts(): Promise<BlogPost[]> {
        return contentService.getBlogPosts();
    },

    async incrementBlogPostView(id: string) {
        return contentService.incrementBlogPostView(id);
    },

    async createCheckoutSession(amount: number, donationId: string): Promise<{ id: string, url: string }> {
        return contentService.createCheckoutSession(amount, donationId);
    },

    async logAdminAction(log: { adminEmail: string, action: string, targetId?: string, details: string }) {
        return adminService.logAdminAction(log);
    }
};
