
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VetVerificationModal } from './VetVerificationModal';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock dbService
vi.mock('../services/firebase', () => ({
  dbService: {
    uploadVerificationDoc: vi.fn(),
    submitVetVerification: vi.fn()
  }
}));

describe('VetVerificationModal Component', () => {
  const defaultProps = {
    onClose: vi.fn(),
    vetUid: 'vet123',
    vetEmail: 'vet@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <SnackbarProvider>
        {ui}
      </SnackbarProvider>
    );
  };

  it('renders professional verification header', () => {
    renderWithProviders(<VetVerificationModal {...defaultProps} />);
    expect(screen.getByText('Professional Verification')).toBeInTheDocument();
  });

  it('displays rejection reason if provided', () => {
    const reason = 'License is expired';
    renderWithProviders(<VetVerificationModal {...defaultProps} initialRejectionReason={reason} />);
    expect(screen.getByText('Previous Request Declined')).toBeInTheDocument();
    expect(screen.getByText(`Reason: ${reason}`)).toBeInTheDocument();
  });

  it('shows first step by default', () => {
    renderWithProviders(<VetVerificationModal {...defaultProps} />);
    expect(screen.getByText('Clinic Information')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Happy Paws/i)).toBeInTheDocument();
  });
});
