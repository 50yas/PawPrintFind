
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VetRouter } from './VetRouter';
import React from 'react';

// Mock child components
vi.mock('../VetDashboard', () => ({ VetDashboard: () => <div data-testid="vet-dashboard">VetDashboard</div> }));
vi.mock('../MyClinic', () => ({ MyClinic: () => <div data-testid="my-clinic">MyClinic</div> }));
vi.mock('../MyPatients', () => ({ MyPatients: () => <div data-testid="my-patients">MyPatients</div> }));
vi.mock('../PatientDetail', () => ({ PatientDetail: () => <div data-testid="patient-detail">PatientDetail</div> }));
vi.mock('../SmartCalendar', () => ({ SmartCalendar: () => <div data-testid="smart-calendar">SmartCalendar</div> }));
vi.mock('../Home', () => ({ Home: () => <div data-testid="home">Home</div> }));
vi.mock('../AdoptionCenter', () => ({ AdoptionCenter: () => <div data-testid="adoption-center">AdoptionCenter</div> }));

describe('VetRouter', () => {
    const defaultProps = {
        currentView: 'vetDashboard' as any,
        setView: vi.fn(),
        currentUser: { uid: '1', email: 'test@test.com', activeRole: 'vet' } as any,
        allPets: [],
        lostPets: [],
        petsForAdoption: [],
        vetClinics: [],
        donations: [],
        appointments: [],
        viewingPatient: null,
        setViewingPatient: vi.fn(),
        selectedPost: null,
        setSelectedPost: vi.fn(),
        handleStartChat: vi.fn().mockResolvedValue(undefined),
        setIsLoginModalOpen: vi.fn(),
        isLoading: false
    };

    it('renders VetDashboard for default view', () => {
        render(<VetRouter {...defaultProps} />);
        expect(screen.getByTestId('vet-dashboard')).toBeInTheDocument();
    });

    it('renders MyClinic for myClinic view', () => {
        render(<VetRouter {...defaultProps} currentView="myClinic" />);
        expect(screen.getByTestId('my-clinic')).toBeInTheDocument();
    });

    it('renders MyPatients for myPatients view', () => {
        render(<VetRouter {...defaultProps} currentView="myPatients" />);
        expect(screen.getByTestId('my-patients')).toBeInTheDocument();
    });

    it('renders SmartCalendar for smartCalendar view', () => {
        render(<VetRouter {...defaultProps} currentView="smartCalendar" />);
        expect(screen.getByTestId('smart-calendar')).toBeInTheDocument();
    });

    it('renders AdoptionCenter for adoptionCenter view', () => {
        render(<VetRouter {...defaultProps} currentView="adoptionCenter" />);
        expect(screen.getByTestId('adoption-center')).toBeInTheDocument();
    });

    it('renders Home for home view', () => {
        render(<VetRouter {...defaultProps} currentView="home" />);
        expect(screen.getByTestId('home')).toBeInTheDocument();
    });
});
