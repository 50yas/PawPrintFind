
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Blog } from './Blog';
import { dbService } from '../services/firebase';

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
    getBlogPosts: vi.fn(),
  },
}));

vi.mock('./ui/CinematicImage', () => ({
  CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('Blog Component Localization', () => {
  const mockSetView = vi.fn();
  const mockOnSelectPost = vi.fn();

  const mockPosts = [
    {
      id: '1',
      title: 'Original Title',
      summary: 'Original Summary',
      content: 'Original Content',
      tags: ['tag1'],
      publishedAt: Date.now(),
      views: 10,
      author: 'Author One',
      translations: {
        es: {
          title: 'Título Traducido',
          summary: 'Resumen Traducido',
          content: 'Contenido Traducido'
        }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (dbService.getBlogPosts as any).mockResolvedValue(mockPosts);
  });

  it('displays original content when locale is en', async () => {
    mockTranslations.locale = 'en';
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument();
      expect(screen.getByText('Original Summary')).toBeInTheDocument();
    });
  });

  it('displays translated content when locale matches translation', async () => {
    mockTranslations.locale = 'es';
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    await waitFor(() => {
      expect(screen.getByText('Título Traducido')).toBeInTheDocument();
      expect(screen.getByText('Resumen Traducido')).toBeInTheDocument();
    });
  });

  it('falls back to original content when translation is missing for locale', async () => {
    mockTranslations.locale = 'fr'; // No french translation in mock
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument();
      expect(screen.getByText('Original Summary')).toBeInTheDocument();
    });
  });
});
