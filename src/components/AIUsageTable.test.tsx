import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIUsageTable } from './AIUsageTable';
import { adminService } from '../services/adminService';
import React from 'react';
import { SnackbarProvider } from '../contexts/SnackbarContext';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../services/adminService', () => ({
    adminService: {
        getUsers: vi.fn().mockResolvedValue([]),
        getUserUsageStats: vi.fn().mockResolvedValue([]),
        resetUserUsageStats: vi.fn().mockResolvedValue(undefined),
    }
}));

vi.mock('./ui', () => ({
    GlassCard: ({children, className}: any) => <div className={className} data-testid="glass-card">{children}</div>,
    GlassButton: ({children, onClick, className}: any) => <button className={className} onClick={onClick}>{children}</button>,
}));

vi.mock('./LoadingSpinner', () => ({ LoadingSpinner: () => <div>Loading...</div> }));

const mockUsers = [
    { uid: 'u1', email: 'user1@test.com' },
    { uid: 'u2', email: 'user2@test.com' }
];

const mockStats = [
    { id: '2026-02-01', visionIdentification: 2, smartSearch: 5, healthAssessment: 1, blogGeneration: 0, totalAIRequests: 8 }
];

describe('AIUsageTable Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
        vi.mocked(adminService.getUsers).mockResolvedValue(mockUsers as any);
        vi.mocked(adminService.getUserUsageStats).mockResolvedValue(mockStats as any);
    });

    const renderComponent = () => render(
        <SnackbarProvider>
            <AIUsageTable />
        </SnackbarProvider>
    );

    it('renders user list initially', async () => {
        renderComponent();
        expect(await screen.findByText('user1@test.com')).toBeInTheDocument();
        expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    });

    it('shows telemetry detail when a user is selected', async () => {
        renderComponent();
        const userBtn = await screen.findByText('user1@test.com');
        fireEvent.click(userBtn);

        expect(await screen.findByText('dashboard:admin.aiUsageTelemetry')).toBeInTheDocument();
        expect(screen.getByText('2026-02-01')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument(); // total
    });

    it('handles quota reset', async () => {
        renderComponent();
        fireEvent.click(await screen.findByText('user1@test.com'));
        
        const resetBtn = await screen.findByText('dashboard:admin.resetQuota');
        fireEvent.click(resetBtn);

        await waitFor(() => {
            expect(adminService.resetUserUsageStats).toHaveBeenCalledWith('u1');
        });
    });
});
