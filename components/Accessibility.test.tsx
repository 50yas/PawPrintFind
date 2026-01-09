
import { render } from '@testing-library/react';
import * as axeMatchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';
import { expect, describe, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { AdoptionCenter } from './AdoptionCenter';
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
  isVerified: true,
  friends: [],
};

const mockPets: PetProfile[] = [
  {
    id: 'pet1',
    name: 'Fido',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '2 years',
    photos: [{ url: 'test.jpg', timestamp: Date.now(), isAIValidated: true }],
    ownerId: '123',
    ownerEmail: 'test@example.com',
    isLost: false,
    status: 'active',
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
  });

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
  });
});
