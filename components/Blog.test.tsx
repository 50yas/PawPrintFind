import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Blog } from './Blog';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock dbService
vi.mock('../services/firebase', () => {
  const mockPosts = [
    { id: '1', title: 'Post One', summary: 'Summary One', tags: ['tag1'], publishedAt: Date.now(), views: 10, author: 'Author One' },
    { id: '2', title: 'Post Two', summary: 'Summary Two', tags: ['tag2'], publishedAt: Date.now(), views: 20, author: 'Author Two' },
  ];
  return {
    dbService: {
      getBlogPosts: vi.fn().mockResolvedValue(mockPosts),
    },
  };
});

// Mock CinematicImage
vi.mock('./ui/CinematicImage', () => ({
  CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="cinematic-image" />,
}));

describe('Blog Component', () => {
  const mockSetView = vi.fn();
  const mockOnSelectPost = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    expect(screen.queryByText('Post One')).not.toBeInTheDocument();
  });

  it('renders blog posts after loading', async () => {
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    await waitFor(() => {
      expect(screen.getByText('Post One')).toBeInTheDocument();
      expect(screen.getByText('Post Two')).toBeInTheDocument();
    });
  });

  it('filters posts based on search query', async () => {
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    await waitFor(() => expect(screen.getByText('Post One')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search articles...');
    fireEvent.change(searchInput, { target: { value: 'One' } });

    expect(screen.getByText('Post One')).toBeInTheDocument();
    expect(screen.queryByText('Post Two')).not.toBeInTheDocument();
  });

  it('calls onSelectPost when a post is clicked', async () => {
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    await waitFor(() => expect(screen.getByText('Post One')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Post One'));
    expect(mockOnSelectPost).toHaveBeenCalled();
  });

  it('calls setView("home") when back button is clicked', async () => {
    render(<Blog setView={mockSetView} onSelectPost={mockOnSelectPost} />);
    
    const backBtn = screen.getByText(/homeButton/i);
    fireEvent.click(backBtn);
    expect(mockSetView).toHaveBeenCalledWith('home');
  });
});