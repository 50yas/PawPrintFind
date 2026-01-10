
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PressKit } from './PressKit';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('PressKit Component', () => {
  const mockGoBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders press kit header and assets', () => {
    render(<PressKit goBack={mockGoBack} />);
    
    expect(screen.getByText('pressKitTitle')).toBeInTheDocument();
    expect(screen.getByText('assetLogoIcon')).toBeInTheDocument();
    expect(screen.getByText('assetLogoText')).toBeInTheDocument();
    expect(screen.getByText('assetLogoLockup')).toBeInTheDocument();
  });

  it('calls goBack when back button is clicked', () => {
    render(<PressKit goBack={mockGoBack} />);
    
    const backBtn = screen.getByText(/homeButton/i);
    fireEvent.click(backBtn);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('opens asset preview modal when an asset is clicked', () => {
    render(<PressKit goBack={mockGoBack} />);
    
    const iconAsset = screen.getByText('assetLogoIcon');
    fireEvent.click(iconAsset.closest('div')!);

    expect(screen.getByText('downloadAsset')).toBeInTheDocument();
  });
});
