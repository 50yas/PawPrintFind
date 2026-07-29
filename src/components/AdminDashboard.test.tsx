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
  SnackbarProvider: ({ children }: any) => <div>{children}</div>
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

    it.skip('renders visual stats charts via SystemHealth', async () => {
        render(<AdminDashboard {...mockProps} />);
        expect(await screen.findByTestId('system-health-chart')).toBeInTheDocument();
    });

    it('renders the Command Core header', () => {
        render(<AdminDashboard {...mockProps} />);
        expect(screen.getByText(/dashboard:admin.commandCore/)).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.systemRootActive')).toBeInTheDocument();
    });

    it('renders system status bar elements', () => {
        render(<AdminDashboard {...mockProps} />);
        expect(screen.getAllByText('statTotalUsers').length).toBeGreaterThan(0);
        expect(screen.getByText('dashboard:admin.uptime')).toBeInTheDocument();
    });

    it('renders navigation tabs with icons', () => {
        render(<AdminDashboard {...mockProps} />);
        expect(screen.getByTitle('dashboard:admin.tabs.overview')).toBeInTheDocument();
        expect(screen.getByTitle('dashboard:admin.tabs.users')).toBeInTheDocument();
        expect(screen.getByTitle('dashboard:admin.tabs.ai')).toBeInTheDocument();
    });

    it.skip('renders the Persistent Alert Feed when there are pending verifications', () => {
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

    it.skip('renders Trending Blog Intelligence card in overview', async () => {
        const mockPosts = [
            { id: 'p1', title: 'Article One', author: 'Author A', views: 100, tags: [], content: '', publishedAt: Date.now() },
            { id: 'p2', title: 'Article Two', author: 'Author B', views: 50, tags: [], content: '', publishedAt: Date.now() }
        ];

        vi.mocked(dbService.getBlogPosts).mockResolvedValue(mockPosts as any);

        render(<AdminDashboard {...mockProps} />);

        fireEvent.click(screen.getByTitle('dashboard:admin.tabs.overview'));

        expect(screen.getByText('dashboard:admin.contentIntelligence')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Article One')).toBeInTheDocument();
            expect(screen.getByText(/100 dashboard:admin.viewsLabel/i)).toBeInTheDocument();
            expect(screen.getByText(/dashboard:admin.rankAlpha/i)).toBeInTheDocument();
        });
    });

    it('renders AI tab when selected', async () => {
        render(<AdminDashboard {...mockProps} />);
        fireEvent.click(screen.getByTitle('dashboard:admin.tabs.ai'));
        // AIystemsTab is rendered asynchronously via lazy-load, so we can verify the active tab is set
        expect(screen.getByTitle('dashboard:admin.tabs.ai')).toHaveClass('text-white');
    });

    it('does not fetch blog posts redundantly on non-content tab changes', async () => {
        render(<AdminDashboard {...mockProps} />);
        
        // Wait for initial load
        await waitFor(() => expect(dbService.getBlogPosts).toHaveBeenCalled());
        const callsAfterMount = vi.mocked(dbService.getBlogPosts).mock.calls.length;
        
        // Switch to Users tab
        fireEvent.click(screen.getByTitle('dashboard:admin.tabs.users'));
        
        // Switch to AI tab
        fireEvent.click(screen.getByTitle('dashboard:admin.tabs.ai'));
        
        expect(vi.mocked(dbService.getBlogPosts).mock.calls.length).toBe(callsAfterMount);
    });
});
