import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VetDashboard } from './VetDashboard';
import { User } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock services
vi.mock('../services/firebase', () => ({
  dbService: {
    checkPatientLimit: vi.fn().mockResolvedValue({ current: 0, limit: 5, reached: false }),
    getVerificationStatus: vi.fn().mockResolvedValue(null)
  }
}));

// Mock child components
vi.mock('./VetVerificationModal', () => ({ VetVerificationModal: () => <div data-testid="vet-verification-modal">Verification Modal</div> }));
vi.mock('./VetProUpgradeModal', () => ({ VetProUpgradeModal: () => <div data-testid="upgrade-modal">Upgrade Modal</div> }));
vi.mock('./ui/ProFeatureTeaser', () => ({ ProFeatureTeaser: ({ title }: any) => <div data-testid="pro-teaser">{title}</div> }));

describe('VetDashboard Component', () => {
  const mockProUser: User = {
    uid: 'vet1',
    email: 'vet@example.com',
    isVetVerified: true,
    vetTier: 'pro',
    vetProExpiry: Date.now() + 1000000,
    verificationStatus: 'approved'
  } as any;

  const mockFreeUser: User = {
    uid: 'vet2',
    email: 'free@example.com',
    isVetVerified: false,
    vetTier: 'free',
    verificationStatus: 'none'
  } as any;

  const mockPendingUser: User = {
    uid: 'vet3',
    email: 'pending@example.com',
    isVetVerified: false,
    vetTier: 'free',
    verificationStatus: 'pending'
  } as any;

  const mockDeclinedUser: User = {
    uid: 'vet4',
    email: 'declined@example.com',
    isVetVerified: false,
    vetTier: 'free',
    verificationStatus: 'declined',
    rejectionReason: 'Invalid license'
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

  it('shows Submit Documents button for unverified users', () => {
    render(<VetDashboard {...defaultProps} user={mockFreeUser} />);
    expect(screen.getByText('Submit Documents')).toBeInTheDocument();
  });

  it('shows Awaiting Review for pending users', () => {
    render(<VetDashboard {...defaultProps} user={mockPendingUser} />);
    expect(screen.getByText('Awaiting Review')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Review')).toBeDisabled();
  });

  it('shows Retry Verification and reason for declined users', () => {
    render(<VetDashboard {...defaultProps} user={mockDeclinedUser} />);
    expect(screen.getByText('Retry Verification')).toBeInTheDocument();
    expect(screen.getByText(/Invalid license/)).toBeInTheDocument();
  });

  it('disables Upgrade to Pro for unverified users', () => {
    render(<VetDashboard {...defaultProps} user={mockFreeUser} />);
    const upgradeBtn = screen.getByText('🦁 Upgrade to Pro').closest('button');
    expect(upgradeBtn).toBeDisabled();
  });

  it('enables Upgrade to Pro for approved users', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    // Pro user shows 'Pro Active', so let's test a verified but free user
    const mockVerifiedFreeUser = { ...mockFreeUser, isVetVerified: true, verificationStatus: 'approved' };
    render(<VetDashboard {...defaultProps} user={mockVerifiedFreeUser as any} />);
    const upgradeBtn = screen.getByText('🦁 Upgrade to Pro').closest('button');
    expect(upgradeBtn).not.toBeDisabled();
  });

  it('shows Pro Active status for Pro users', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    expect(screen.getByText('👑 Pro Active')).toBeInTheDocument();
  });
});
