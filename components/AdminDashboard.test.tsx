import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from './AdminDashboard';
import { User, PetProfile, VetClinic, Donation } from '../types';
import React from 'react';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, params?: any) => {
        return key;
    },
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

vi.mock('../services/donationService', () => ({
    calculateTotalFromList: vi.fn().mockReturnValue(1000),
}));

vi.mock('../services/loggerService', () => ({
    logger: {
        subscribe: vi.fn().mockReturnValue(() => {}),
        clearLogs: vi.fn(),
    },
}));

vi.mock('../services/firebase', () => ({
    dbService: {
        logAdminAction: vi.fn(),
        getBlogPosts: vi.fn().mockResolvedValue([]),
        saveUser: vi.fn(),
        deletePet: vi.fn(),
        deleteBlogPost: vi.fn(),
        auth: {
            currentUser: { uid: 'admin1' }
        }
    },
}));

vi.mock('./ui', () => ({
    GlassCard: ({children, className}: any) => <div className={`glass-card ${className}`} data-testid="glass-card">{children}</div>,
    GlassButton: ({children, className, onClick}: any) => <button className={`glass-button ${className}`} onClick={onClick}>{children}</button>,
}));

vi.mock('./LoadingSpinner', () => ({ LoadingSpinner: () => <div>Loading...</div> }));
vi.mock('./BlogPostEditor', () => ({ BlogPostEditor: () => <div>BlogPostEditor</div> }));
vi.mock('./AddPatientModal', () => ({ AddPatientModal: () => <div>AddPatientModal</div> }));
vi.mock('./AddClinicModal', () => ({ AddClinicModal: () => <div>AddClinicModal</div> }));
vi.mock('../src/utils/adminUtils', () => ({
    calculateGrowth: vi.fn().mockReturnValue({ total: 10, newLastWeek: 2, velocity: 0.3 }),
}));

const mockUser: User = {
    uid: 'admin1',
    email: 'admin@example.com',
    roles: ['super_admin'],
    isVerified: true,
    createdAt: new Date(),
    friends: []
};

const mockPets: PetProfile[] = [];
const mockClinics: VetClinic[] = [];
const mockDonations: Donation[] = [];

describe('AdminDashboard Cyber HUD', () => {
    it('renders the Command Core header', () => {
        render(
            <AdminDashboard 
                users={[mockUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={vi.fn()}
            />
        );
        
        expect(screen.getByText('COMMAND_')).toBeInTheDocument();
        expect(screen.getByText('CORE')).toBeInTheDocument();
        expect(screen.getByText('SYSTEM_ROOT_ACTIVE')).toBeInTheDocument();
    });

    it('renders Cyber HUD background effects', () => {
        const { container } = render(
            <AdminDashboard 
                users={[mockUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={vi.fn()}
            />
        );
        
        // Check for the scanline animation class defined in the component's style or structure
        // The component uses a div with class 'animate-scanline'
        // We might need to look for it by class directly if it's not generic text
        const scanline = container.querySelector('.animate-scanline');
        expect(scanline).toBeInTheDocument();
    });

    it('renders system status bar elements', () => {
         render(
            <AdminDashboard 
                users={[mockUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={vi.fn()}
            />
        );

        expect(screen.getByText('Nodes_Online')).toBeInTheDocument();
        expect(screen.getByText('Uptime')).toBeInTheDocument();
        expect(screen.getByText('Load_Factor')).toBeInTheDocument();
    });

    it('renders navigation tabs with icons', () => {
        render(
           <AdminDashboard 
               users={[mockUser]}
               currentUser={mockUser}
               allPets={mockPets}
               vetClinics={mockClinics}
               donations={mockDonations}
               onDeleteUser={vi.fn()}
               onLogout={vi.fn()}
               onRefresh={vi.fn()}
           />
       );

       expect(screen.getByText('adminTabOverview')).toBeInTheDocument();
       expect(screen.getByText('adminTabUsers')).toBeInTheDocument();
       expect(screen.getByText('adminTabPets')).toBeInTheDocument();
   });
});
