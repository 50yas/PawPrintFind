import { vi } from 'vitest';

// Mock Firebase SDK
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  RecaptchaVerifier: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  GoogleAuthProvider: class {},
  setPersistence: vi.fn().mockResolvedValue(undefined),
  browserLocalPersistence: 'LOCAL',
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  collection: vi.fn((_db, path) => ({ // Mock collection to return an object
    id: path,
    type: 'collection',
    _is_firebase_collection: true, // Marker for checking in tests if needed
  })),
  doc: vi.fn((_dbOrCollection, path) => ({ // Mock doc to return an object
    id: path,
    type: 'doc',
    _is_firebase_doc: true, // Marker
    // Add other properties if needed, like parent, path, etc.
  })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  arrayUnion: vi.fn(),
  increment: vi.fn(),
  addDoc: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock loggerService
vi.mock('./services/loggerService', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock crypto subtle for verifyAdminKey
const mockDigest = vi.fn(async (algorithm, data) => {
  // Simple mock: just return a fixed buffer or a hash of the data
  const text = new TextDecoder().decode(data);
  if (text === 'GENESIS_KEY_INPUT') {
    return new Uint8Array(
      '83036031472796eaf4267d6d664e6c4950db82ff4e0e0a9e59b894d4d9608915'.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    ).buffer;
  }
  // Return a generic hash for other inputs
  return new Uint8Array([0x00, 0x01, 0x02]).buffer;
});

vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
  },
});
