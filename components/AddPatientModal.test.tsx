
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddPatientModal } from './AddPatientModal';
import { dbService } from '../services/firebase';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { LanguageProvider } from '../contexts/LanguageContext';

vi.mock('../services/firebase', () => ({
  dbService: {
    savePet: vi.fn().mockResolvedValue(undefined),
    logAdminAction: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('AddPatientModal', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const vetEmail = 'vet@test.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <SnackbarProvider>
          <AddPatientModal onClose={onClose} onSuccess={onSuccess} vetEmail={vetEmail} />
        </SnackbarProvider>
      </LanguageProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('addPatientTitle')).toBeInTheDocument();
  });

  it('handles submission', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText('maxNamePlaceholder'), { target: { value: 'Max' } });
    fireEvent.change(screen.getByPlaceholderText('labradorPlaceholder'), { target: { value: 'Labrador' } });
    
    fireEvent.click(screen.getByText('addPatientOnlyButton'));

    await waitFor(() => {
      expect(dbService.savePet).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
