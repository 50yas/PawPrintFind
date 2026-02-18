
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { AIInsightCard } from './AIInsightCard';
import { AIInsight } from '../types';

describe('AIInsightCard Component', () => {
  const mockInsight: AIInsight = {
    id: '1',
    title: 'Joint Health',
    content: 'Buddy needs joint supplements.',
    type: 'health',
    timestamp: Date.now()
  };

  it('should render the insight title and content', () => {
    render(<AIInsightCard insight={mockInsight} />);
    expect(screen.getByText('Joint Health')).toBeInTheDocument();
    expect(screen.getByText('Buddy needs joint supplements.')).toBeInTheDocument();
  });

  it('should render the correct icon for health type', () => {
    const { container } = render(<AIInsightCard insight={mockInsight} />);
    // Check for a specific icon or class representing health
    const icon = container.querySelector('.text-red-500'); // Assuming health is red
    expect(icon).toBeInTheDocument();
  });
});
