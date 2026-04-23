
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EcosystemHub } from './EcosystemHub';
import React from 'react';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('EcosystemHub', () => {
    it('renders all core sections', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        expect(screen.getByText('ecosystemHub.sections.intelligence')).toBeInTheDocument();
        expect(screen.getByText('ecosystemHub.sections.safety')).toBeInTheDocument();
        expect(screen.getByText('ecosystemHub.sections.external')).toBeInTheDocument();
    });

    it('renders key module nodes', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        expect(screen.getByText('ecosystemHub.nodes.aiVision.title')).toBeInTheDocument();
        expect(screen.getByText('ecosystemHub.nodes.geofencing.title')).toBeInTheDocument();
        expect(screen.getByText('ecosystemHub.nodes.scraper.title')).toBeInTheDocument();
    });

    it('navigates to the correct view when a node is clicked', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        const smartSearchNode = screen.getByText('ecosystemHub.nodes.smartSearch.title').closest('div[role="button"]');
        if (smartSearchNode) fireEvent.click(smartSearchNode);
        
        expect(onNavigate).toHaveBeenCalledWith('adoptionCenter');
    });

    it('can navigate back to base', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        fireEvent.click(screen.getByText('ecosystemHub.backToBase'));
        expect(onNavigate).toHaveBeenCalledWith('home');
    });
});
