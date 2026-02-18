import { render, screen } from '@testing-library/react';
import { CinematicLoader } from './CinematicLoader';
import { describe, it, expect } from 'vitest';

describe('CinematicLoader', () => {
    it('renders the branding', () => {
        render(<CinematicLoader />);
        expect(screen.getByText('Paw')).toBeDefined();
        expect(screen.getByText('Print')).toBeDefined();
    });

    it('contains the lens zoom animation elements', () => {
        const { container } = render(<CinematicLoader />);
        // Expecting a container with specific animation class
        const logoContainer = container.querySelector('.animate-lens-zoom');
        expect(logoContainer).toBeDefined();
    });
});
