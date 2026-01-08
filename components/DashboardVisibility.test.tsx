
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from './Dashboard';
import { VetDashboard } from './VetDashboard';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { User, PetProfile } from '../types';
import { describe, it, expect, vi } from 'vitest';

// Mock matchMedia
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
    aiIdentityCode: 'FIDO123',
    status: 'active',
    microchipId: 'MC123',
    sex: 'male',
    weight: '20kg',
    medications: [],
    vaccinations: [],
    lastHealthCheck: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('Dashboard Visibility', () => {
  const renderDashboard = (props: any) => render(
    <LanguageProvider>
      <ThemeProvider>
        <Dashboard {...props} />
      </ThemeProvider>
    </LanguageProvider>
  );

  it('Control Center Header has high contrast text', () => {
    renderDashboard({
      user: mockUser,
      userPets: mockPets,
      onReportLost: vi.fn(),
      onMarkFound: vi.fn(),
      onEditPet: vi.fn(),
      onRegisterNew: vi.fn(),
      setView: vi.fn(),
      chatSessions: [],
      onOpenChat: vi.fn(),
      onRequestAppointment: vi.fn(),
      onLinkVet: vi.fn(),
      onSharePet: vi.fn(),
      onHealthCheck: vi.fn(),
      onTransferOwnership: vi.fn(),
    });

    const welcomeText = screen.getByText(/dashboardWelcome/i);
    // In dark mode/cinematic theme, welcome text should be white or light teal
    expect(welcomeText).toHaveClass('text-white');
    
    const statusText = screen.getByText(/protectedPets/i);
    expect(statusText.parentElement).toHaveClass('text-slate-300');
  });

      it('QuickAction titles are high contrast', () => {
          renderDashboard({
              user: mockUser,
              userPets: mockPets,
              onReportLost: vi.fn(),
              onMarkFound: vi.fn(),
              onEditPet: vi.fn(),
              onRegisterNew: vi.fn(),
              setView: vi.fn(),
              chatSessions: [],
              onOpenChat: vi.fn(),
              onRequestAppointment: vi.fn(),
              onLinkVet: vi.fn(),
              onSharePet: vi.fn(),
              onHealthCheck: vi.fn(),
              onTransferOwnership: vi.fn(),
          });
  
                          const actionTitles = screen.getAllByText(/addNewImprontaButton|communityHubButton|findVetTitle|supportUsTitle/i);
  
                          actionTitles.forEach(title => {
  
                              // Placeholder card uses text-white, quick actions use text-slate-200
  
                              const hasCorrectClass = title.classList.contains('text-slate-200') || title.classList.contains('text-white');
  
                              expect(hasCorrectClass).toBe(true);
  
                          });
  
                      });
  
          
  
              it('Dashboard sub-header has high visibility', () => {
  
                  renderDashboard({
  
                      user: mockUser,
  
                      userPets: mockPets,
  
                      onReportLost: vi.fn(),
  
                      onMarkFound: vi.fn(),
  
                      onEditPet: vi.fn(),
  
                      onRegisterNew: vi.fn(),
  
                      setView: vi.fn(),
  
                      chatSessions: [],
  
                      onOpenChat: vi.fn(),
  
                      onRequestAppointment: vi.fn(),
  
                      onLinkVet: vi.fn(),
  
                      onSharePet: vi.fn(),
  
                      onHealthCheck: vi.fn(),
  
                      onTransferOwnership: vi.fn(),
  
                  });
  
          
  
                  const subHeader = screen.getByText('dashboardTitle');
  
                  // Ensure it uses a light text class for visibility against dark backgrounds
  
                  expect(subHeader).toHaveClass('text-white');
  
              });});

describe('VetDashboard Visibility', () => {
    const renderVetDashboard = (props: any) => render(
        <LanguageProvider>
            <ThemeProvider>
                <VetDashboard {...props} />
            </ThemeProvider>
        </LanguageProvider>
    );

    it('Vet Header has high contrast text', () => {
        renderVetDashboard({
            user: { ...mockUser, activeRole: 'vet' },
            setView: vi.fn(),
            pendingPatientCount: 0,
            pendingAppointmentCount: 0,
            confirmedPatientCount: 0,
            todaysAppointments: [],
        });

        const title = screen.getByText('vetDashboardTitle');
        // Vet header is bg-gradient-to-r from-teal-900 to-cyan-900, text must be white
        expect(title).toHaveClass('text-3xl');
        expect(title.parentElement?.parentElement).toHaveClass('text-white');
    });
});
