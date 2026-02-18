
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SmartSearchBar } from './SmartSearchBar';

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  parseSearchQuery: vi.fn().mockResolvedValue({
    species: 'dog',
    size: 'Small',
    tags: ['friendly']
  })
}));

// Mock useTranslations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('SmartSearchBar Component', () => {
  it('should render the search input and button', () => {
    render(<SmartSearchBar onSearch={() => {}} />);
    expect(screen.getByPlaceholderText(/smartSearchPlaceholder/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onSearch with filters when submitted', async () => {
    const mockOnSearch = vi.fn();
    render(<SmartSearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/smartSearchPlaceholder/i);
    fireEvent.change(input, { target: { value: 'friendly small dog' } });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        species: 'dog',
        size: 'Small',
        tags: ['friendly']
      });
    });
  });
});
