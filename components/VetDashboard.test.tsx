
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VetDashboard } from './VetDashboard';
import { User } from '../types';
import React from 'react';
import { subscriptionService } from '../services/subscriptionService';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock services
vi.mock('../services/subscriptionService', () => ({
  subscriptionService: {
    openBillingPortal: vi.fn(),
  },
}));

// Mock child components
vi.mock('./VetVerificationModal', () => ({ VetVerificationModal: () => <div data-testid="vet-verification-modal">Verification Modal</div> }));
vi.mock('./VetProUpgradeModal', () => ({ VetProUpgradeModal: () => <div data-testid="upgrade-modal">Upgrade Modal</div> }));
vi.mock('./ui/ProFeatureTeaser', () => ({ ProFeatureTeaser: ({ title }: any) => <div data-testid="pro-teaser">{title}</div> }));
vi.mock('../services/firebase', () => ({
  dbService: {
    checkPatientLimit: vi.fn().mockResolvedValue({ current: 0, limit: 5, reached: false }),
    getVerificationStatus: vi.fn().mockResolvedValue(null)
  }
}));

describe('VetDashboard Component', () => {
  const mockProUser: User = {
    uid: 'vet1',
    email: 'vet@example.com',
    isVetVerified: true,
    vetTier: 'pro',
    vetProExpiry: Date.now() + 1000000
  } as any;

  const mockFreeUser: User = {
    uid: 'vet2',
    email: 'free@example.com',
    isVetVerified: false,
    vetTier: 'free'
  } as any;

  const defaultProps = {
    user: mockFreeUser,
    setView: vi.fn(),
    pendingPatientCount: 2,
    pendingAppointmentCount: 1,
    confirmedPatientCount: 10,
    todaysAppointments: [],
    patients: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Submit Documents button for unverified free users', () => {
    render(<VetDashboard {...defaultProps} user={mockFreeUser} />);
    expect(screen.getByText('Submit Documents 📄')).toBeInTheDocument();
  });

  it('shows Pro Active status for Pro users', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    expect(screen.getByText('👑 Pro Active')).toBeInTheDocument();
  });

  it('shows AI Health Analytics for Pro users', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    expect(screen.getByText('AI Health Analytics')).toBeInTheDocument();
  });

  it('shows teaser for Pro features for free users', () => {
    render(<VetDashboard {...defaultProps} user={mockFreeUser} />);
    expect(screen.getAllByTestId('pro-teaser')).toHaveLength(2);
  });
});
