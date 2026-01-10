
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Auth } from './Auth';
import React from 'react';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

vi.mock('../services/firebase', () => ({
  dbService: {
    resetPassword: vi.fn(),
    registerUser: vi.fn(),
    loginWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
  },
}));

vi.mock('./LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>
}));

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<Auth />);
    expect(screen.getByPlaceholderText(/Email/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/)).toBeInTheDocument();
  });

  it('switches to registration form', () => {
    render(<Auth />);
    fireEvent.click(screen.getByText('Initialize Profile'));
    expect(screen.getByPlaceholderText('Confirm Access Credential')).toBeInTheDocument();
  });

  it('switches to forgot password form', () => {
    render(<Auth />);
    fireEvent.click(screen.getByText('Lost Credentials?'));
    expect(screen.getByText('Initiate Recovery')).toBeInTheDocument();
  });

  it('handles email/password login', async () => {
    const { dbService } = await import('../services/firebase');
    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText(/Email/), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/), { target: { value: 'password' } });
    fireEvent.click(screen.getByText('Decrypt Dashboard'));

    await waitFor(() => {
      expect(dbService.loginWithEmail).toHaveBeenCalledWith('test@test.com', 'password');
    });
  });

  it('handles google login', async () => {
    const { dbService } = await import('../services/firebase');
    render(<Auth />);
    fireEvent.click(screen.getByText(/Sync with Google ID/));
    await waitFor(() => {
      expect(dbService.signInWithGoogle).toHaveBeenCalled();
    });
  });
});
