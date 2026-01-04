
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

describe('MobileNavigation Navigation Links', () => {
  const mockSetView = vi.fn();
  const mockAssistantClick = vi.fn();

  it('renders Home, Adoption, and Blog links', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={mockSetView} 
        onAssistantClick={mockAssistantClick}
      />
    );

    expect(screen.getByText('homeButton')).toBeInTheDocument();
    expect(screen.getByText('adoptionLink')).toBeInTheDocument();
    expect(screen.getByText('blogButton')).toBeInTheDocument();
  });

  it('shows USER when role is provided', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={mockSetView} 
        onAssistantClick={mockAssistantClick}
        userRole="owner"
      />
    );

    expect(screen.getByText('USER')).toBeInTheDocument();
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
