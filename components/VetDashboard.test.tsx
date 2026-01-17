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
vi.mock('./AIAnalyticsView', () => ({ AIAnalyticsView: ({ onClose }: any) => (
    <div data-testid="analytics-view">
        Analytics View
        <button onClick={onClose}>Close</button>
    </div>
)}));

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
    todaysAppointments: [],
    patients: []
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
    expect(screen.getByText('🦁 Manage Subscription')).toBeInTheDocument();
  });

  it('calls openBillingPortal when Manage Subscription is clicked', async () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    const manageBtn = screen.getByText('🦁 Manage Subscription');
    fireEvent.click(manageBtn);
    expect(subscriptionService.openBillingPortal).toHaveBeenCalled();
  });

  it('shows AI Analytics action card for Pro users', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    expect(screen.getByText('aiAnalyticsDashboardTitle')).toBeInTheDocument();
  });

  it('does NOT show AI Analytics action card for free users', () => {
    render(<VetDashboard {...defaultProps} user={mockFreeUser} />);
    expect(screen.queryByText('aiAnalyticsDashboardTitle')).not.toBeInTheDocument();
  });

  it('opens AI Analytics view when action card is clicked', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    const analyticsBtn = screen.getByText('aiAnalyticsDashboardTitle');
    fireEvent.click(analyticsBtn);
    expect(screen.getByTestId('analytics-view')).toBeInTheDocument();
  });

  it('closes AI Analytics view when close button is clicked', () => {
    render(<VetDashboard {...defaultProps} user={mockProUser} />);
    
    // Open it first
    const analyticsBtn = screen.getByText('aiAnalyticsDashboardTitle');
    fireEvent.click(analyticsBtn);
    expect(screen.getByTestId('analytics-view')).toBeInTheDocument();

    // Close it
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('analytics-view')).not.toBeInTheDocument();
  });
});