
import { render } from '@testing-library/react';
import * as axeMatchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';
import { expect, describe, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { AdoptionCenter } from './AdoptionCenter';
import { Auth } from './Auth';
import { Home } from './Home';
import { Navbar } from './Navbar';
import { AdminDashboard } from './AdminDashboard';
import { FavoriteButton } from './FavoriteButton';
import { DonationModal } from './DonationModal';
import { AIIdentikitCard } from './AIIdentikitCard';
import { AIHealthCheckModal } from './AIHealthCheckModal';
import { RegisterPet } from './RegisterPet';
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
    locale: 'en',
  }),
}));

// Mock dbService
vi.mock('../services/firebase', () => {
  const authMock = {
    currentUser: { uid: '123', email: 'test@example.com', isAnonymous: false, displayName: 'Test User' }
  };
  return {
    dbService: {
      subscribeToDonations: vi.fn(() => vi.fn()),
      logAdminAction: vi.fn().mockResolvedValue(undefined),
      getBlogPosts: vi.fn().mockResolvedValue([]),
      savePet: vi.fn().mockResolvedValue(undefined),
      deletePet: vi.fn().mockResolvedValue(undefined),
      deleteClinic: vi.fn().mockResolvedValue(undefined),
      saveUser: vi.fn().mockResolvedValue(undefined),
      checkIsFavorite: vi.fn().mockResolvedValue(false),
      addFavorite: vi.fn().mockResolvedValue(undefined),
      removeFavorite: vi.fn().mockResolvedValue(undefined),
      recordDonation: vi.fn().mockResolvedValue(undefined),
      createCheckoutSession: vi.fn().mockResolvedValue({ url: 'http://checkout.test' }),
      auth: authMock
    },
    auth: authMock,
    db: {}
  };
});

// Mock loggerService
vi.mock('../services/loggerService', () => ({
  logger: {
    subscribe: vi.fn(() => vi.fn()),
    clearLogs: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock searchService
vi.mock('../services/searchService', () => ({
  searchService: {
    getSavedSearches: vi.fn().mockResolvedValue({ docs: [] }),
    rankPets: vi.fn().mockResolvedValue([]),
  }
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

const mockAdmin: User = {
  ...mockUser,
        activeRole: 'super_admin',
        roles: ['super_admin'],};

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
              onViewPet={vi.fn()}
              onTransferOwnership={vi.fn()}
              onApplySearch={vi.fn()}
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
              onViewPet={vi.fn()}
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false}
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

  it('AdminDashboard should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AdminDashboard 
              users={[mockUser, mockAdmin]}
              currentUser={mockAdmin}
              allPets={mockPets}
              vetClinics={[]}
              donations={[]}
              onDeleteUser={vi.fn().mockResolvedValue(undefined)}
              onLogout={vi.fn()}
              onRefresh={vi.fn().mockResolvedValue(undefined)}
              onViewPet={vi.fn()}
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('FavoriteButton should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <FavoriteButton petId="pet1" />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('DonationModal should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <DonationModal isOpen={true} onClose={vi.fn()} />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('AIIdentikitCard should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AIIdentikitCard pet={mockPets[0]} />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('AIHealthCheckModal should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AIHealthCheckModal 
              pet={mockPets[0]} 
              onClose={vi.fn()} 
              onComplete={vi.fn()} 
              onBookAppointment={vi.fn()} 
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('RegisterPet should have no accessibility violations', async () => {
    const { container } = render(
      <SnackbarProvider>
        <LanguageProvider>
          <ThemeProvider>
            <RegisterPet 
              currentUser={mockUser}
              onRegister={vi.fn()}
              goToDashboard={vi.fn()}
              existingPet={null}
              mode="owned"
            />
          </ThemeProvider>
        </LanguageProvider>
      </SnackbarProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);
});
