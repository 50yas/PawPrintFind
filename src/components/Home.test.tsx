
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Home } from './Home';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock hooks
vi.mock('../hooks/useScrollAnimation', () => ({
  useScrollAnimation: vi.fn(),
}));

// Mock services
vi.mock('../services/firebase', () => ({
  dbService: {
    subscribeToDonations: vi.fn(() => vi.fn()),
  },
}));

// Mock components to simplify testing
vi.mock('./MissingPetsMap', () => ({
  MissingPetsMap: () => <div data-testid="missing-pets-map">Missing Pets Map</div>
}));

vi.mock('./DonorTicker', () => ({
  DonorTicker: () => <div data-testid="donor-ticker">Donor Ticker</div>
}));

vi.mock('./RoleExplorer', () => ({
  RoleExplorer: () => <div data-testid="role-explorer">Role Explorer</div>
}));

vi.mock('./SupportCard', () => ({
  SupportCard: () => <div data-testid="support-card">Support Card</div>
}));

vi.mock('./ui', () => ({
  CinematicImage: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
  GlassButton: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button>,
}));

describe('Home Component', () => {
  const mockSetView = vi.fn();
  const mockOpenLogin = vi.fn();
  const mockLostPets: any[] = [];
  const mockPetsForAdoption: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero section titles and buttons', () => {
    render(
      <Home 
        setView={mockSetView} 
        openLogin={mockOpenLogin} 
        currentUser={null} 
        lostPets={mockLostPets} 
        petsForAdoption={mockPetsForAdoption} 
      />
    );

    expect(screen.getByText('homeTitle1')).toBeInTheDocument();
    expect(screen.getByText('createImprontaButton')).toBeInTheDocument();
    expect(screen.getByText('foundPetButton')).toBeInTheDocument();
  });

  it('calls openLogin when action button is clicked and user is not logged in', () => {
    render(
      <Home 
        setView={mockSetView} 
        openLogin={mockOpenLogin} 
        currentUser={null} 
        lostPets={mockLostPets} 
        petsForAdoption={mockPetsForAdoption} 
      />
    );

    fireEvent.click(screen.getByText('createImprontaButton'));
    expect(mockOpenLogin).toHaveBeenCalledTimes(1);
    expect(mockSetView).not.toHaveBeenCalled();
  });

  it('calls setView when action button is clicked and user is logged in', () => {
    const mockUser: any = { uid: '123' };
    render(
      <Home 
        setView={mockSetView} 
        openLogin={mockOpenLogin} 
        currentUser={mockUser} 
        lostPets={mockLostPets} 
        petsForAdoption={mockPetsForAdoption} 
      />
    );

    fireEvent.click(screen.getByText('createImprontaButton'));
    expect(mockSetView).toHaveBeenCalledWith('register');
    expect(mockOpenLogin).not.toHaveBeenCalled();
  });

  it('renders sub-sections like Map, RoleExplorer and DonorTicker', async () => {
    render(
      <Home 
        setView={mockSetView} 
        openLogin={mockOpenLogin} 
        currentUser={null} 
        lostPets={mockLostPets} 
        petsForAdoption={mockPetsForAdoption} 
      />
    );

    expect(await screen.findByTestId('missing-pets-map')).toBeInTheDocument();
    expect(await screen.findByTestId('role-explorer')).toBeInTheDocument();
    expect(await screen.findByTestId('donor-ticker')).toBeInTheDocument();
  });
});
