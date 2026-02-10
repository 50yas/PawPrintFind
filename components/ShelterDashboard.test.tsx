
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShelterDashboard } from './ShelterDashboard';
import { PetProfile, ChatSession } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => {
        const map: any = {
            'dashboard:shelter.shelterDashboardTitle': 'Shelter Dashboard',
            'dashboard:shelter.manageAdoptions': 'Manage adoptions',
            'dashboard:shelter.registerNewAnimalButton': 'Register New Animal',
            'dashboard:shelter.animalsForAdoptionTitle': 'Animals for Adoption',
            'dashboard:shelter.noAnimalsRegistered': 'No animals registered',
            'dashboard:shelter.shelterKitTitle': 'Shelter Onboarding Kit',
            'dashboard:shelter.downloadKitButton': 'Download Kit'
        };
        return map[key] || key;
    },
  }),
}));

// Mock CinematicImage
vi.mock('./ui/CinematicImage', () => ({
    CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} />
}));

describe('ShelterDashboard Component', () => {
  const mockPets: PetProfile[] = [];
  const mockChatSessions: ChatSession[] = [];
  const mockOnRegisterNew = vi.fn();
  const mockOnEditPet = vi.fn();
  const mockOnOpenChat = vi.fn();
  const mockOnTransferOwnership = vi.fn();

  it('renders the Shelter Onboarding Kit section', () => {
    render(
      <ShelterDashboard 
        shelterPets={mockPets}
        onRegisterNew={mockOnRegisterNew}
        onEditPet={mockOnEditPet}
        chatSessions={mockChatSessions}
        onOpenChat={mockOnOpenChat}
        onTransferOwnership={mockOnTransferOwnership}
        onViewPet={vi.fn()}
      />
    );

    expect(screen.getByText('Shelter Onboarding Kit')).toBeInTheDocument();
    expect(screen.getByText('Download Kit')).toBeInTheDocument();
  });
});
