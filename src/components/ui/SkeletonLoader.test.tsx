
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Skeleton, CardSkeleton, MapSidebarSkeleton } from './SkeletonLoader';

describe('SkeletonLoader Components', () => {
  it('Skeleton renders with custom class', () => {
    const { container } = render(<Skeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
    // We check if it has the relative overflow-hidden which are base styles
    expect(container.firstChild).toHaveClass('relative');
  });

  it('CardSkeleton renders correctly', () => {
    const { container } = render(<CardSkeleton />);
    // Component uses glass-card-enhanced
    expect(container.firstChild).toHaveClass('glass-card-enhanced');
    // Check for internal skeletons (they use bg-white/5 etc)
    expect(container.querySelectorAll('.bg-white\\/5').length).toBeGreaterThan(0);
  });

  it('MapSidebarSkeleton renders 4 items', () => {
    const { container } = render(<MapSidebarSkeleton />);
    expect(container.children[0].children.length).toBe(4);
  });
});
