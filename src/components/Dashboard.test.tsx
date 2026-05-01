
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from './Dashboard';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { User, PetProfile } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, params?: any) => key,
  }),
}));

vi.mock('../services/searchService', () => ({
    searchService: {
        getSavedSearches: vi.fn().mockResolvedValue([]),
        deleteSavedSearch: vi.fn(),
    },
}));

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  calculateProfileCompleteness: vi.fn().mockReturnValue(80),
}));

// Mock child components
vi.mock('./SightingsMap', () => ({ SightingsMap: () => <div data-testid="sightings-map">Map</div> }));
vi.mock('./ReportLostModal', () => ({ ReportLostModal: () => <div data-testid="report-lost-modal">Report Lost</div> }));
vi.mock('./SharePetModal', () => ({ SharePetModal: () => <div data-testid="share-modal">Share</div> }));
vi.mock('./OwnerPetDetailModal', () => ({ OwnerPetDetailModal: () => <div data-testid="detail-modal">Detail</div> }));
vi.mock('./ui/CinematicImage', () => ({ CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} /> }));

describe('Dashboard Component', () => {
  const mockUser: User = { 
    uid: '1', 
    email: 'test@example.com', 
    roles: ['owner'], 
    activeRole: 'owner',
    badges: [],
    points: 0,
    friends: [],
    friendRequests: []
  } as any;
  const mockPets: PetProfile[] = [
    { id: 'p1', name: 'Buddy', breed: 'Golden', photos: [{ url: 'buddy.jpg' }], isLost: false, behavior: 'Good' } as any
  ];

  const defaultProps = {
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
    onViewPet: vi.fn(),
    onTransferOwnership: vi.fn(),
    onApplySearch: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome message and user pets', () => {
    render(<SnackbarProvider><Dashboard {...defaultProps} onViewPet={vi.fn()} /></SnackbarProvider>);
    expect(screen.getByText('dashboardWelcome')).toBeInTheDocument();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });

  it('calls onRegisterNew when the add button is clicked', () => {
    render(<SnackbarProvider><Dashboard {...defaultProps} onViewPet={vi.fn()} /></SnackbarProvider>);
    const addBtns = screen.getAllByText('addNewImprontaButton');
    fireEvent.click(addBtns[0]);
    expect(defaultProps.onRegisterNew).toHaveBeenCalled();
  });

  it('opens User Menu and shows logout button', () => {
    render(<SnackbarProvider><Dashboard {...defaultProps} onViewPet={vi.fn()} /></SnackbarProvider>);
    const avatarBtn = screen.getByText('T'); // charAt(0)
    fireEvent.click(avatarBtn);
    expect(screen.getByText('logoutButton')).toBeInTheDocument();
  });

  it('triggers onEditPet from PetCard action', () => {
    render(<SnackbarProvider><Dashboard {...defaultProps} onViewPet={vi.fn()} /></SnackbarProvider>);
    // The edit button has title='editButton' (mocked t returns key)
    const editBtn = screen.getByTitle('editButton');
    fireEvent.click(editBtn);
    expect(defaultProps.onEditPet).toHaveBeenCalledWith(mockPets[0]);
  });
});
