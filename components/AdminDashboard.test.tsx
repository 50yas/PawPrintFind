import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from './AdminDashboard';
import { User, PetProfile, VetClinic, Donation } from '../types';
import React from 'react';
import { dbService } from '../services/firebase';

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

const mockAddSnackbar = vi.fn();
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: mockAddSnackbar,
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
            currentUser: { uid: 'admin1', email: 'admin@example.com' }
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

const mockPendingUser: User = {
    uid: 'pending1',
    email: 'vet@example.com',
    roles: ['vet'],
    isVerified: false,
    verificationData: {
        docUrl: 'http://docs.com',
        timestamp: Date.now()
    },
    createdAt: new Date(),
    friends: []
};

const mockPets: PetProfile[] = [];
const mockClinics: VetClinic[] = [];
const mockDonations: Donation[] = [];

describe('AdminDashboard Cyber HUD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.confirm
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    });

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

   it('handles user approval', async () => {
        const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
        render(
            <AdminDashboard 
                users={[mockUser, mockPendingUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={mockOnRefresh}
            />
        );

        // Navigate to verification tab
        fireEvent.click(screen.getByText('pendingVerificationsTitle'));

        // Click Approve
        const approveBtn = screen.getByText('APPROVE');
        fireEvent.click(approveBtn);

        await waitFor(() => {
            expect(dbService.saveUser).toHaveBeenCalledWith(expect.objectContaining({
                uid: 'pending1',
                isVerified: true
            }));
            expect(dbService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'VERIFY_USER'
            }));
            expect(mockOnRefresh).toHaveBeenCalled();
        });
   });

   it('handles user rejection', async () => {
        const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
        render(
            <AdminDashboard 
                users={[mockUser, mockPendingUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={mockOnRefresh}
            />
        );

        // Navigate to verification tab
        fireEvent.click(screen.getByText('pendingVerificationsTitle'));

        // Click Reject
        const rejectBtn = screen.getByText('REJECT');
        fireEvent.click(rejectBtn);

        await waitFor(() => {
            expect(dbService.saveUser).toHaveBeenCalledWith(expect.objectContaining({
                uid: 'pending1',
                isVerified: false
            }));
            // Verification data should be removed (mock dbService.saveUser called without it)
            const saveCall = vi.mocked(dbService.saveUser).mock.calls[0][0];
            expect(saveCall).not.toHaveProperty('verificationData');

            expect(dbService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'REJECT_VERIFICATION'
            }));
            expect(mockOnRefresh).toHaveBeenCalled();
        });
   });
});

