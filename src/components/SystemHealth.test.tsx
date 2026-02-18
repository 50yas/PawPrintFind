
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SystemHealth } from './SystemHealth';
import { adminService } from '../services/adminService';

// Mock adminService
vi.mock('../services/adminService', () => ({
    adminService: {
        getSystemStats: vi.fn(),
    }
}));

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
    useTranslations: () => ({ t: (key: string) => key }),
}));

describe('SystemHealth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (adminService.getSystemStats as any).mockReturnValue(new Promise(() => {})); // Never resolves
        render(<SystemHealth />);
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders stats after loading', async () => {
        const mockStats = {
            totalUsers: 100,
            totalPets: 50,
            totalClinics: 5,
            totalDonations: 1000,
            activeAlerts: 2
        };
        (adminService.getSystemStats as any).mockResolvedValue(mockStats);

        render(<SystemHealth />);

        await waitFor(() => {
            const hundreds = screen.getAllByText('100');
            expect(hundreds.length).toBeGreaterThan(0);
            expect(hundreds[0]).toBeInTheDocument();
            // Match €1000 or €1,000
            expect(screen.getByText(/€1,?000/)).toBeInTheDocument(); 
        });
    });

    it('handles error state', async () => {
        (adminService.getSystemStats as any).mockRejectedValue(new Error('Failed to fetch'));
        render(<SystemHealth />);
        
        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
        });
    });
});
