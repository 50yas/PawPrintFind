
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

  it('renders professional verification header', () => {
    render(
      <SnackbarProvider>
        <VetVerificationModal {...defaultProps} />
      </SnackbarProvider>
    );
    expect(screen.getByText('Professional Verification')).toBeInTheDocument();
  });

  it('displays rejection reason if provided', () => {
    const reason = 'License is expired';
    render(
      <SnackbarProvider>
        <VetVerificationModal {...defaultProps} initialRejectionReason={reason} />
      </SnackbarProvider>
    );
    expect(screen.getByText('Previous Request Declined')).toBeInTheDocument();
    expect(screen.getByText(`Reason: ${reason}`)).toBeInTheDocument();
  });

  it('shows first step by default', () => {
    render(
      <SnackbarProvider>
        <VetVerificationModal {...defaultProps} />
      </SnackbarProvider>
    );
    expect(screen.getByText('Clinic Information')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Happy Paws/i)).toBeInTheDocument();
  });
});
