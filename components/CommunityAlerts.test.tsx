
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CommunityAlerts } from './CommunityAlerts';
import { PetProfile, User } from '../types';

// Mock EmojiSwitcher to verify it's used
vi.mock('./EmojiSwitcher', () => ({
  EmojiSwitcher: ({ children, onClick }: any) => (
    <button data-testid="emoji-switcher" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('CommunityAlerts Component', () => {
  const mockUser: User = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    uid: '123'
  };

  const mockAlerts: PetProfile[] = [
    {
      id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      photos: [{ url: 'buddy.jpg', timestamp: 0 }],
      ownerEmail: 'other@example.com',
      status: 'lost',
      age: '2 years',
      description: 'Lost dog',
      lastSeenLocation: { latitude: 0, longitude: 0 },
      type: 'dog'
    }
  ];

  it('should render EmojiSwitcher for report sighting button', () => {
    render(<CommunityAlerts alerts={mockAlerts} currentUser={mockUser} onReportSighting={() => {}} />);
    
    expect(screen.getByTestId('emoji-switcher')).toBeInTheDocument();
    expect(screen.getByText(/Segnala Avvistamento|reportSightingButton/i)).toBeInTheDocument();
  });
});
