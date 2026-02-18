
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
        
        expect(screen.getByText('Core Intelligence')).toBeInTheDocument();
        expect(screen.getByText('Safety Grid')).toBeInTheDocument();
        expect(screen.getByText('External Intel')).toBeInTheDocument();
    });

    it('renders key module nodes', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        expect(screen.getByText('AI Vision')).toBeInTheDocument();
        expect(screen.getByText('Smart Geofencing')).toBeInTheDocument();
        expect(screen.getByText('Social Scraper')).toBeInTheDocument();
    });

    it('navigates to the correct view when a node is clicked', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        const smartSearchNode = screen.getByText('Smart Search').closest('div[role="button"]') || screen.getByText('Smart Search').parentElement;
        if (smartSearchNode) fireEvent.click(smartSearchNode);
        
        expect(onNavigate).toHaveBeenCalledWith('adoptionCenter');
    });

    it('can navigate back to base', () => {
        const onNavigate = vi.fn();
        render(<EcosystemHub onNavigate={onNavigate} />);
        
        fireEvent.click(screen.getByText('← Back to Base'));
        expect(onNavigate).toHaveBeenCalledWith('home');
    });
});
