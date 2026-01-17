
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
vi.mock('./VetVerification', () => ({ VetVerification: () => <div data-testid="vet-verification">Verification</div> }));
vi.mock('./VetPremiumModal', () => ({ VetPremiumModal: () => <div data-testid="premium-modal">Premium Modal</div> }));

describe('VetDashboard Component', () => {
  const mockProUser: User = {
    uid: 'vet1',
    email: 'vet@example.com',
    isVerified: true,
    subscription: { status: 'active' }
  } as any;

  const mockFreeUser: User = {
    uid: 'vet2',
    email: 'free@example.com',
    isVerified: true,
    subscription: { status: 'none' }
  } as any;

  const defaultProps = {
    setView: vi.fn(),
    pendingPatientCount: 2,
    pendingAppointmentCount: 1,
    confirmedPatientCount: 10,
    todaysAppointments: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Upgrade to Pro button for free users', () => {
    render(<VetDashboard {...defaultProps} user={mockFreeUser} />);
    expect(screen.getByText('🦁 Upgrade to Pro')).toBeInTheDocument();
  });

  it('shows Manage Subscription button for Pro users', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    // This should fail because I haven't added it yet
    expect(screen.getByText('🦁 Manage Subscription')).toBeInTheDocument();
  });

  it('calls openBillingPortal when Manage Subscription is clicked', async () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    const manageBtn = screen.getByText('🦁 Manage Subscription');
    fireEvent.click(manageBtn);
    expect(subscriptionService.openBillingPortal).toHaveBeenCalled();
  });
});
