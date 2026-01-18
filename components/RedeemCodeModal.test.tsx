
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RedeemCodeModal } from './RedeemCodeModal';
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
    redeemCode: vi.fn().mockResolvedValue({ success: true, reward: 'EARLY_ACCESS' }),
  },
}));

describe('RedeemCodeModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and submit button', () => {
    render(<RedeemCodeModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByPlaceholderText('enterCodePlaceholder')).toBeInTheDocument();
    expect(screen.getByText('redeemButton')).toBeInTheDocument();
  });

  it('calls redeemCode on submit', async () => {
    const { dbService } = await import('../services/firebase');
    render(<RedeemCodeModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('enterCodePlaceholder');
    fireEvent.change(input, { target: { value: 'VIP-123' } });

    const btn = screen.getByText('redeemButton');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(dbService.redeemCode).toHaveBeenCalledWith('VIP-123');
    });
  });
});
