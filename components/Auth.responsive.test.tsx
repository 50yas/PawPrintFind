
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  auth: {}
}));

vi.mock('./LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock Three.js/Background to avoid WebGL issues in tests
vi.mock('./Background', () => ({
  Background: () => <div data-testid="cinematic-bg">3D Background</div>
}));

describe('Auth Responsive Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
  };

  it('renders side-split layout on desktop', () => {
    setViewport(1200);
    render(<Auth isFullScreen={true} />);
    
    const container = screen.getByTestId('auth-container');
    expect(container).toHaveClass('cinematic-split');
    const backgrounds = screen.getAllByTestId('cinematic-bg');
    expect(backgrounds.length).toBeGreaterThan(0);
  });

  it('renders full-height layout on mobile', () => {
    setViewport(375);
    render(<Auth isFullScreen={true} />);
    
    const container = screen.getByTestId('auth-container');
    // On mobile it should be a single column (default grid)
    expect(container).not.toHaveClass('lg:grid-cols-2');
  });

  it('contains the centered glass card for the form', () => {
    render(<Auth isFullScreen={true} />);
    const formCard = screen.getByTestId('auth-form-card');
    expect(formCard).toHaveClass('glass-card-premium');
  });
});
