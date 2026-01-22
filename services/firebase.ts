
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
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig } from "firebase/remote-config";
import { PetProfile, User, Donation, VetClinic, BlogPost, UserRole, Appointment, ChatSession, ChatMessage, AdminKey, ContactMessage, ContactMessageSchema, Sighting } from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to avoid timeout errors in some environments
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const remoteConfig = getRemoteConfig(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Performance and Analytics only in browser
if (typeof window !== 'undefined') {
    getAnalytics(app);
    getPerformance(app);
}

setPersistence(auth, browserLocalPersistence).catch(console.error);

// EXPORTS (Base Instances)
export { db, auth, storage, functions, remoteConfig, googleProvider };

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

    async reportSighting(petId: string, sighting: Omit<Sighting, 'id'>) {
        await petService.reportSighting(petId, sighting);
        if (auth.currentUser) {
            await authService.checkAndAwardBadges(auth.currentUser.uid);
        }
    },

    async markPetFound(pet: PetProfile) {
        await petService.savePet({ ...pet, isLost: false });
        
        try {
            const { generateSuccessStory } = await import('./geminiService');
            const story = await generateSuccessStory(pet);
            
            if (story.title) {
                const blogPost: BlogPost = {
                    id: Date.now().toString(),
                    title: story.title,
                    summary: story.summary || '',
                    content: story.content || '',
                    author: 'Paw Print AI',
                    tags: story.tags || [],
                    publishedAt: Date.now(),
                    seoTitle: story.seoTitle || story.title,
                    seoDescription: story.seoDescription || story.summary || '',
                    slug: story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    views: 0
                };
                await this.saveBlogPost(blogPost);
                // Also award badge for reunion if applicable?
                if (auth.currentUser) {
                     // Increment reunion supported count manually or via another service method
                     // For now, let's just leave it to reportSighting for badges, 
                     // or we can add a 'markFound' stat increment logic in authService later.
                }
            }
        } catch (e) {
            console.error("Failed to generate success story:", e);
        }
    },

    subscribeToPets(callback: (pets: PetProfile[]) => void, onError?: (error: any) => void) {
        return onSnapshot(collection(db, 'pets'), 
            (s) => callback(s.docs.map(d => d.data() as PetProfile)),
            (error) => { if (onError) onError(error); else console.error("Pets subscription error:", error); }
        );
    },

    // --- VET & CLINIC OPERATIONS (Delegated to vetService) ---
    async saveClinic(clinic: VetClinic) {
        return vetService.saveClinic(clinic);
    },

    async deleteClinic(id: string) {
        return vetService.deleteClinic(id);
    },

    async getClinics() {
        return vetService.getVetClinics();
    },

    subscribeToClinics(callback: (clinics: VetClinic[]) => void, onError?: (error: any) => void) {
        return onSnapshot(collection(db, 'vet_clinics'), 
            (s) => callback(s.docs.map(d => d.data() as VetClinic)),
            (error) => { if (onError) onError(error); else console.error("Clinics subscription error:", error); }
        );
    },

    // --- SYSTEM MESSAGES ---
    async saveContactMessage(msg: ContactMessage): Promise<void> {
        try {
            validationService.validate(ContactMessageSchema, msg, 'saveContactMessage');
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

    subscribeToDonations(callback: (donations: Donation[]) => void, onError?: (error: any) => void) {
        return contentService.subscribeToDonations(callback, onError);
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

    async saveBlogPost(post: BlogPost) {
        return contentService.saveBlogPost(post);
    },

    async deleteBlogPost(id: string) {
        return contentService.deleteBlogPost(id);
    },

    async incrementBlogPostView(id: string) {
        return contentService.incrementBlogPostView(id);
    },

    async createCheckoutSession(amount: number, donationId: string): Promise<{ id: string, url: string }> {
        return contentService.createCheckoutSession(amount, donationId);
    },

    async logAdminAction(log: { adminEmail: string, action: string, targetId?: string, details: string }) {
        return adminService.logAdminAction(log);
    },

    async redeemCode(code: string): Promise<{ success: boolean; reward: string }> {
        return authService.redeemCode(code);
    }
};
