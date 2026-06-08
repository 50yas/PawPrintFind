
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DonationModal } from './DonationModal';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock dbService
vi.mock('../services/firebase', () => ({
  dbService: {
    auth: { currentUser: null },
    recordDonation: vi.fn().mockResolvedValue(undefined),
    createCheckoutSession: vi.fn().mockResolvedValue({ url: 'http://stripe.com/checkout' }),
    getPublicStats: vi.fn().mockResolvedValue({ totalDonations: 1000 }),
  },
}));

// Mock Modal to simplify
vi.mock('./Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => isOpen ? (
    <div data-testid="modal">
      <h1>{title}</h1>
      {children}
    </div>
  ) : null,
}));

describe('DonationModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Stripe view by default with tiers', () => {
    render(<DonationModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('donateTitle')).toBeInTheDocument();
    expect(screen.getByText('€5')).toBeInTheDocument();
    expect(screen.getByText('€25')).toBeInTheDocument();
    expect(screen.getByText('€100')).toBeInTheDocument();
  });

  it('allows switching to Crypto view', () => {
    render(<DonationModal isOpen={true} onClose={mockOnClose} />);
    
    const cryptoBtn = screen.getByText('paymentMethodCrypto');
    fireEvent.click(cryptoBtn);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('handles custom amount input', () => {
        render(<DonationModal isOpen={true} onClose={mockOnClose} />);
        
        const customInput = screen.getByPlaceholderText('donationAmountPlaceholder');
        fireEvent.focus(customInput);
        fireEvent.change(customInput, { target: { value: '75' } });
    expect(screen.getByText(/payWithStripe/i)).toHaveTextContent('€75.00');
  });

  it('processes Stripe donation and redirects', async () => {
    const { dbService } = await import('../services/firebase');
    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<DonationModal isOpen={true} onClose={mockOnClose} />);
    
    const donateBtn = screen.getByText(/payWithStripe/i);
    fireEvent.click(donateBtn);

    await waitFor(() => {
      expect(dbService.recordDonation).toHaveBeenCalled();
      expect(dbService.createCheckoutSession).toHaveBeenCalled();
      expect(window.location.href).toBe('http://stripe.com/checkout');
    });

    // Restore location
    (window as any).location = originalLocation;
  });
});
