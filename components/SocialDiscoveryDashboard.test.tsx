import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SocialDiscoveryDashboard } from './SocialDiscoveryDashboard';
import { scraperService, ScrapedSighting, ScraperJob } from '../services/scraperService';
import React from 'react';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

vi.mock('../services/scraperService', () => ({
    scraperService: {
        getScrapedSightings: vi.fn(),
        getJobs: vi.fn(),
        launchDiscovery: vi.fn(),
        updateStatus: vi.fn(),
    },
}));

vi.mock('./ui', () => ({
    GlassCard: ({children, className}: any) => <div className={className}>{children}</div>,
    GlassButton: ({children, onClick, disabled}: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    CinematicImage: ({src, alt, className}: any) => <img src={src} alt={alt} className={className} />,
}));

vi.mock('./LoadingSpinner', () => ({ LoadingSpinner: () => <div>Loading...</div> }));

describe('SocialDiscoveryDashboard', () => {
    const mockSightings: ScrapedSighting[] = [
        {
            id: 's1',
            source: 'Facebook',
            sourceUrl: 'http://fb.com/post',
            description: 'Lost Golden Retriever near Central Park',
            location: 'New York',
            timestamp: Date.now(),
            status: 'pending',
            species: 'Dog'
        }
    ];

    const mockJobs: ScraperJob[] = [
        {
            id: 'j1',
            query: 'Lost Dog NY',
            status: 'completed',
            resultsCount: 5,
            timestamp: Date.now(),
            type: 'social_discovery'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(scraperService.getScrapedSightings).mockResolvedValue(mockSightings);
        vi.mocked(scraperService.getJobs).mockResolvedValue(mockJobs);
    });

    it('renders search input and launch button', async () => {
        render(<SocialDiscoveryDashboard />);
        expect(screen.getByPlaceholderText(/searchSocialPlaceholder/i)).toBeInTheDocument();
        expect(screen.getByText(/launchAgentButton/i)).toBeInTheDocument();
    });

    it('renders list of scraped sightings', async () => {
        render(<SocialDiscoveryDashboard />);
        await waitFor(() => {
            expect(screen.getByText('Lost Golden Retriever near Central Park')).toBeInTheDocument();
            expect(screen.getByText('Facebook')).toBeInTheDocument();
        });
    });

    it('calls launchDiscovery when launch button is clicked', async () => {
        render(<SocialDiscoveryDashboard />);
        const input = screen.getByPlaceholderText(/searchSocialPlaceholder/i);
        const button = screen.getByText(/launchAgentButton/i);

        fireEvent.change(input, { target: { value: 'Lost Cat' } });
        fireEvent.click(button);

        expect(scraperService.launchDiscovery).toHaveBeenCalledWith('Lost Cat');
    });

    it('calls updateStatus when import button is clicked', async () => {
        render(<SocialDiscoveryDashboard />);
        await waitFor(() => {
            const importBtn = screen.getByText(/importSighting/i);
            fireEvent.click(importBtn);
            expect(scraperService.updateStatus).toHaveBeenCalledWith('s1', 'imported');
        });
    });
});
