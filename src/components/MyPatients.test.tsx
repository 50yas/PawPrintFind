import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyPatients } from './MyPatients';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, params?: any) => key,
  }),
}));

// Mock child components
vi.mock('./AddPatientModal', () => ({ AddPatientModal: () => <div data-testid="add-patient-modal">Add Patient</div> }));
vi.mock('./VetPremiumModal', () => ({ VetPremiumModal: ({ isOpen }: any) => isOpen ? <div data-testid="premium-modal">Premium Modal</div> : null }));
vi.mock('./ui/CinematicImage', () => ({ CinematicImage: () => <div /> }));

describe('MyPatients Component', () => {
  const mockPatients = [
    { id: 'p1', name: 'Max', breed: 'Labrador', age: '2', ownerEmail: 'owner@test.com', photos: [] }
  ];

  const mockFreeUser = { uid: 'vet1', email: 'vet@test.com', roles: ['vet'], activeRole: 'vet', subscription: { status: 'none' } } as any;
  const mockProUser = { uid: 'vet2', email: 'pro@test.com', roles: ['vet'], activeRole: 'vet', subscription: { status: 'active' } } as any;

  const defaultProps = {
    vetPatients: mockPatients as any,
    pendingRequests: [],
    vetEmail: 'vet@test.com',
    currentUser: mockFreeUser,
    onAccept: vi.fn(),
    onDecline: vi.fn(),
    onViewPatient: vi.fn(),
    onAddPatient: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MyPatients {...defaultProps} />);
    expect(screen.getByText('myPatientsTitle')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('shows subscription banner for free users', () => {
    render(<MyPatients {...defaultProps} />);
    expect(screen.getByText(/Free Plan Limit:/)).toBeInTheDocument();
  });

  it('does not show subscription banner for Pro users', () => {
    render(<MyPatients {...defaultProps} currentUser={mockProUser} />);
    expect(screen.queryByText(/Free Plan Limit:/)).not.toBeInTheDocument();
  });

  it('shows premium modal when limit reached (5 patients for free users)', () => {
    const fivePatients = Array(5).fill(0).map((_, i) => ({ id: `p${i}`, name: `Pet ${i}`, breed: 'Dog', photos: [] }));
    render(<MyPatients {...defaultProps} vetPatients={fivePatients as any} />);
    
    const addBtn = screen.getByText(/addPatientButton/);
    fireEvent.click(addBtn);
    
    expect(screen.getByTestId('premium-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('add-patient-modal')).not.toBeInTheDocument();
  });

  it('opens add modal when limit NOT reached', () => {
    render(<MyPatients {...defaultProps} />);
    
    const addBtn = screen.getByText(/addPatientButton/);
    fireEvent.click(addBtn);
    
    expect(screen.getByTestId('add-patient-modal')).toBeInTheDocument();
  });

  it('allows unlimited patients for Pro users', () => {
    const tenPatients = Array(10).fill(0).map((_, i) => ({ id: `p${i}`, name: `Pet ${i}`, breed: 'Dog', photos: [] }));
    render(<MyPatients {...defaultProps} vetPatients={tenPatients as any} currentUser={mockProUser} />);
    
    const addBtn = screen.getByText(/addPatientButton/);
    fireEvent.click(addBtn);
    
    expect(screen.getByTestId('add-patient-modal')).toBeInTheDocument();
  });
});