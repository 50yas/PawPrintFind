import { vi } from 'vitest';
import '@testing-library/jest-dom';
import 'vitest-axe/extend-expect';
import 'jest-canvas-mock';

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Firebase SDK
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn((cb) => {
      // Immediate callback with null user for standard setup
      if (typeof cb === 'function') cb(null);
      return () => { };
    }),
  })),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  RecaptchaVerifier: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  GoogleAuthProvider: class { },
  setPersistence: vi.fn().mockResolvedValue(undefined),
  browserLocalPersistence: 'LOCAL',
}));

vi.mock('firebase/firestore', () => {
  const mockDb = { type: 'firestore' };
  const mockCollection = vi.fn((_db, path) => ({
    id: path,
    type: 'collection',
    _is_firebase_collection: true,
    withConverter: vi.fn().mockReturnThis(),
  }));
  const mockDoc = vi.fn((_dbOrCollection, path) => ({
    id: path,
    type: 'doc',
    _is_firebase_doc: true,
    withConverter: vi.fn().mockReturnThis(),
  }));

  return {
    getFirestore: vi.fn(() => mockDb),
    initializeFirestore: vi.fn(() => mockDb),
    collection: mockCollection,
    doc: mockDoc,
    getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
    setDoc: vi.fn().mockResolvedValue({}),
    updateDoc: vi.fn().mockResolvedValue({}),
    deleteDoc: vi.fn().mockResolvedValue({}),
    query: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getDocs: vi.fn().mockResolvedValue({ docs: [], empty: true }),
    arrayUnion: vi.fn(val => ({ type: 'arrayUnion', val })),
    increment: vi.fn(val => ({ type: 'increment', val })),
    addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    onSnapshot: vi.fn((_q, cb) => {
      if (typeof cb === 'function') cb({ docs: [] });
      return () => { };
    }),
    getCountFromServer: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
    getAggregateFromServer: vi.fn().mockResolvedValue({ data: () => ({ total: 0 }) }),
    sum: vi.fn(),
    FieldValue: {
      serverTimestamp: vi.fn(() => 'mock-timestamp'),
      increment: vi.fn(n => ({ type: 'increment', value: n })),
    }
  };
});

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })),
}));

vi.mock('firebase/remote-config', () => ({
  getRemoteConfig: vi.fn(),
  fetchAndActivate: vi.fn(),
  getValue: vi.fn(),
  getString: vi.fn(),
}));

// Mock loggerService
vi.mock('./services/loggerService', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      dir: vi.fn(() => 'ltr'),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock crypto subtle for verifyAdminKey
const mockDigest = vi.fn(async (algorithm, data) => {
  const text = new TextDecoder().decode(data);
  if (text === 'GENESIS_KEY_INPUT') {
    return new Uint8Array(
      '83036031472796eaf4267d6d664e6c4950db82ff4e0e0a9e59b894d4d9608915'.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    ).buffer;
  }
  return new Uint8Array([0x00, 0x01, 0x02]).buffer;
});

vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
  },
});

vi.stubGlobal('scrollTo', vi.fn());

class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Stub jest global for jest-canvas-mock
vi.stubGlobal('jest', vi);
