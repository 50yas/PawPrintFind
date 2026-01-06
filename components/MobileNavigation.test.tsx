
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileNavigation } from './MobileNavigation';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

vi.mock('./LanguageSwitcher', () => ({ LanguageSwitcher: () => <div data-testid="lang-switch">Lang</div> }));
vi.mock('./DarkModeToggle', () => ({ 
  __esModule: true,
  default: () => <div data-testid="dark-toggle">Dark</div> 
}));

// Mock useTheme
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#22d3ee',
      background: '#020617',
    },
    isDark: true,
    toggleTheme: vi.fn(),
  })
}));

describe('MobileNavigation Navigation Links', () => {
  const mockSetView = vi.fn();
  const mockAssistantClick = vi.fn();

  it('renders Home, More, and Login links', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={mockSetView} 
        onAssistantClick={mockAssistantClick}
      />
    );

    expect(screen.getByText('homeButton')).toBeInTheDocument();
    expect(screen.getByText('moreButton')).toBeInTheDocument();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('shows DASH when role is provided', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={mockSetView} 
        onAssistantClick={mockAssistantClick}
        userRole="owner"
      />
    );

    expect(screen.getByText('DASH')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument();
  });

  it('shows LOGIN when no role is provided', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={mockSetView} 
        onAssistantClick={mockAssistantClick}
      />
    );

    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });
});
