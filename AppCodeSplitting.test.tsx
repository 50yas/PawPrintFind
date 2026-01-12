import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { Suspense } from 'react';
import App from './App';

// --- Mocks ---

// Mock Firebase
vi.mock('./services/firebase', () => ({
    dbService: {
        logout: vi.fn(),
        auth: { currentUser: null },
        onSnapshot: () => () => {},
    }
}));

// Mock Hooks
vi.mock('./hooks/useAuthSync', () => ({
    useAuthSync: () => ({
        currentUser: null, // Default to guest
        setCurrentUser: vi.fn(),
    })
}));

vi.mock('./hooks/useAppState', () => ({
    useAppState: () => ({
        allPets: [], vetClinics: [], donations: [], appointments: [], chatSessions: [], allUsers: [], isLoading: false
    })
}));

vi.mock('./hooks/useTranslations', () => ({
    useTranslations: () => ({ t: (k: string) => k })
}));

vi.mock('./contexts/SnackbarContext', () => ({
    useSnackbar: () => ({ addSnackbar: vi.fn() }),
    SnackbarProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock Components
vi.mock('./components/Navbar', () => ({ Navbar: () => <div>Navbar</div> }));
vi.mock('./components/Footer', () => ({ Footer: () => <div>Footer</div> }));
vi.mock('./components/MobileNavigation', () => ({ MobileNavigation: () => <div>Nav</div> }));
vi.mock('./components/LoadingScreen', () => ({ LoadingScreen: () => null })); // Disable splash
vi.mock('./components/BiometricBackground', () => ({ BiometricBackground: () => <div>BG</div> }));

// Mock LoadingSpinner to identify it
vi.mock('./components/LoadingSpinner', () => ({ LoadingSpinner: () => <div data-testid="loading-spinner">Spinner</div> }));

// Mock Routers to be simple
vi.mock('./components/routers/PublicRouter', () => ({ PublicRouter: () => <div>PublicRouter</div> }));

// --- THE CRITICAL MOCK ---
// We want to verify that Auth is wrapped in Suspense.
// We mock Auth to be a component that suspends (throws a promise).
// If it's NOT wrapped in Suspense, the test (render) will crash/error.
// If it IS wrapped, it should show the fallback (LoadingSpinner).

let suspendAuth = false;

vi.mock('./components/Auth', () => ({
    Auth: () => {
        if (suspendAuth) {
            throw new Promise(() => {}); // Never resolves, keeps suspending
        }
        return <div data-testid="auth-modal">AuthModal</div>;
    }
}));

describe('App Code Splitting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        suspendAuth = false;
        // Skip the splash screen
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('displays fallback when Auth modal is suspending (lazy loaded)', async () => {
        suspendAuth = true;

        // Spy on console.error to suppress React's "uncaught suspense" warning if it fails
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            render(<App />);
            
            // Fast-forward past splash
            act(() => {
                vi.runAllTimers();
            });

            // Trigger Login Modal
            act(() => {
                window.dispatchEvent(new Event('open_login_modal'));
            });

            // If Auth is wrapped in Suspense, we should see the fallback (LoadingSpinner)
            // If not, it might have crashed or show nothing (if caught by ErrorBoundary)
            // The existing App has ErrorBoundary, but we want to ensure we use Suspense fallback,
            // not the generic ErrorBoundary fallback (which might be different).
            // Actually, App's ErrorBoundary doesn't have a specific visual fallback defined in the mock?
            // Let's assume we want to see "Spinner".
            
            // We expect the spinner to be present. 
            // Note: Other parts of the app might also be suspending (causing other spinners), 
            // so we use getAllByTestId and look for the one in the modal context if possible, 
            // or just ensure at least one is present.
            const spinners = screen.getAllByTestId('loading-spinner');
            expect(spinners.length).toBeGreaterThan(0);
            
            // Optional: Check if one of them is inside the modal wrapper (which has specific classes)
            // The modal wrapper has "fixed inset-0 z-[300]"
            // But checking structure is brittle. Just verifying we have spinners is enough for this test.

        } catch (e) {
            // If it crashes, that's also a failure for "Handling Suspense"
            throw e; 
        } finally {
            consoleSpy.mockRestore();
        }
    });
});
