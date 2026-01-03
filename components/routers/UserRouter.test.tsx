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
        allUsers: [],
        editingPet: null,
        setEditingPet: vi.fn(),
        petToLink: null,
        setPetToLink: vi.fn(),
        handleRegisterPet: vi.fn().mockResolvedValue(undefined),
        handleStartChat: vi.fn().mockResolvedValue(undefined),
        handleLogout: vi.fn(),
        setIsLoginModalOpen: vi.fn(),
        setHealthCheckingPet: vi.fn()
    };

    it('renders Dashboard for dashboard view', () => {
        render(<UserRouter {...defaultProps} />);
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('renders RegisterPet for register view', () => {
        render(<UserRouter {...defaultProps} currentView="register" />);
        expect(screen.getByTestId('register-pet')).toBeInTheDocument();
    });

    it('renders FoundPet for find view', () => {
        render(<UserRouter {...defaultProps} currentView="find" />);
        expect(screen.getByTestId('found-pet')).toBeInTheDocument();
    });

    it('renders FindVet for findVet view', () => {
        render(<UserRouter {...defaultProps} currentView="findVet" />);
        expect(screen.getByTestId('find-vet')).toBeInTheDocument();
    });

    it('renders Community for community view', () => {
        render(<UserRouter {...defaultProps} currentView="community" />);
        expect(screen.getByTestId('community')).toBeInTheDocument();
    });

    it('renders Home for home view', () => {
        render(<UserRouter {...defaultProps} currentView="home" />);
        expect(screen.getByTestId('home')).toBeInTheDocument();
    });
});
