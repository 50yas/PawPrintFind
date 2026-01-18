import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BadgeDisplay } from './BadgeDisplay';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('BadgeDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing if no badges are provided', () => {
    const { container } = render(<BadgeDisplay badges={[]} isVerified={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders verified vet badge if isVerified is true', () => {
    render(<BadgeDisplay badges={[]} isVerified={true} />);
    expect(screen.getByText('verifiedVetBadge')).toBeInTheDocument();
  });

  it('renders standard badges', () => {
    const badges = ['Top Contributor', 'Sighting Scout'];
    render(<BadgeDisplay badges={badges} isVerified={false} />);
    expect(screen.getByText('Top Contributor')).toBeInTheDocument();
    expect(screen.getByText('Sighting Scout')).toBeInTheDocument();
  });

  it('renders both verified badge and standard badges', () => {
    const badges = ['Sighting Scout'];
    render(<BadgeDisplay badges={badges} isVerified={true} />);
    expect(screen.getByText('verifiedVetBadge')).toBeInTheDocument();
    expect(screen.getByText('Sighting Scout')).toBeInTheDocument();
  });
});