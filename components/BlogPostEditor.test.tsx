
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlogPostEditor } from './BlogPostEditor';
import { User, BlogPost } from '../types';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock dependencies
vi.mock('../services/firebase', () => ({
  dbService: {
    saveBlogPost: vi.fn(),
  },
}));

vi.mock('../services/geminiService', () => ({
  generateBlogPost: vi.fn(),
}));

const mockUser: User = {
  uid: 'admin-123',
  email: 'admin@example.com',
  roles: ['super_admin'],
  activeRole: 'super_admin',
  friends: [],
  friendRequests: [],
  points: 0,
  badges: [],
};

const mockPost: BlogPost = {
  id: 'post-1',
  title: 'Test Post',
  slug: 'test-post',
  summary: 'Test Summary',
  content: 'Test Content',
  author: 'admin@example.com',
  imageUrl: 'https://example.com/image.jpg',
  tags: ['test', 'unit'],
  publishedAt: 1234567890,
  seoTitle: 'Test Post',
  seoDescription: 'Test Summary',
  views: 10,
};

const renderComponent = (props: any) => {
  return render(
    <LanguageProvider>
      <SnackbarProvider>
        <BlogPostEditor {...props} />
      </SnackbarProvider>
    </LanguageProvider>
  );
};

describe('BlogPostEditor', () => {
  const onSave = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in create mode', () => {
    renderComponent({ currentUser: mockUser, onSave, onCancel });

    expect(screen.getByText('Create New Post')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Post Title')).toBeInTheDocument();
    // This assertion is expected to fail initially
    expect(screen.getByLabelText(/Cover Image URL/i)).toBeInTheDocument();
  });

  it('renders correctly in edit mode with populated data', () => {
    renderComponent({ post: mockPost, currentUser: mockUser, onSave, onCancel });

    expect(screen.getByText('Edit Post')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test, unit')).toBeInTheDocument();
    // This assertion is expected to fail initially
    expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument();
  });
});
