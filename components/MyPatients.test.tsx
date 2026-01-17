
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyPatients } from './MyPatients';
import { LanguageProvider } from '../contexts/LanguageContext';

describe('MyPatients', () => {
  const mockPatients = [
    { id: 'p1', name: 'Max', breed: 'Labrador', age: '2', ownerEmail: 'owner@test.com', photos: [] }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <MyPatients 
          vetPatients={mockPatients as any} 
          pendingRequests={[]} 
          vetEmail="vet@test.com"
          currentUser={{ uid: 'vet1', email: 'vet@test.com', roles: ['vet'], activeRole: 'vet' } as any}
          onAccept={vi.fn()}
          onDecline={vi.fn()}
          onViewPatient={vi.fn()}
          onAddPatient={vi.fn()}
        />
      </LanguageProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('myPatientsTitle')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });
});
