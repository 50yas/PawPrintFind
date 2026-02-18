
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrioritySupportModal } from './PrioritySupportModal';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Modal
vi.mock('./Modal', () => ({
    Modal: ({ children, isOpen, onClose, title }: any) => isOpen ? (
        <div data-testid="support-modal">
            <h1>{title}</h1>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ) : null
}));

describe('PrioritySupportModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userEmail: 'vet@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<PrioritySupportModal {...defaultProps} />);
    expect(screen.getByText('prioritySupportTitle')).toBeInTheDocument();
    expect(screen.getByText('prioritySupportDesc')).toBeInTheDocument();
  });

  it('shows live chat and email options', () => {
    render(<PrioritySupportModal {...defaultProps} />);
    expect(screen.getByText('startLiveChatButton')).toBeInTheDocument();
    expect(screen.getByText('sendEmailButton')).toBeInTheDocument();
  });

  it('simulates starting a live chat', () => {
    render(<PrioritySupportModal {...defaultProps} />);
    const chatBtn = screen.getByText('startLiveChatButton');
    fireEvent.click(chatBtn);
    expect(screen.getByText('chatConnecting')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<PrioritySupportModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('prioritySupportTitle')).not.toBeInTheDocument();
  });
});
