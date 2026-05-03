import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Skeleton, CardSkeleton, MapSidebarSkeleton } from './SkeletonLoader';

describe('SkeletonLoader Components', () => {
  it('Skeleton renders with custom class', () => {
    const { container } = render(<Skeleton className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('CardSkeleton renders correctly', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toHaveClass('glass-card-enhanced');
  });

  it('MapSidebarSkeleton renders 4 items', () => {
    const { container } = render(<MapSidebarSkeleton />);
    expect(container.children[0].children.length).toBe(4);
  });
});
