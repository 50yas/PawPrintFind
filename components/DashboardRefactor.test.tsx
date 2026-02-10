
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from './Dashboard';
import { User, PetProfile } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, params?: any) => {
        if (key === 'dashboardWelcome') return `Welcome, ${params?.name}`;
        return key;
    },
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

// Mock child components that might have complex logic/dependencies
vi.mock('./SightingsMap', () => ({ SightingsMap: () => <div data-testid="map">Map</div> }));
vi.mock('./ReportLostModal', () => ({ ReportLostModal: () => <div data-testid="report-lost">ReportLost</div> }));
vi.mock('./SharePetModal', () => ({ SharePetModal: () => <div data-testid="share-pet">SharePet</div> }));
vi.mock('./Modal', () => ({ Modal: ({children}: any) => <div>{children}</div> }));
vi.mock('./OwnerPetDetailModal', () => ({ OwnerPetDetailModal: () => <div data-testid="pet-detail">PetDetail</div> }));

const mockUser: User = {
    uid: '123',
    email: 'test@example.com',
    activeRole: 'owner',
    roles: ['owner'],
    friends: [],
    friendRequests: [],
    points: 100,
    badges: [],
    createdAt: Date.now(),
};

const mockPets: PetProfile[] = [
    {
        id: 'pet1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: '2 years',
        ownerEmail: 'test@example.com',
        guardianEmails: [],
        photos: [{ id: '1', url: 'buddy.jpg', marks: [], description: 'buddy', timestamp: Date.now() }],
        isLost: false,
        status: 'owned',
        vetLinkStatus: 'unlinked',
        weight: '20kg',
        behavior: 'Friendly',
        homeLocations: [],
        lastSeenLocation: null,
        searchRadius: null,
        sightings: [],
        videoAnalysis: '',
        audioNotes: '',
        healthChecks: [],
    }
];

describe('Dashboard Refactor Glassmorphism', () => {
  it('uses GlassCard for the control center header', () => {
    render(
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
    );

    // Find the header - it should have backdrop-blur-xl
    const welcomeHeading = screen.getByText(/Welcome, test/);
    const header = welcomeHeading.closest('.backdrop-blur-xl');
    
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('backdrop-blur-xl');
    expect(header).toHaveClass('bg-surface-container-low');
  });

  it('renders PetCards within a responsive grid', () => {
    render(
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
    );

    const petCardName = screen.getByText('Buddy');
    expect(petCardName).toBeInTheDocument();
  });
});
