import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteButton } from './FavoriteButton';
import { dbService } from '../services/firebase';

vi.mock('../services/firebase', () => ({
  dbService: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    checkIsFavorite: vi.fn().mockResolvedValue(false),
  },
  auth: {
    currentUser: { uid: 'user123' }
  }
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('FavoriteButton', () => {
  it('should toggle favorite status on click', async () => {
    render(<FavoriteButton petId="pet123" />);
    
    const button = await screen.findByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
        expect(dbService.addFavorite).toHaveBeenCalledWith('user123', 'pet123');
    });

    // Mock it as favorite now
    vi.mocked(dbService.checkIsFavorite).mockResolvedValueOnce(true);
    
    fireEvent.click(button);
     await waitFor(() => {
        expect(dbService.removeFavorite).toHaveBeenCalledWith('user123', 'pet123');
    });
  });
});
