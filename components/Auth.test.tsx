
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Auth } from './Auth';
import React from 'react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
      expect(screen.getByPlaceholderText('placeholders.email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('placeholders.password')).toBeInTheDocument();
    });
  
    it('switches to registration form', () => {
      render(<Auth />);
      fireEvent.click(screen.getByText('buttons.initializeProfile'));
      expect(screen.getByPlaceholderText('placeholders.confirmPassword')).toBeInTheDocument();
    });
  
    it('switches to forgot password form', () => {
      render(<Auth />);
      fireEvent.click(screen.getByText('buttons.lostCredentials'));
      expect(screen.getByText('buttons.initiateRecovery')).toBeInTheDocument();
    });
  
    it('handles email/password login', async () => {
      const { dbService } = await import('../services/firebase');
      render(<Auth />);
      fireEvent.change(screen.getByPlaceholderText('placeholders.email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText('placeholders.password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByText('buttons.decryptDashboard'));
      
      await waitFor(() => {
        expect(dbService.loginWithEmail).toHaveBeenCalledWith('test@test.com', 'password');
      });
    });
  
    it('handles google login', async () => {
      const { dbService } = await import('../services/firebase');
      render(<Auth />);
      fireEvent.click(screen.getByText('buttons.syncGoogle'));
      await waitFor(() => {
        expect(dbService.signInWithGoogle).toHaveBeenCalled();
      });
    });});
