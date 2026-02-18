
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BlogPostDetail } from './BlogPostDetail';
import { BlogPost } from '../types';

// Mock dependencies
const mockTranslations = {
  t: (key: string) => key,
  locale: 'en',
};

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => mockTranslations,
}));

vi.mock('../services/firebase', () => ({
  dbService: {
    incrementBlogPostView: vi.fn(),
  },
}));

vi.mock('../src/utils/blogUtils', () => ({
  calculateReadingTime: () => 5,
}));

describe('BlogPostDetail Component Localization', () => {
  const mockOnBack = vi.fn();
  const mockPost: BlogPost = {
    id: '1',
    title: 'Original Title',
    slug: 'slug',
    summary: 'Original Summary',
    content: 'Original Content',
    author: 'Author One',
    publishedAt: Date.now(),
    tags: ['tag1'],
    seoTitle: 'SEO Title',
    seoDescription: 'SEO Desc',
    views: 10,
    translations: {
      es: {
        title: 'Título Traducido',
        summary: 'Resumen Traducido',
        content: 'Contenido Traducido'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays original content when locale is en', () => {
    mockTranslations.locale = 'en';
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);
    
    expect(screen.getByText('Original Title')).toBeInTheDocument();
    expect(screen.getByText('Original Summary')).toBeInTheDocument();
  });

  it('displays translated content when locale matches translation', () => {
    mockTranslations.locale = 'es';
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);
    
    expect(screen.getByText('Título Traducido')).toBeInTheDocument();
    expect(screen.getByText('Resumen Traducido')).toBeInTheDocument();
  });

  it('falls back to original content when translation is missing', () => {
    mockTranslations.locale = 'fr';
    render(<BlogPostDetail post={mockPost} onBack={mockOnBack} />);
    
    expect(screen.getByText('Original Title')).toBeInTheDocument();
    expect(screen.getByText('Original Summary')).toBeInTheDocument();
  });
});
