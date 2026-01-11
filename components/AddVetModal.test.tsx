
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddVetModal } from './AddVetModal';
import { dbService } from '../services/firebase';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { LanguageProvider } from '../contexts/LanguageContext';

vi.mock('../services/firebase', () => ({
  dbService: {
    registerUser: vi.fn().mockResolvedValue(undefined),
    logAdminAction: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('AddVetModal', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const adminEmail = 'admin@test.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <SnackbarProvider>
          <AddVetModal onClose={onClose} onSuccess={onSuccess} adminEmail={adminEmail} />
        </SnackbarProvider>
      </LanguageProvider>
    );
  };

  it('renders modal with correct title', () => {
    renderComponent();
    expect(screen.getByText('dashboard:admin.manualVetIdentity')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText('doctor@clinic.com'), { target: { value: 'vet@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByText('dashboard:admin.authorizeVet'));

    await waitFor(() => {
      expect(dbService.registerUser).toHaveBeenCalledWith('vet@test.com', 'password123', ['vet'], expect.anything());
      expect(dbService.logAdminAction).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
