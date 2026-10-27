
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from './AdminDashboard';
import React from 'react';

// Mock dependencies
const mockAdminTranslations: Record<string, string> = {
  'admin.categoryOperations': 'Operations & Safety',
  'admin.categoryCommunity': 'Community & Karma',
  'admin.categorySystem': 'System & AI',
  'admin.commandCore': 'Command Core',
  'admin.systemRootActive': 'System Root Active',
  'admin.tabs.overview': 'Overview',
  'admin.tabs.users': 'Users',
  'admin.tabs.operations': 'Operations',
  'admin.tabs.finance': 'Finance',
  'admin.tabs.community': 'Community',
  'admin.tabs.socialMedia': 'Social Media',
  'admin.tabs.blogManager': 'Blog Manager',
  'admin.tabs.aiSystems': 'AI Systems',
  'admin.tabs.ai': 'AI Systems',
  'admin.tabs.settings': 'Settings',
  'admin.tabs.testSuite': 'Test Suite',
  'dashboard:admin.categoryOperations': 'Operations & Safety',
  'dashboard:admin.categoryCommunity': 'Community & Karma',
  'dashboard:admin.categorySystem': 'System & AI',
  'dashboard:admin.commandCore': 'Command Core',
  'dashboard:admin.systemRootActive': 'System Root Active',
  'dashboard:admin.tabs.overview': 'Overview',
  'dashboard:admin.tabs.users': 'Users',
  'dashboard:admin.tabs.operations': 'Operations',
  'dashboard:admin.tabs.finance': 'Finance',
  'dashboard:admin.tabs.community': 'Community',
  'dashboard:admin.tabs.socialMedia': 'Social Media',
  'dashboard:admin.tabs.blogManager': 'Blog Manager',
  'dashboard:admin.tabs.aiSystems': 'AI Systems',
  'dashboard:admin.tabs.ai': 'AI Systems',
  'dashboard:admin.tabs.settings': 'Settings',
  'dashboard:admin.tabs.testSuite': 'Test Suite',
};

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => mockAdminTranslations[key] || key,
    locale: 'en',
  }),
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({ addSnackbar: vi.fn() }),
  SnackbarProvider: ({ children }: any) => <div>{children}</div>
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
        subscribeToDonations: vi.fn().mockReturnValue(() => {}),
        auth: { currentUser: { uid: 'admin1', email: 'admin@test.com' } }
    },
}));

vi.mock('../services/adminService', () => ({
    adminService: {
        getSystemStats: vi.fn().mockResolvedValue({})
    }
}));

vi.mock('./ui', () => ({
    GlassCard: ({children, className}: any) => <div className={className}>{children}</div>,
    GlassButton: ({children, onClick}: any) => <button onClick={onClick}>{children}</button>,
    CinematicLoader: () => <div>Loading...</div>,
}));

describe('AdminDashboard Grouped Navigation', () => {
    const mockProps = {
        users: [],
        currentUser: { uid: '123', roles: ['super_admin'], activeRole: 'super_admin' } as any,
        allPets: [],
        vetClinics: [],
        donations: [],
        onDeleteUser: vi.fn(),
        onLogout: vi.fn(),
        onRefresh: vi.fn(),
        onViewPet: vi.fn()
    };

    it('renders tabs in the sidebar', () => {
        render(<AdminDashboard {...mockProps} />);
        
        expect(screen.getByText('Operations')).toBeInTheDocument();
        expect(screen.getByText('Community')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
    });

    it('allows tab switching', () => {
        render(<AdminDashboard {...mockProps} />);
        
        const financeBtn = screen.getByTitle('Finance');
        fireEvent.click(financeBtn);
        
        expect(screen.getByTitle('Finance')).toBeInTheDocument();
    });

    it('toggles sidebar collapse state', () => {
        render(<AdminDashboard {...mockProps} />);
        
        const toggleBtn = screen.getByTestId('sidebar-toggle');
        fireEvent.click(toggleBtn);
        
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveClass('w-20'); // Small width when collapsed
    });
});
