
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlogPostDetail } from './BlogPostDetail';
import { BlogPost } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock dbService
vi.mock('../services/firebase', () => ({
  dbService: {
    incrementBlogPostView: vi.fn(),
  },
}));

// Mock utils
vi.mock('../src/utils/blogUtils', () => ({
  calculateReadingTime: () => 5,
}));

describe('BlogPostDetail Component', () => {
  const mockPost: BlogPost = {
    id: '1',
    title: 'Test Post Title',
    summary: 'Test Summary',
    content: '<p>Test Content</p>',
    author: 'Test Author',
    publishedAt: Date.now(),
    tags: ['tag1', 'tag2'],
    imageUrl: 'test.jpg',
    views: 10
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders post details correctly', () => {
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('5 MIN READ')).toBeInTheDocument();
  });

  it('calls incrementBlogPostView on mount', async () => {
    const { dbService } = await import('../services/firebase');
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(dbService.incrementBlogPostView).toHaveBeenCalledWith(mockPost.id);
    });
  });

  it('calls onBack when back button is clicked', () => {
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);
    
    const backBtn = screen.getByText(/Back/i);
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
