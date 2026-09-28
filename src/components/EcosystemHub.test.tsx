
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EcosystemHub } from './EcosystemHub';
import React from 'react';

// Mock dependencies with translation dictionary mapping
const translations: Record<string, string> = {
  'ecosystemHub.title': 'Ecosystem Hub',
  'ecosystemHub.description': 'Core network architecture',
  'ecosystemHub.backToBase': '← Back to Base',
  'ecosystemHub.accessProtocol': 'Access Protocol',
  'ecosystemHub.sections.intelligence': 'Core Intelligence',
  'ecosystemHub.sections.safety': 'Safety Grid',
  'ecosystemHub.sections.external': 'External Intel',
  'ecosystemHub.nodes.aiVision.title': 'AI Vision',
  'ecosystemHub.nodes.aiVision.desc': 'Visual recognition engine',
  'ecosystemHub.nodes.triage.title': 'Triage Protocol',
  'ecosystemHub.nodes.triage.desc': 'Health triage analysis',
  'ecosystemHub.nodes.smartSearch.title': 'Smart Search',
  'ecosystemHub.nodes.smartSearch.desc': 'Natural language search',
  'ecosystemHub.nodes.geofencing.title': 'Smart Geofencing',
  'ecosystemHub.nodes.geofencing.desc': 'Perimeter tracking',
  'ecosystemHub.nodes.alerts.title': 'Community Alerts',
  'ecosystemHub.nodes.alerts.desc': 'Realtime notifications',
  'ecosystemHub.nodes.map.title': 'Missing Pets Map',
  'ecosystemHub.nodes.map.desc': 'Interactive grid map',
  'ecosystemHub.nodes.scraper.title': 'Social Scraper',
  'ecosystemHub.nodes.scraper.desc': 'Automated social scanner',
  'ecosystemHub.nodes.vets.title': 'Vet Network',
  'ecosystemHub.nodes.vets.desc': 'Verified clinics',
  'ecosystemHub.nodes.community.title': 'Community Hub',
  'ecosystemHub.nodes.community.desc': 'Volunteer network',
};

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => translations[key] || key,
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
