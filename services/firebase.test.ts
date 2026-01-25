
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbService, auth, db, storage } from './firebase';
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { authService } from './authService';
import { petService } from './petService';
import { vetService } from './vetService';
import { contentService } from './contentService';
import { adminService } from './adminService';
import { logger } from './loggerService';
import { validationService } from './validationService';

vi.mock('./loggerService');
vi.mock('./validationService', () => ({
  validationService: {
    validate: vi.fn()
  }
}));

vi.mock('./authService', () => ({
  authService: {
    loginWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    registerUser: vi.fn(),
    syncUserProfile: vi.fn(),
    verifyAdminKey: vi.fn(),
    elevateUserRole: vi.fn(),
    redeemCode: vi.fn(),
    checkAndAwardBadges: vi.fn()
  }
}));

vi.mock('./petService', () => ({
  petService: {
    getPets: vi.fn(),
    savePet: vi.fn(),
    deletePet: vi.fn(),
    uploadPetPhoto: vi.fn(),
    reportMultipleSightings: vi.fn(),
    reportSighting: vi.fn()
  }
}));

vi.mock('./vetService', () => ({
  vetService: {
    saveClinic: vi.fn(),
    deleteClinic: vi.fn(),
    getVetClinics: vi.fn(),
    saveAppointment: vi.fn()
  }
}));

vi.mock('./contentService', () => ({
  contentService: {
    sendChatMessage: vi.fn(),
    saveChatSession: vi.fn(),
    subscribeToChats: vi.fn(),
    recordDonation: vi.fn(),
    getDonations: vi.fn(),
    subscribeToDonations: vi.fn(),
    getBlogPosts: vi.fn(),
    saveBlogPost: vi.fn(),
    deleteBlogPost: vi.fn(),
    incrementBlogPostView: vi.fn(),
    createCheckoutSession: vi.fn()
  }
}));

vi.mock('./adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
    saveUser: vi.fn(),
    deleteUser: vi.fn(),
    initializeSystem: vi.fn(),
    verifyAdminSecret: vi.fn(),
    logAdminAction: vi.fn()
  }
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ _isDb: true })),
  initializeFirestore: vi.fn(() => ({ _isDb: true })),
  collection: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  increment: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
  or: vi.fn(),
  arrayUnion: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  browserLocalPersistence: {},
  setPersistence: vi.fn().mockResolvedValue(undefined),
  RecaptchaVerifier: vi.fn(),
  signInWithPhoneNumber: vi.fn()
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({ _isStorage: true })),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn()
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn()
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn()
}));

vi.mock('firebase/remote-config', () => ({
  getRemoteConfig: vi.fn()
}));

describe('dbService facade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates loginWithEmail to authService', async () => {
    await dbService.loginWithEmail('test@test.com', 'pass');
    expect(authService.loginWithEmail).toHaveBeenCalledWith('test@test.com', 'pass');
  });

  it('delegates getPets to petService', async () => {
    await dbService.getPets();
    expect(petService.getPets).toHaveBeenCalled();
  });

  it('delegates saveClinic to vetService', async () => {
    const clinic = { name: 'Vet' };
    await dbService.saveClinic(clinic as any);
    expect(vetService.saveClinic).toHaveBeenCalledWith(clinic);
  });

  it('delegates sendChatMessage to contentService', async () => {
    const msg = { text: 'hi' };
    await dbService.sendChatMessage('s1', msg as any);
    expect(contentService.sendChatMessage).toHaveBeenCalledWith('s1', msg);
  });

  it('delegates getUsers to adminService', async () => {
    await dbService.getUsers();
    expect(adminService.getUsers).toHaveBeenCalled();
  });

  it('saveContactMessage validates and calls addDoc', async () => {
    const msg = { name: 'User', email: 'test@test.com', subject: 'Hi', message: 'Hello world', timestamp: 0 };
    await dbService.saveContactMessage(msg);
    expect(validationService.validate).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalled();
  });

  it('uploadImage throws error if not authenticated', async () => {
    (auth as any).currentUser = null;
    await expect(dbService.uploadImage({} as any, 'path')).rejects.toThrow('Authentication required to upload image.');
  });

  it('uploadImage uploads file and returns URL if authenticated', async () => {
    (auth as any).currentUser = { uid: 'u1' };
    const file = new File([''], 'test.jpg');
    (uploadBytes as any).mockResolvedValue({ ref: 'ref' });
    (getDownloadURL as any).mockResolvedValue('http://download.url');
    
    const url = await dbService.uploadImage(file, 'test path');
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'test_path');
    expect(uploadBytes).toHaveBeenCalled();
    expect(url).toBe('http://download.url');
  });

  it('subscribeToPets calls onSnapshot', () => {
    const cb = vi.fn();
    dbService.subscribeToPets(cb);
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('reportSighting calls petService and awards badges', async () => {
    (auth as any).currentUser = { uid: 'u1' };
    await dbService.reportSighting('p1', { notes: 'seen' } as any);
    expect(petService.reportSighting).toHaveBeenCalledWith('p1', { notes: 'seen' });
    expect(authService.checkAndAwardBadges).toHaveBeenCalledWith('u1');
  });
});
