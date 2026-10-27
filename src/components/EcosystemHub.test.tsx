
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EcosystemHub } from './EcosystemHub';
import React from 'react';

// Mock dependencies
const translationsMap: Record<string, string> = {
  'ecosystemHub.sections.intelligence': 'Core Intelligence',
  'ecosystemHub.sections.safety': 'Safety Grid',
  'ecosystemHub.sections.external': 'External Intel',
  'ecosystemHub.nodes.aiVision.title': 'AI Vision',
  'ecosystemHub.nodes.aiVision.desc': 'Multi-modal breed identification',
  'ecosystemHub.nodes.triage.title': 'Health Triage',
  'ecosystemHub.nodes.triage.desc': 'Proactive AI assessments',
  'ecosystemHub.nodes.smartSearch.title': 'Smart Search',
  'ecosystemHub.nodes.smartSearch.desc': 'Natural language queries',
  'ecosystemHub.nodes.geofencing.title': 'Smart Geofencing',
  'ecosystemHub.nodes.geofencing.desc': 'Safe-zone monitoring',
  'ecosystemHub.nodes.alerts.title': 'Global Alerts',
  'ecosystemHub.nodes.alerts.desc': 'Instant broadcasts',
  'ecosystemHub.nodes.map.title': 'Sightings Map',
  'ecosystemHub.nodes.map.desc': 'Real-time tracking',
  'ecosystemHub.nodes.scraper.title': 'Social Scraper',
  'ecosystemHub.nodes.scraper.desc': 'Autonomous AI agents',
  'ecosystemHub.nodes.vets.title': 'Vet Network',
  'ecosystemHub.nodes.vets.desc': 'Professional verification',
  'ecosystemHub.nodes.community.title': 'Community Hub',
  'ecosystemHub.nodes.community.desc': 'Decentralized support',
  'ecosystemHub.backToBase': '← Back to Base',
  'ecosystemHub.title': 'System Ecosystem',
  'ecosystemHub.description': 'A centralized overview',
};

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => translationsMap[key] || key,
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
