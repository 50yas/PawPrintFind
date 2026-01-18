
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navbar } from './Navbar';
import { User } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

// Mock RoleSwitcher to avoid firebase dependency
vi.mock('./RoleSwitcher', () => ({
  RoleSwitcher: () => <div data-testid="role-switcher">Role Switcher</div>
}));

// Mock DarkModeToggle
vi.mock('./DarkModeToggle', () => ({
  default: () => <div data-testid="dark-mode-toggle">Toggle</div>
}));

// Mock LanguageSwitcher
vi.mock('./LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher">Lang</div>
}));

// Mock RedeemCodeModal
vi.mock('./RedeemCodeModal', () => ({
  RedeemCodeModal: () => <div data-testid="redeem-modal">MockModal</div>
}));

describe('Navbar Authentication and Navigation', () => {
  const mockSetUser = vi.fn();
  const mockSetView = vi.fn();

  const authenticatedUser: User = {
    uid: 'user123',
    email: 'user@example.com',
    role: 'owner',
    activeRole: 'owner'
  } as any;

  it('renders Home, Blog, and Adoption links for authenticated users', () => {
    render(
      <Navbar 
        currentUser={authenticatedUser} 
        setCurrentUser={mockSetUser} 
        setView={mockSetView}
      />
    );

    expect(screen.getByText('homeButton')).toBeInTheDocument();
    expect(screen.getByText('blogButton')).toBeInTheDocument();
    expect(screen.getByText('adoptionLink')).toBeInTheDocument();
    expect(screen.getByText('dashboardButton')).toBeInTheDocument();
  });

  it('renders Home, Blog, and Adoption links for unauthenticated users', () => {
    render(
      <Navbar 
        currentUser={null} 
        setCurrentUser={mockSetUser} 
        setView={mockSetView}
      />
    );

    expect(screen.getByText('homeButton')).toBeInTheDocument();
    expect(screen.getByText('blogButton')).toBeInTheDocument();
    expect(screen.getByText('adoptionLink')).toBeInTheDocument();
    expect(screen.queryByText('dashboardButton')).not.toBeInTheDocument();
    expect(screen.getByText('loginButton')).toBeInTheDocument();
  });
});
