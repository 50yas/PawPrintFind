
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Donors } from './Donors';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock DonationModal
vi.mock('./DonationModal', () => ({
  DonationModal: ({ isOpen }: any) => isOpen ? <div data-testid="donation-modal">Modal</div> : null,
}));

describe('Donors Component', () => {
  const mockGoBack = vi.fn();
  const mockDonations: any[] = [
    { id: '1', donorName: 'John', amount: '€10', timestamp: Date.now(), approved: true, isPublic: true, message: 'Go!' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and back button', () => {
    render(<Donors goBack={mockGoBack} donations={[]} />);
    expect(screen.getByText('donorsPageTitle')).toBeInTheDocument();
    
    const backBtn = screen.getByText(/homeButton/i);
    fireEvent.click(backBtn);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders list of approved donations', () => {
    render(<Donors goBack={mockGoBack} donations={mockDonations} />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('€10')).toBeInTheDocument();
    expect(screen.getByText('"Go!"')).toBeInTheDocument();
  });

  it('opens donation modal when CTA is clicked', () => {
    render(<Donors goBack={mockGoBack} donations={[]} />);
    const donateBtn = screen.getByText('donateWithBitcoin');
    fireEvent.click(donateBtn);
    expect(screen.getByTestId('donation-modal')).toBeInTheDocument();
  });
});
