
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShelterRouter } from './ShelterRouter';
import React from 'react';

// Mock child components
vi.mock('../ShelterDashboard', () => ({ ShelterDashboard: () => <div data-testid="shelter-dashboard">ShelterDashboard</div> }));
vi.mock('../RegisterPet', () => ({ RegisterPet: () => <div data-testid="register-pet">RegisterPet</div> }));
vi.mock('../Home', () => ({ Home: () => <div data-testid="home">Home</div> }));
vi.mock('../AdoptionCenter', () => ({ AdoptionCenter: () => <div data-testid="adoption-center">AdoptionCenter</div> }));

describe('ShelterRouter', () => {
    const defaultProps = {
        currentView: 'shelterDashboard' as any,
        setView: vi.fn(),
        currentUser: { uid: '1', email: 'test@test.com', activeRole: 'shelter' } as any,
        allPets: [],
        lostPets: [],
        petsForAdoption: [],
        donations: [],
        chatSessions: [],
        editingPet: null,
        setEditingPet: vi.fn(),
        selectedPost: null,
        setSelectedPost: vi.fn(),
        handleRegisterPet: vi.fn().mockResolvedValue(undefined),
        handleStartChat: vi.fn().mockResolvedValue(undefined),
        onOpenChat: vi.fn(),
        setIsLoginModalOpen: vi.fn(),
        isLoading: false
    };

    it('renders ShelterDashboard for default view', async () => {
        render(<ShelterRouter {...defaultProps} />);
        expect(await screen.findByTestId('shelter-dashboard')).toBeInTheDocument();
    });

    it('renders RegisterPet for register view', async () => {
        render(<ShelterRouter {...defaultProps} currentView="register" />);
        expect(await screen.findByTestId('register-pet')).toBeInTheDocument();
    });

    it('renders AdoptionCenter for adoptionCenter view', async () => {
        render(<ShelterRouter {...defaultProps} currentView="adoptionCenter" />);
        expect(await screen.findByTestId('adoption-center')).toBeInTheDocument();
    });

    it('renders Home for home view', async () => {
        render(<ShelterRouter {...defaultProps} currentView="home" />);
        expect(await screen.findByTestId('home')).toBeInTheDocument();
    });
});
