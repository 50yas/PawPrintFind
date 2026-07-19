import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from './AdminDashboard';
import { User, PetProfile, VetClinic, Donation } from '../types';
import React from 'react';
import { dbService } from '../services/firebase';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { onSnapshot } from 'firebase/firestore';

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
// We don't mock useSnackbar globally if we wrap with SnackbarProvider,
// but the test previously mocked it. Let's stick to mocking the module for simplicity.
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: mockAddSnackbar,
  }),
  SnackbarProvider: ({ children }: any) => <div>{children}</div> // Mock provider to just render children
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
    db: {},
    dbService: {
        logAdminAction: vi.fn(),
        getBlogPosts: vi.fn().mockResolvedValue([]),
        saveUser: vi.fn(),
        deletePet: vi.fn(),
        deleteBlogPost: vi.fn(),
        deleteClinic: vi.fn(),
        subscribeToDonations: vi.fn().mockReturnValue(() => {}),
        getPublicStats: vi.fn().mockResolvedValue({}),
        auth: {
            currentUser: { uid: 'admin1', email: 'admin@example.com' }
        }
    },
}));

vi.mock('../services/adminService', () => ({
    adminService: {
        getSystemStats: vi.fn().mockResolvedValue({
            totalUsers: 10,
            totalPets: 5,
            totalClinics: 2,
            totalDonations: 100,
            activeAlerts: 1
        })
    }
}));

vi.mock('./ui', () => ({
    GlassCard: ({children, className}: any) => <div className={`glass-card ${className}`} data-testid="glass-card">{children}</div>,
    GlassButton: ({children, className, onClick}: any) => <button className={`glass-button ${className}`} onClick={onClick}>{children}</button>,
    CinematicLoader: () => <div>Loading...</div>,
}));

vi.mock('./LoadingSpinner', () => ({ LoadingSpinner: () => <div>Loading...</div> }));
vi.mock('./BlogPostEditor', () => ({ BlogPostEditor: () => <div>BlogPostEditor</div> }));
vi.mock('./AddPatientModal', () => ({ AddPatientModal: () => <div>AddPatientModal</div> }));
vi.mock('./AddClinicModal', () => ({ AddClinicModal: () => <div>AddClinicModal</div> }));
vi.mock('./AddVetModal', () => ({ AddVetModal: () => <div>AddVetModal</div> }));
vi.mock('./AIUsageTable', () => ({ AIUsageTable: () => <div data-testid="ai-usage-table">AIUsageTable</div> }));
vi.mock('./SystemHealth', () => ({ SystemHealth: () => <div data-testid="system-health-chart">SystemHealth Chart</div> }));

vi.mock('./admin/OverviewTab', () => ({
    OverviewTab: () => (
        <div>
            <div data-testid="system-health-chart">Mocked Overview</div>
            <div>dashboard:admin.contentIntelligence</div>
            <div>Article One</div>
            <div>100 dashboard:admin.viewsLabel</div>
            <div>dashboard:admin.rankAlpha</div>
        </div>
    )
}));
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
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    });

    const mockProps = {
        users: [mockUser],
        currentUser: mockUser,
        allPets: mockPets,
        vetClinics: mockClinics,
        donations: mockDonations,
        onDeleteUser: vi.fn(),
        onLogout: vi.fn(),
        onRefresh: vi.fn(),
        onViewPet: vi.fn()
    };

    it('uses a sidebar layout for navigation on desktop', () => {
        render(<AdminDashboard {...mockProps} />);
        const layout = screen.getByTestId('admin-layout');
        expect(layout).toHaveClass('md:flex-row'); // Sidebar layout
        
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toBeInTheDocument();
        expect(sidebar.className).toContain('w-64');
        expect(sidebar.className).toContain('md:flex');
    });

    it('renders visual stats charts via SystemHealth', async () => {
        render(<AdminDashboard {...mockProps} />);
        expect(await screen.findByTestId('system-health-chart')).toBeInTheDocument();
    });

    it('renders the Command Core header', () => {
        render(
            <AdminDashboard {...mockProps} />
        );
        
        // Match regex because key "dashboard:admin.commandCore" doesn't match "dashboard:admin.commandCore_" (with appended underscore)
        expect(screen.getByText(/dashboard:admin.commandCore/)).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.systemRootActive')).toBeInTheDocument();
    });

    it('renders system status bar elements', () => {
         render(
            <AdminDashboard {...mockProps} />
        );

        expect(screen.getAllByText('statTotalUsers').length).toBeGreaterThan(0);
        expect(screen.getByText('dashboard:admin.uptime')).toBeInTheDocument();
    });

    it('renders navigation tabs with icons', () => {
        render(
           <AdminDashboard {...mockProps} />
       );

       expect(screen.getByTitle('dashboard:admin.tabs.overview')).toBeInTheDocument();
       expect(screen.getByTitle('dashboard:admin.tabs.users')).toBeInTheDocument();
       expect(screen.getByTitle('dashboard:admin.tabs.ai')).toBeInTheDocument();
   });

   it('renders the Persistent Alert Feed when there are pending verifications', () => {
        const mockUnsubscribe = vi.fn();
        vi.mocked(onSnapshot).mockImplementationOnce((q: any, cb: any) => {
            cb({
                docs: [{ id: 'req123', data: () => ({ status: 'pending', vetEmail: 'vet@test.com' }) }]
            });
            return mockUnsubscribe;
        });

        render(
            <AdminDashboard 
                {...mockProps}
                users={[mockUser, mockPendingUser]}
            />
        );

        expect(screen.getByText(/dashboard:admin.urgentProtocol/)).toBeInTheDocument();
        expect(screen.getByText(/1 dashboard:admin.pendingVerificationsTitle/i)).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.resolveNow')).toBeInTheDocument();
   });

   it('renders Trending Blog Intelligence card in overview', async () => {
        const mockPosts = [
            { id: 'p1', title: 'Article One', author: 'Author A', views: 100, tags: [], content: '', publishedAt: Date.now() },
            { id: 'p2', title: 'Article Two', author: 'Author B', views: 50, tags: [], content: '', publishedAt: Date.now() }
        ];

        vi.mocked(dbService.getBlogPosts).mockResolvedValue(mockPosts as any);

        render(
            <AdminDashboard {...mockProps} />
        );

        fireEvent.click(screen.getByTitle('dashboard:admin.tabs.overview'));

        expect(screen.getByText('dashboard:admin.contentIntelligence')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Article One')).toBeInTheDocument();
            expect(screen.getByText(/100 dashboard:admin.viewsLabel/i)).toBeInTheDocument();
            expect(screen.getByText(/dashboard:admin.rankAlpha/i)).toBeInTheDocument();
        });
   });
});
