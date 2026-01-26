import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserRouter } from './UserRouter';
import React from 'react';

// Mock child components
vi.mock('../Dashboard', () => ({ Dashboard: () => <div data-testid="dashboard">Dashboard</div> }));
vi.mock('../RegisterPet', () => ({ RegisterPet: () => <div data-testid="register-pet">RegisterPet</div> }));
vi.mock('../FoundPet', () => ({ FoundPet: () => <div data-testid="found-pet">FoundPet</div> }));
vi.mock('../FindVet', () => ({ FindVet: () => <div data-testid="find-vet">FindVet</div> }));
vi.mock('../Community', () => ({ Community: () => <div data-testid="community">Community</div> }));
vi.mock('../Home', () => ({ Home: () => <div data-testid="home">Home</div> }));
vi.mock('../AdoptionCenter', () => ({ AdoptionCenter: () => <div data-testid="adoption-center">AdoptionCenter</div> }));

describe('UserRouter', () => {
    const defaultProps = {
        currentView: 'dashboard' as any,
        setView: vi.fn(),
        currentUser: { uid: '1', email: 'test@test.com', activeRole: 'owner' } as any,
        allPets: [],
        vetClinics: [],
        appointments: [],
        chatSessions: [],
        lostPets: [],
        petsForAdoption: [],
        donations: [],
        allUsers: [],
        editingPet: null,
        setEditingPet: vi.fn(),
        petToLink: null,
        setPetToLink: vi.fn(),
        selectedPost: null,
        setSelectedPost: vi.fn(),
        handleRegisterPet: vi.fn().mockResolvedValue(undefined),
        handleStartChat: vi.fn().mockResolvedValue(undefined),
        handleLogout: vi.fn(),
        setIsLoginModalOpen: vi.fn(),
        setHealthCheckingPet: vi.fn(),
        onApplySearch: vi.fn(),
        predefinedFilters: null
    };

    it('renders Dashboard for dashboard view', async () => {
        render(<UserRouter {...defaultProps} />);
        expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
    });

    it('renders RegisterPet for register view', async () => {
        render(<UserRouter {...defaultProps} currentView="register" />);
        expect(await screen.findByTestId('register-pet')).toBeInTheDocument();
    });

    it('renders FoundPet for find view', async () => {
        render(<UserRouter {...defaultProps} currentView="find" />);
        expect(await screen.findByTestId('found-pet')).toBeInTheDocument();
    });

    it('renders FindVet for findVet view', async () => {
        render(<UserRouter {...defaultProps} currentView="findVet" />);
        expect(await screen.findByTestId('find-vet')).toBeInTheDocument();
    });

    it('renders Community for community view', async () => {
        render(<UserRouter {...defaultProps} currentView="community" />);
        expect(await screen.findByTestId('community')).toBeInTheDocument();
    });

    it('renders AdoptionCenter for adoptionCenter view', async () => {
        render(<UserRouter {...defaultProps} currentView="adoptionCenter" />);
        expect(await screen.findByTestId('adoption-center')).toBeInTheDocument();
    });

    it('renders Home for home view', async () => {
        render(<UserRouter {...defaultProps} currentView="home" />);
        expect(await screen.findByTestId('home')).toBeInTheDocument();
    });
});
