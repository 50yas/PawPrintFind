
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VetPremiumModal } from './VetPremiumModal';
import { subscriptionService } from '../services/subscriptionService';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock services
vi.mock('../services/subscriptionService', () => ({
  subscriptionService: {
    subscribeToPlan: vi.fn(),
  },
}));

// Mock Modal
vi.mock('./Modal', () => ({
    Modal: ({ children, isOpen, onClose, title }: any) => isOpen ? (
        <div data-testid="modal">
            <h1>{title}</h1>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ) : null
}));

// Mock LoadingSpinner
vi.mock('./LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('VetPremiumModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<VetPremiumModal {...defaultProps} />);
    expect(screen.getByText('Upgrade to Vet Pro 🏥')).toBeInTheDocument();
    expect(screen.getByText('Vet Pro')).toBeInTheDocument();
    expect(screen.getByText('€18.00')).toBeInTheDocument();
  });

  it('calls subscribeToPlan when Upgrade Now is clicked', async () => {
    render(<VetPremiumModal {...defaultProps} />);
    const upgradeBtn = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeBtn);
    expect(subscriptionService.subscribeToPlan).toHaveBeenCalledWith(expect.stringContaining('price_'));
  });

  it('shows loading spinner when subscribing', async () => {
    // Make it stay in loading state by providing a promise that doesn't resolve immediately
    (subscriptionService.subscribeToPlan as any).mockReturnValue(new Promise(() => {}));
    
    render(<VetPremiumModal {...defaultProps} />);
    const upgradeBtn = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeBtn);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(upgradeBtn).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<VetPremiumModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Upgrade to Vet Pro 🏥')).not.toBeInTheDocument();
  });
});
