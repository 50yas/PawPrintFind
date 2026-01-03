
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CinematicImage } from './CinematicImage';

describe('CinematicImage Optimization', () => {
  it('should have loading="lazy" and decoding="async" by default', () => {
    render(<CinematicImage src="test.jpg" alt="test" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('should have loading="eager" and priority behavior when priority prop is true', () => {
    // We'll need to add the priority prop to CinematicImage first
    render(<CinematicImage src="test.jpg" alt="test" priority={true} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    // decoding="async" is still fine even for priority images usually, 
    // but some prefer 'sync' for LCP images. Let's see.
  });
});
