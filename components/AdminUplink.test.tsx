
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminUplink } from './AdminUplink';
import { dbService } from '../services/firebase';
import { LanguageProvider } from '../contexts/LanguageContext';

vi.mock('../services/firebase', () => ({
  dbService: {
    verifyAdminKey: vi.fn(),
    elevateUserRole: vi.fn(),
  },
}));

describe('AdminUplink', () => {
  const onClose = vi.fn();
  const mockUser = { uid: 'u1', email: 'test@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <AdminUplink currentUser={mockUser as any} onClose={onClose} />
      </LanguageProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('adminUplinkTitle')).toBeInTheDocument();
  });

  it('handles uplink success', async () => {
    (dbService.verifyAdminKey as any).mockResolvedValue({ valid: true, type: 'ISSUED', keyDocId: 'k1' });
    (dbService.elevateUserRole as any).mockResolvedValue(undefined);
    
    // Mock location reload
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: vi.fn() };

    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText('passwordPlaceholder'), { target: { value: 'key123' } });
    fireEvent.click(screen.getByText('initiateUplink'));

    await waitFor(() => {
      expect(dbService.verifyAdminKey).toHaveBeenCalledWith('key123');
      expect(dbService.elevateUserRole).toHaveBeenCalledWith('u1', 'ISSUED', 'k1');
      expect(window.location.reload).toHaveBeenCalled();
    });

    window.location = originalLocation;
  });
});
