
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
    activeRole: 'user',
    roles: ['user'],
    createdAt: new Date(),
    friends: []
};

const mockPets: PetProfile[] = [
    {
        id: 'pet1',
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: '3',
        ownerEmail: 'test@example.com',
        photos: [{ url: 'buddy.jpg', timestamp: Date.now() }],
        isLost: false,
        status: 'with_owner',
        createdAt: Date.now(),
        updatedAt: Date.now()
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
        onTransferOwnership={vi.fn()}
      />
    );

    // Find the header - it should have backdrop-blur-xl
    const welcomeHeading = screen.getByText(/Welcome, test/);
    const header = welcomeHeading.closest('.backdrop-blur-xl');
    
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('backdrop-blur-xl');
    expect(header).toHaveClass('bg-white/10');
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
        onTransferOwnership={vi.fn()}
      />
    );

    const petCardName = screen.getByText('Buddy');
    expect(petCardName).toBeInTheDocument();
  });
});
