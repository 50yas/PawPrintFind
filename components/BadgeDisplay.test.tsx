import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BadgeDisplay } from './BadgeDisplay';

describe('BadgeDisplay', () => {
    it('renders list of badges', () => {
        const badges = ['Sightings Scout', 'Reunion Ranger'];
        render(<BadgeDisplay badges={badges} />);
        
        expect(screen.getByText('Sightings Scout')).toBeInTheDocument();
        expect(screen.getByText('Reunion Ranger')).toBeInTheDocument();
    });

    it('renders empty state message', () => {
        render(<BadgeDisplay badges={[]} />);
        expect(screen.getByText(/No badges yet/i)).toBeInTheDocument();
    });
});
