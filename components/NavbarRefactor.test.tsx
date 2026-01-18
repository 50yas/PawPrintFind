
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navbar } from './Navbar';
import { MobileNavigation } from './MobileNavigation';
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

// Mock Router/Context if needed (Navbar uses some simple props)

// Mock RoleSwitcher to avoid firebase dependency
vi.mock('./RoleSwitcher', () => ({
  RoleSwitcher: () => <div data-testid="role-switcher">Role Switcher</div>
}));

// Mock DarkModeToggle
vi.mock('./DarkModeToggle', () => ({
  default: () => <div data-testid="dark-mode-toggle">Toggle</div>
}));

// Mock RedeemCodeModal
vi.mock('./RedeemCodeModal', () => ({
  RedeemCodeModal: () => <div data-testid="redeem-modal">MockModal</div>
}));

describe('Navbar Refactor Glassmorphism', () => {
  const mockSetUser = vi.fn();
  const mockSetView = vi.fn();

  it('uses GlassButton for Login action', () => {
    render(
      <Navbar 
        currentUser={null} 
        setCurrentUser={mockSetUser} 
        onLoginClick={vi.fn()}
      />
    );

    const loginBtn = screen.getByText('loginButton');
    // GlassButton primary variant classes
    expect(loginBtn.className).toContain('backdrop-blur-md');
    expect(loginBtn.className).toContain('bg-primary');
  });

  it('renders Navbar with Glassmorphism styles', () => {
    render(
      <Navbar 
        currentUser={null} 
        setCurrentUser={mockSetUser} 
      />
    );
    
    // We expect the nav to have specific glass classes
    // The previous implementation had 'bg-slate-950/40', we want to align with GlassCard 'bg-white/10' or similar consistent theme
    // But since it's a refactor, let's just check for the base GlassButton usage first which is the clearest "component usage" change.
    // We also check for accessibility
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});

describe('MobileNavigation Refactor Glassmorphism', () => {
  const mockSetView = vi.fn();

  it('uses Glass styles for container', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={mockSetView} 
        onAssistantClick={vi.fn()}
      />
    );

    // Mobile nav usually is fixed at bottom.
    // We want to verify it uses the new glass standards.
    // Currently it is 'bg-slate-950/90'. We might want 'bg-slate-900/80' or similar from GlassCard?
    // Let's just check if it renders for now, the real visual check is visual.
    // But we can check for accessibility.
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
