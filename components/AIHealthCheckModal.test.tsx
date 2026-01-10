
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIHealthCheckModal } from './AIHealthCheckModal';
import React from 'react';

// Mocks
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string, params: any) => key }),
}));
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({ addSnackbar: vi.fn() }),
}));
vi.mock('../services/geminiService', () => ({
  performAIHealthCheck: vi.fn().mockResolvedValue('Analysis result'),
}));
vi.mock('./Modal', () => ({
  Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));

describe('AIHealthCheckModal', () => {
  const mockPet: any = { id: 'p1', name: 'Buddy' };
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();
  const mockOnBookAppointment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial form', () => {
    render(<AIHealthCheckModal pet={mockPet} onClose={mockOnClose} onComplete={mockOnComplete} onBookAppointment={mockOnBookAppointment} />);
    expect(screen.getByText('aiHealthCheckDesc')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('symptomsPlaceholder')).toBeInTheDocument();
  });

  it('submits symptoms and shows analysis', async () => {
    const { performAIHealthCheck } = await import('../services/geminiService');
    render(<AIHealthCheckModal pet={mockPet} onClose={mockOnClose} onComplete={mockOnComplete} onBookAppointment={mockOnBookAppointment} />);
    
    fireEvent.change(screen.getByPlaceholderText('symptomsPlaceholder'), { target: { value: 'coughing' } });
    fireEvent.click(screen.getByText('analyzeSymptomsButton'));

    await waitFor(() => {
      expect(performAIHealthCheck).toHaveBeenCalledWith(mockPet, 'coughing');
      expect(screen.getByText('Analysis result')).toBeInTheDocument();
    });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('calls onBookAppointment when button is clicked', async () => {
    render(<AIHealthCheckModal pet={mockPet} onClose={mockOnClose} onComplete={mockOnComplete} onBookAppointment={mockOnBookAppointment} />);
    
    // Simulate getting an analysis first
    fireEvent.change(screen.getByPlaceholderText('symptomsPlaceholder'), { target: { value: 'coughing' } });
    fireEvent.click(screen.getByText('analyzeSymptomsButton'));
    await screen.findByText('Analysis result');

    fireEvent.click(screen.getByText('bookAppointmentButton'));
    expect(mockOnBookAppointment).toHaveBeenCalledWith(mockPet);
  });
});
