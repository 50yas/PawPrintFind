
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
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
    PetProfile, User, Donation, VetClinic, BlogPost, UserRole, Appointment,
    ChatSession, ChatMessage, AdminKey, ContactMessage, ContactMessageSchema,
    Sighting, VetVerificationRequest, VetVerificationRequestSchema, Geolocation, AISettings
} from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { notificationService } from './notificationService';

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
const functions = getFunctions(app, 'us-central1');
const remoteConfig = getRemoteConfig(app);
const googleProvider = new GoogleAuthProvider();

// Initialize App Check
if (typeof window !== 'undefined') {
    const siteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY;
    if (siteKey) {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(siteKey),
            isTokenAutoRefreshEnabled: true
        });
    } else if (import.meta.env.DEV || (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN) {
        // Allow debug token in dev mode if siteKey is missing to avoid blocking UI
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.warn("App Check site key missing. Falling back to debug mode.");
    }
}

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
import { favoritesService } from './favoritesService';

export const dbService = {
    auth,

    // --- FAVORITES (Delegated to favoritesService) ---
    async addFavorite(userId: string, petId: string): Promise<void> {
        return favoritesService.addFavorite(userId, petId);
    },

    async removeFavorite(userId: string, petId: string): Promise<void> {
        return favoritesService.removeFavorite(userId, petId);
    },

    async checkIsFavorite(userId: string, petId: string): Promise<boolean> {
        return favoritesService.checkIsFavorite(userId, petId);
    },

    async getUserFavorites(userId: string): Promise<string[]> {
        return favoritesService.getUserFavorites(userId);
    },

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

    async getFilteredPets(filters: Record<string, unknown>): Promise<PetProfile[]> {
        return petService.getFilteredPets(filters);
    },

    async getAISettings(): Promise<AISettings> {
        return adminService.getAISettings();
    },

    async saveAISettings(settings: AISettings): Promise<void> {
        return adminService.saveAISettings(settings);
    },

    // --- VET VERIFICATION & PRO SUBSCRIPTION ---
    async submitVetVerification(request: Omit<VetVerificationRequest, 'id'>): Promise<string> {
        return vetService.submitVetVerification(request);
    },

    async uploadVerificationDoc(file: File, vetUid: string): Promise<string> {
        return vetService.uploadVerificationDoc(file, vetUid);
    },

    async getVerificationStatus(vetUid: string): Promise<VetVerificationRequest | null> {
        return vetService.getVerificationStatus(vetUid);
    },

    async approveVetVerification(requestId: string, grantPro: boolean = false): Promise<void> {
        return vetService.approveVetVerification(requestId, grantPro);
    },

    async rejectVetVerification(requestId: string, reason: string): Promise<void> {
        return vetService.rejectVetVerification(requestId, reason);
    },

    async checkPatientLimit(vetUid: string): Promise<{ reached: boolean; current: number; limit: number }> {
        return vetService.checkPatientLimit(vetUid);
    },

    async createVetProCheckout(vetUid: string, plan: 'monthly' | 'yearly'): Promise<{ url: string }> {
        return vetService.createVetProCheckout(vetUid, plan);
    },

    async getPendingVerifications(): Promise<VetVerificationRequest[]> {
        return vetService.getPendingVerifications();
    },

    async deleteUser(uid: string): Promise<void> {
        return adminService.deleteUser(uid);
    },

    async initializeSystem(): Promise<void> {
        return adminService.initializeSystem();
    },

    async getPublicStats(): Promise<{ activeNodes: number; biometricMatches: number; totalDonations: number }> {
        return adminService.getPublicStats();
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

    async reportMultipleSightings(updates: { id: string, isLost: boolean, lastSeenLocation: Geolocation }[]) {
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

    subscribeToPets(callback: (pets: PetProfile[]) => void, onError?: (error: Error) => void) {
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

    subscribeToClinics(callback: (clinics: VetClinic[]) => void, onError?: (error: Error) => void) {
        return vetService.subscribeToClinics(callback, onError);
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

    async getDonations(all: boolean = false): Promise<Donation[]> {
        return contentService.getDonations(all);
    },

    async deleteDonation(id: string): Promise<void> {
        return contentService.deleteDonation(id);
    },

    async confirmDonation(id: string): Promise<void> {
        return contentService.confirmDonation(id);
    },

    subscribeToDonations(callback: (donations: Donation[]) => void, onError?: (error: Error) => void, all: boolean = false) {
        return contentService.subscribeToDonations(callback, onError, all);
    },

    // --- APPOINTMENTS (Delegated to vetService) ---
    async saveAppointment(appt: Appointment) {
        return vetService.saveAppointment(appt);
    },

    subscribeToAppointments(email: string, callback: (appts: Appointment[]) => void) {
        return vetService.subscribeToAppointments(email, callback);
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
        } catch (error: unknown) {
            const err = error as Error;
            logger.error(`Error uploading image to ${path}:`, err);
            // Re-throw with more context
            throw new Error(`Upload failed: ${err.message}`);
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
