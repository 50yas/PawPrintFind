
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactForm } from './ContactForm';
import { dbService } from '../services/firebase';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';

vi.mock('../services/firebase', () => ({
  dbService: {
    saveContactMessage: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <SnackbarProvider>
          <ContactForm />
        </SnackbarProvider>
      </LanguageProvider>
    );
  };

  it('renders form fields', () => {
    renderComponent();
    expect(screen.getByLabelText('yourNameLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('yourEmailLabel')).toBeInTheDocument();
  });

  it('handles submission', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByLabelText('yourNameLabel'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('yourEmailLabel'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('yourMessageLabel'), { target: { value: 'Hello' } });
    
    fireEvent.click(screen.getByText('sendMessageButton'));

    await waitFor(() => {
      expect(dbService.saveContactMessage).toHaveBeenCalled();
      expect(screen.getByText('success.messageSent')).toBeInTheDocument();
    });
  });
});
