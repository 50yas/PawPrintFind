import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SharePetModal } from './SharePetModal';
import { PetProfile } from '../types';

// Mock useTranslations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => {
        const translations: Record<string, string> = {
            'sharePetTitle': 'Share Test Pet',
            'shareWithFriendsButton': 'Friends',
            'sharePetDesc': 'Share this pet with your friends',
            'noFriendsToShare': 'No friends found',
        };
        return translations[key] || key;
    }
  }),
}));

// Mock Modal since it might use createPortal
vi.mock('./Modal', () => ({
  Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock('./ShareButton', () => ({
    ShareButton: () => <div data-testid="share-btn-mock">Share</div>
}));

vi.mock('./FavoriteButton', () => ({
    FavoriteButton: () => <div data-testid="favorite-btn-mock">Fav</div>
}));

vi.mock('./AIIdentikitCard', () => ({
    AIIdentikitCard: () => <div data-testid="ai-identikit-mock">AI Card</div>
}));

describe('SharePetModal', () => {
  const mockPet: PetProfile = {
    id: '123',
    name: 'Test Pet',
    breed: 'Husky',
    photos: [],
  } as any;

  it('renders tabs', () => {
    render(<SharePetModal isOpen={true} onClose={() => {}} pet={mockPet} friends={[]} onShare={() => {}} />);
    expect(screen.getByText('Instagram / TikTok')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
  });

  it('switches to Social tab by default', () => {
    render(<SharePetModal isOpen={true} onClose={() => {}} pet={mockPet} friends={[]} onShare={() => {}} />);
    expect(screen.getByText('AI Biometric Card')).toBeInTheDocument();
  });

  it('switches to Friends tab', () => {
    render(<SharePetModal isOpen={true} onClose={() => {}} pet={mockPet} friends={[]} onShare={() => {}} />);
    fireEvent.click(screen.getByText('Friends'));
    // Use the mock translation key or value
    expect(screen.getByText('Share this pet with your friends')).toBeInTheDocument();
  });

  it('displays the Paw-Print Challenge promotion', () => {
    render(<SharePetModal isOpen={true} onClose={() => {}} pet={mockPet} friends={[]} onShare={() => {}} />);
    // Use text match function to handle split text
    expect(screen.getByText((content, node) => {
        const hasText = (node: Element | null) => node?.textContent === "#PawPrintChallenge";
        const elementHasText = hasText(node);
        const childrenDontHaveText = Array.from(node?.children || []).every(
          (child) => !hasText(child as Element)
        );
        return elementHasText || content.includes('#PawPrintChallenge');
    })).toBeInTheDocument();
  });
});