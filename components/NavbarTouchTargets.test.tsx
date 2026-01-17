
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from './Navbar';
import React from 'react';
import { User } from '../types';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

vi.mock('./RoleSwitcher', () => ({
  RoleSwitcher: () => <div>RoleSwitcher</div>,
}));

vi.mock('./DarkModeToggle', () => ({
  default: () => <div>Theme</div>,
}));

vi.mock('./LanguageSwitcher', () => ({
  default: () => <div>Lang</div>,
}));

// Mock NavigationBottomSheet
vi.mock('./NavigationBottomSheet', () => ({
  NavigationBottomSheet: () => null
}));

describe('Navbar Mobile Touch Targets', () => {
  it('should ensure mobile menu trigger has minimum size of 44px', () => {
    // Set viewport to mobile
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(
      <Navbar 
        currentUser={null} 
        setCurrentUser={() => {}} 
        onLoginClick={() => {}} 
        onLogoutClick={() => {}} 
      />
    );

    const menuTrigger = screen.getByTestId('mobile-menu-trigger');
    const className = menuTrigger.className;
    
    // Check for w-11 h-11 (44px) or min-w-[44px]
    // Current code has w-10 h-10 (40px)
    const hasAdequateSize = (/w-11/.test(className) && /h-11/.test(className)) || 
                            (/w-\[44px\]/.test(className) && /h-\[44px\]/.test(className)) ||
                            (/min-w-\[44px\]/.test(className) && /min-h-\[44px\]/.test(className));

    expect(hasAdequateSize).toBe(true);
  });

  it('should ensure profile menu trigger has minimum size of 44px', () => {
      // Mock user to show profile menu
      const mockUser: User = {
          uid: '123',
          email: 'test@test.com',
          activeRole: 'owner',
          roles: ['owner'],
          friends: [],
          friendRequests: [],
          points: 0,
          badges: [],
          createdAt: Date.now()
      };

      render(
        <Navbar 
          currentUser={mockUser} 
          setCurrentUser={() => {}} 
          onLoginClick={() => {}} 
          onLogoutClick={() => {}} 
        />
      );

      // The profile button is the one with the initial
      // It has className relative group/avatar ...
      // We can find it by text (First letter of email)
      const profileButton = screen.getByText('T').closest('button');
      
      // Inside the button is the div with w-10 h-10.
      // But the button itself handles the click.
      // Let's check the button or the inner div. The button wraps the div.
      // If the button has no size, it shrinks to the div.
      // The inner div currently has w-10 h-10.
      
      expect(profileButton).not.toBeNull();
      if (!profileButton) return;

      const innerDiv = screen.getByText('T'); // This is the div
      const className = innerDiv.className;
      
      const hasAdequateSize = (/w-11/.test(className) && /h-11/.test(className)) || 
                              (/w-\[44px\]/.test(className) && /h-\[44px\]/.test(className));

      expect(hasAdequateSize).toBe(true);
  });
});
