import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import React from 'react';
import { dbService } from './services/firebase';

// Mock everything
vi.mock('./services/firebase', () => ({
    dbService: {
        logout: vi.fn().mockResolvedValue(undefined),
        savePet: vi.fn().mockResolvedValue(undefined),
        saveChatSession: vi.fn().mockResolvedValue(undefined),
        auth: { currentUser: null }
    }
}));

vi.mock('./hooks/useAuthSync', () => ({
    useAuthSync: () => ({
        currentUser: { uid: 'u1', email: 'test@test.com', activeRole: 'owner' },
        setCurrentUser: vi.fn(),
    })
}));

vi.mock('./hooks/useAppState', () => ({
    useAppState: () => ({
        allPets: [],
        vetClinics: [],
        donations: [],
        appointments: [],
        chatSessions: [],
        allUsers: [],
        handleRefreshAdminData: vi.fn(),
        setAllPets: vi.fn(),
        isLoading: false
    })
}));

vi.mock('./hooks/useTranslations', () => ({
    useTranslations: () => ({ t: (k: string) => k })
}));

vi.mock('./contexts/SnackbarContext', () => ({
    useSnackbar: () => ({ addSnackbar: vi.fn() }),
    SnackbarProvider: ({ children }: any) => <div>{children}</div>
}));

// Components
vi.mock('./components/Navbar', () => ({ Navbar: ({onLogoutClick}: any) => <button onClick={onLogoutClick}>Logout</button> }));
vi.mock('./components/Footer', () => ({ Footer: () => <div data-testid="footer">Footer</div> }));
vi.mock('./components/LoadingScreen', () => ({ LoadingScreen: () => <div data-testid="splash">Loading...</div> }));
vi.mock('./components/BiometricBackground', () => ({ BiometricBackground: () => <div>BG</div> }));
vi.mock('./components/routers/UserRouter', () => ({ UserRouter: () => <div data-testid="user-router">UserRouter</div> }));
vi.mock('./components/MobileNavigation', () => ({ MobileNavigation: () => <div>Nav</div> }));

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('eventually hides splash screen and shows main content', async () => {
        render(<App />);
        
        // Wait for LoadingScreen to disappear (it has a 2500ms timeout in App.tsx)
        // We use a longer timeout for waitFor
        await waitFor(() => {
            expect(screen.queryByTestId('splash')).not.toBeInTheDocument();
        }, { timeout: 5000 });

        expect(await screen.findByTestId('user-router')).toBeInTheDocument();
    });

    it('handles logout correctly', async () => {
        render(<App />);
        
        const logoutBtn = await screen.findByText('Logout');
        fireEvent.click(logoutBtn);

        expect(dbService.logout).toHaveBeenCalled();
    });
});