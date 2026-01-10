
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
vi.mock('./components/LoadingScreen', () => ({ LoadingScreen: () => <div data-testid="splash">Splash</div> }));
vi.mock('./components/HeroScene', () => ({ HeroScene: () => <div data-testid="heroscene">HeroScene</div> }));
vi.mock('./components/BiometricBackground', () => ({ BiometricBackground: () => <div data-testid="biometric-background">BiometricBackground</div> }));

// Mock routers - since they are now lazy loaded, we need to mock their default exports correctly
vi.mock('./components/routers/PublicRouter', () => ({ PublicRouter: () => <div data-testid="public-router">PublicRouter</div> }));
vi.mock('./components/routers/UserRouter', () => ({ UserRouter: () => <div data-testid="user-router">UserRouter</div> }));
vi.mock('./components/routers/VetRouter', () => ({ VetRouter: () => <div data-testid="vet-router">VetRouter</div> }));
vi.mock('./components/routers/ShelterRouter', () => ({ ShelterRouter: () => <div data-testid="shelter-router">ShelterRouter</div> }));
vi.mock('./components/routers/AdminRouter', () => ({ AdminRouter: () => <div data-testid="admin-router">AdminRouter</div> }));

// Mock useTheme
vi.mock('./contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#22d3ee',
      background: '#020617',
      secondary: '#c084fc',
    }
  }),
  ThemeProvider: ({ children }: any) => <div>{children}</div>
}));

const mockTranslation = (key: string) => key;
vi.mock('./components/LiveAssistantFAB', () => ({ LiveAssistantFAB: () => <div data-testid="fab">FAB</div> }));
vi.mock('./components/AdminUplink', () => ({ AdminUplink: () => <div data-testid="admin-uplink">AdminUplink</div> }));
vi.mock('./components/Auth', () => ({ Auth: () => <div data-testid="auth">Auth</div> }));
vi.mock('./components/SecureChatModal', () => ({ SecureChatModal: () => <div data-testid="secure-chat">SecureChat</div> }));
vi.mock('./components/AIHealthCheckModal', () => ({ AIHealthCheckModal: () => <div data-testid="ai-health-check">AIHealthCheck</div> }));
vi.mock('./components/ErrorBoundary', () => ({ ErrorBoundary: ({children}: {children: React.ReactNode}) => <div>{children}</div> }));

vi.mock('./hooks/useAuthSync', () => ({
    useAuthSync: () => ({
        currentUser: null,
        setCurrentUser: vi.fn(),
    })
}));

vi.mock('./hooks/useTranslations', () => ({
    useTranslations: () => ({
        t: (k: string) => k,
        locale: 'en',
        setLocale: vi.fn(),
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
    it('renders BiometricBackground instead of Background', async () => {
        render(<App />);
        
        const biometricBackground = await screen.findByTestId('biometric-background');
        const background = screen.queryByTestId('background');
        
        expect(biometricBackground).toBeInTheDocument();
        expect(background).not.toBeInTheDocument();
    });

    it('applies basic layout classes to root container', () => {
        const { container } = render(<App />);
        // The root div in App.tsx
        const rootDiv = container.firstChild as HTMLElement;
        expect(rootDiv).toHaveClass('text-foreground');
        expect(rootDiv).toHaveClass('bg-background');
        // We do NOT expect 'dark' class here anymore, as it's managed by ThemeContext on 'html'
    });
});

