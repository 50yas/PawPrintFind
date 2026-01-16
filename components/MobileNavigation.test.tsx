import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileNavigation } from './MobileNavigation';
import { LanguageProvider } from '../contexts/LanguageContext'; // Assuming context is needed
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

// Mock DarkModeToggle to avoid complexity
vi.mock('./DarkModeToggle', () => ({
  default: () => <button className="min-w-[44px] min-h-[44px]">Theme</button>
}));

// Mock NavigationBottomSheet
vi.mock('./NavigationBottomSheet', () => ({
  NavigationBottomSheet: () => null
}));

describe('Mobile Accessibility & Touch Targets', () => {
  it('should ensure all navigation buttons have minimum touch target size of 44px', () => {
    render(
      <MobileNavigation 
        currentView="home" 
        setView={() => {}} 
        onAssistantClick={() => {}} 
      />
    );

    // Get all buttons
    const buttons = screen.getAllByRole('button');

    // Expected classes that contribute to touch target size
    // We look for explicit min-h/w or large fixed h/w or generous padding
    // For this test, we enforce a convention: all mobile nav buttons MUST have 'min-h-[44px]' and 'min-w-[44px]' 
    // OR be the big FAB (which is w-16 h-16)
    
    buttons.forEach((button, index) => {
      const className = button.className;
      
      const hasMinHeight = /min-h-\[44px\]/.test(className) || /h-16/.test(className) || /h-\[.*\]/.test(className); // FAB is h-16
      const hasMinWidth = /min-w-\[44px\]/.test(className) || /w-16/.test(className) || /w-\[.*\]/.test(className); // FAB is w-16

      // We allow the "Theme" mock which has it, but we need to check the real buttons.
      // The real buttons in MobileNavigation currently DO NOT have these classes.
      
      // We'll skip the check for the mock theme button if it passes, but we want to fail on the others.
      if (button.textContent === 'Theme') return;

      if (!hasMinHeight || !hasMinWidth) {
        console.error(`Button at index ${index} (${button.textContent}) failed touch target check. Class: ${className}`);
      }

      expect(hasMinHeight && hasMinWidth).toBe(true);
    });
  });
});