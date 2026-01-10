
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VetVerification } from './VetVerification';
import { User } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Snackbar
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

// Mock services
vi.mock('../services/firebase', () => ({
  dbService: {
    uploadImage: vi.fn().mockResolvedValue('http://example.com/doc.pdf'),
    saveUser: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('VetVerification Component', () => {
  const mockUser: User = {
    uid: 'vet123',
    email: 'vet@example.com',
    role: 'vet',
    activeRole: 'vet'
  } as any;

  const mockOnVerificationSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verification form with initial state', () => {
    render(<VetVerification user={mockUser} onVerificationSubmitted={mockOnVerificationSubmitted} />);

    expect(screen.getByText('vetVerificationTitle')).toBeInTheDocument();
    expect(screen.getByText('submitVerification')).toBeDisabled();
  });

  it('enables submit button only when file is selected and terms accepted', async () => {
    render(<VetVerification user={mockUser} onVerificationSubmitted={mockOnVerificationSubmitted} />);
    
    const submitBtn = screen.getByText('submitVerification');
    expect(submitBtn).toBeDisabled();

    // Accept terms
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(submitBtn).toBeDisabled();

    // Select file
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/clickToUpload/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(submitBtn).not.toBeDisabled();
  });

  it('handles successful submission', async () => {
    const { dbService } = await import('../services/firebase');
    render(<VetVerification user={mockUser} onVerificationSubmitted={mockOnVerificationSubmitted} />);
    
    // Accept terms and select file
    fireEvent.click(screen.getByRole('checkbox'));
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/clickToUpload/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Submit
    fireEvent.click(screen.getByText('submitVerification'));

    await waitFor(() => {
      expect(dbService.uploadImage).toHaveBeenCalled();
      expect(dbService.saveUser).toHaveBeenCalled();
      expect(mockOnVerificationSubmitted).toHaveBeenCalled();
    });
  });
});
