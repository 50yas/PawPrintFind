
import { render } from '@testing-library/react';
import * as axeMatchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';
import { expect, describe, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { AdoptionCenter } from './AdoptionCenter';
import { Auth } from './Auth';
import { Home } from './Home';
import { Navbar } from './Navbar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { User, PetProfile } from '../types';

expect.extend(axeMatchers);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

const mockUser: User = {
  uid: '123',
  email: 'test@example.com',
  activeRole: 'owner',
  roles: ['owner'],
  isVerified: true,
  friends: [],
  friendRequests: [],
  points: 0,
  badges: [],
};

const mockPets: PetProfile[] = [
  {
    id: 'pet1',
    name: 'Fido',
    breed: 'Golden Retriever',
    age: '2 years',
    photos: [{ id: '1', url: 'test.jpg', marks: [], description: 'test', timestamp: Date.now(), isAIValidated: true }],
    ownerEmail: 'test@example.com',
    guardianEmails: [],
    isLost: false,
    status: 'owned',
    vetLinkStatus: 'unlinked',
    weight: '10kg',
    behavior: 'Friendly',
    homeLocations: [],
    lastSeenLocation: null,
    searchRadius: null,
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
  },
];

describe('Accessibility Audit', () => {
  it('Dashboard should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Dashboard 
              user={mockUser}
              userPets={mockPets}
              onReportLost={vi.fn()}
              onMarkFound={vi.fn()}
              onEditPet={vi.fn()}
              onRegisterNew={vi.fn()}
              setView={vi.fn()}
              chatSessions={[]}
              onOpenChat={vi.fn()}
              onRequestAppointment={vi.fn()}
              onLinkVet={vi.fn()}
              onSharePet={vi.fn()}
              onHealthCheck={vi.fn()}
              onTransferOwnership={vi.fn()}
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('AdoptionCenter should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AdoptionCenter 
              petsForAdoption={mockPets} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('Auth should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Auth onLogin={vi.fn()} onClose={vi.fn()} />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('Home should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Home 
              setView={vi.fn()} 
              openLogin={vi.fn()} 
              currentUser={null} 
              lostPets={[]}
              petsForAdoption={[]}
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('Navbar should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Navbar 
              currentUser={mockUser}
              setCurrentUser={vi.fn()}
              setView={vi.fn()} 
              onLoginClick={vi.fn()} 
              onLogoutClick={vi.fn()} 
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);
});
