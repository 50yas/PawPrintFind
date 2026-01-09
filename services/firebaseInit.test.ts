
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  setPersistence: vi.fn().mockResolvedValue(undefined),
  browserLocalPersistence: {},
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
}));

// Mock the performance module
const getPerformanceMock = vi.fn();
vi.mock('firebase/performance', () => ({
  getPerformance: getPerformanceMock,
}));

// Mock services to avoid circular dependency issues during test
vi.mock('./authService', () => ({ authService: {} }));
vi.mock('./petService', () => ({ petService: {} }));
vi.mock('./vetService', () => ({ vetService: {} }));
vi.mock('./contentService', () => ({ contentService: {} }));
vi.mock('./adminService', () => ({ adminService: {} }));

describe('Firebase Initialization', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
    getPerformanceMock.mockClear();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should initialize Performance Monitoring when window is defined', async () => {
    // Ensure window is defined
    global.window = {} as any;

    // Import the module to trigger side effects
    await import('./firebase');

    expect(getPerformanceMock).toHaveBeenCalled();
  });
});
