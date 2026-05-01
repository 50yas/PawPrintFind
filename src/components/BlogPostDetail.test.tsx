
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
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    summary: 'This is a summary',
    content: '<p>This is the content</p>',
    author: 'Dr. Smith',
    publishedAt: Date.now(),
    tags: ['health', 'dogs'],
    imageUrl: 'https://example.com/image.jpg',
    views: 100,
    seoTitle: 'Test Blog Post - SEO',
    seoDescription: 'SEO Description'
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders post details correctly', () => {
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);

    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    expect(screen.getByText('This is a summary')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('1') && element.tagName.toLowerCase() === 'span')).toBeInTheDocument();
    expect(screen.getByText(/MIN READ/i)).toBeInTheDocument();
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
