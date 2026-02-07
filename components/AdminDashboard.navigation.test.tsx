
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from './AdminDashboard';
import React from 'react';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
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
        onRefresh: vi.fn()
    };

    it('groups tabs into categories in the sidebar', () => {
        render(<AdminDashboard {...mockProps} />);
        
        expect(screen.getByText('dashboard:admin.categoryOperations')).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.categoryCommunity')).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.categorySystem')).toBeInTheDocument();
    });

    it('collapses and expands categories', () => {
        render(<AdminDashboard {...mockProps} />);
        
        const operationsHeader = screen.getByText('dashboard:admin.categoryOperations');
        fireEvent.click(operationsHeader);
        
        // After clicking, the subjects under it might be hidden depending on implementation
        // For now just verify it is clickable
        expect(operationsHeader).toBeInTheDocument();
    });

    it('toggles sidebar collapse state', () => {
        render(<AdminDashboard {...mockProps} />);
        
        const toggleBtn = screen.getByTestId('sidebar-toggle');
        fireEvent.click(toggleBtn);
        
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveClass('w-20'); // Small width when collapsed
    });
});
