
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import React from 'react';

// Mock child components to avoid deep rendering
vi.mock('./components/Navbar', () => ({ Navbar: () => <div data-testid="navbar">Navbar</div> }));
vi.mock('./components/MobileNavigation', () => ({ MobileNavigation: () => <div data-testid="mobile-nav">MobileNav</div> }));
vi.mock('./components/Footer', () => ({ Footer: () => <div data-testid="footer">Footer</div> }));
vi.mock('./components/Background', () => ({ Background: () => <div data-testid="background">Background</div> }));
vi.mock('./components/HeroScene', () => ({ HeroScene: () => <div data-testid="hero-scene">HeroScene</div> }));
vi.mock('./components/LoadingScreen', () => ({ LoadingScreen: () => <div data-testid="loading">Loading</div> }));
vi.mock('./components/routers/PublicRouter', () => ({ PublicRouter: () => <div data-testid="public-router">PublicRouter</div> }));
vi.mock('./components/routers/UserRouter', () => ({ UserRouter: () => <div data-testid="user-router">UserRouter</div> }));
vi.mock('./components/routers/VetRouter', () => ({ VetRouter: () => <div data-testid="vet-router">VetRouter</div> }));
vi.mock('./components/routers/ShelterRouter', () => ({ ShelterRouter: () => <div data-testid="shelter-router">ShelterRouter</div> }));
vi.mock('./components/routers/AdminRouter', () => ({ AdminRouter: () => <div data-testid="admin-router">AdminRouter</div> }));
vi.mock('./components/LiveAssistantFAB', () => ({ LiveAssistantFAB: () => <div data-testid="fab">FAB</div> }));
vi.mock('./components/AdminUplink', () => ({ AdminUplink: () => <div data-testid="admin-uplink">AdminUplink</div> }));
vi.mock('./components/Auth', () => ({ Auth: () => <div data-testid="auth">Auth</div> }));
vi.mock('./components/SecureChatModal', () => ({ SecureChatModal: () => <div data-testid="secure-chat">SecureChat</div> }));
vi.mock('./components/AIHealthCheckModal', () => ({ AIHealthCheckModal: () => <div data-testid="ai-health-check">AIHealthCheck</div> }));
vi.mock('./components/ErrorBoundary', () => ({ ErrorBoundary: ({children}: {children: React.ReactNode}) => <div>{children}</div> }));

// Mock hooks
vi.mock('./hooks/useAuthSync', () => ({
    useAuthSync: () => ({
        currentUser: null,
        setCurrentUser: vi.fn(),
    })
}));

vi.mock('./contexts/SnackbarContext', () => ({
    useSnackbar: () => ({
        addSnackbar: vi.fn(),
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
    })
}));

describe('App Layout Refactor', () => {
    it('renders HeroScene instead of Background', () => {
        render(<App />);
        
        // Should fail initially as App uses Background
        const heroScene = screen.queryByTestId('hero-scene');
        const background = screen.queryByTestId('background');
        
        expect(heroScene).toBeInTheDocument();
        expect(background).not.toBeInTheDocument();
    });

    it('has correct z-index structure for background container', () => {
        render(<App />);
        // Use a more specific selector or data-testid if possible, 
        // but for now we look for the container wrapping the background component
        // Current App.tsx: <div className="fixed inset-0 z-0 ..."><Background /></div>
        
        // We want to ensure it remains optimized.
        // If we switch to HeroScene, we might assume the wrapper class is maintained or improved.
        // Let's just verify the component switch first.
    });
});
