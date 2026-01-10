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
        deleteClinic: vi.fn(),
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
    uid: '123',
    email: 'admin@pawprint.ai',
    roles: ['super_admin'],
    activeRole: 'super_admin',
    isVerified: true,
    createdAt: Date.now(),
    friends: [],
    friendRequests: [],
    points: 0,
    badges: []
};

const mockPendingUser: User = {
    uid: '456',
    email: 'vet@test.com',
    roles: ['vet'],
    activeRole: 'vet',
    isVerified: false,
    verificationData: {
        docUrl: 'http://example.com/doc.pdf',
        timestamp: Date.now()
    },
    createdAt: Date.now(),
    friends: [],
    friendRequests: [],
    points: 0,
    badges: []
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

        expect(screen.getAllByText('statTotalUsers').length).toBeGreaterThan(0);
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

   it('renders the Persistent Alert Feed when there are pending verifications', () => {
        render(
            <AdminDashboard 
                users={[mockUser, mockPendingUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={vi.fn()}
            />
        );

        expect(screen.getByText('Urgent_Protocol:')).toBeInTheDocument();
        expect(screen.getByText(/1 Verification Requests Pending/i)).toBeInTheDocument();
        expect(screen.getByText('Resolve_Now')).toBeInTheDocument();
   });

   it('renders Trending Blog Intelligence card in overview', async () => {
        const mockPosts = [
            { id: 'p1', title: 'Article One', author: 'Author A', views: 100, tags: [], content: '', publishedAt: Date.now() },
            { id: 'p2', title: 'Article Two', author: 'Author B', views: 50, tags: [], content: '', publishedAt: Date.now() }
        ];

        vi.mocked(dbService.getBlogPosts).mockResolvedValue(mockPosts as any);

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

        // Ensure Overview tab is clicked (though it's default)
        fireEvent.click(screen.getByText('adminTabOverview'));

        expect(screen.getByText('Content_Intelligence')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Article One')).toBeInTheDocument();
            expect(screen.getByText(/100 VIEWS/i)).toBeInTheDocument();
            // Check for Rank label
            expect(screen.getByText(/Rank: ALPHA/i)).toBeInTheDocument();
        });
   });

   it('filters users by verification status', async () => {
        const mockUsers = [
            { uid: 'u1', email: 'v1@test.com', roles: ['vet'], isVerified: true, friends: [], createdAt: new Date() },
            { uid: 'u2', email: 'v2@test.com', roles: ['vet'], isVerified: false, friends: [], createdAt: new Date() }
        ];

        render(
            <AdminDashboard 
                users={mockUsers as any}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('adminTabUsers'));

        const verifyFilter = screen.getByDisplayValue('allStatus');
        fireEvent.change(verifyFilter, { target: { value: 'verified' } });

        expect(screen.getByText('v1@test.com')).toBeInTheDocument();
        expect(screen.queryByText('v2@test.com')).not.toBeInTheDocument();
   });

   it('filters pets by status', async () => {
        const mockAllPets = [
            { id: 'p1', name: 'LostPet', status: 'lost', photos: [], breed: 'Dog', age: '1' },
            { id: 'p2', name: 'AdoptMe', status: 'forAdoption', photos: [], breed: 'Cat', age: '2' }
        ];

        render(
            <AdminDashboard 
                users={[mockUser]}
                currentUser={mockUser}
                allPets={mockAllPets as any}
                vetClinics={mockClinics}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('adminTabPets'));

        const statusFilter = screen.getByDisplayValue('allStatus');
        fireEvent.change(statusFilter, { target: { value: 'lost' } });

        expect(screen.getByText('LostPet')).toBeInTheDocument();
        expect(screen.queryByText('AdoptMe')).not.toBeInTheDocument();
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
        const approveBtn = screen.getByText('acceptButton');
        fireEvent.click(approveBtn);

        await waitFor(() => {
            expect(dbService.saveUser).toHaveBeenCalledWith(expect.objectContaining({
                uid: '456',
                isVerified: true
            }));
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
        const rejectBtn = screen.getByText('declineButton');
        fireEvent.click(rejectBtn);

        await waitFor(() => {
            expect(dbService.saveUser).toHaveBeenCalledWith(expect.objectContaining({
                uid: '456',
                isVerified: false
            }));
        });
   });

   it('handles clinic deletion', async () => {
        const mockClinics = [{ id: 'c1', name: 'Test Clinic', address: '123 St', phone: '123', vetEmail: 'v@t.com' }];
        const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
        
        vi.mocked(dbService.deleteClinic).mockResolvedValue(undefined);

        render(
            <AdminDashboard 
                users={[mockUser]}
                currentUser={mockUser}
                allPets={mockPets}
                vetClinics={mockClinics as any}
                donations={mockDonations}
                onDeleteUser={vi.fn()}
                onLogout={vi.fn()}
                onRefresh={mockOnRefresh}
            />
        );

        fireEvent.click(screen.getByText('adminTabClinics'));
        
        const deleteBtn = screen.getByText('dismantleButton');
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(dbService.deleteClinic).toHaveBeenCalledWith('c1');
            expect(mockOnRefresh).toHaveBeenCalled();
        });
   });
});

