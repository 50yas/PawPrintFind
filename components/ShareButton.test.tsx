import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButton } from './ShareButton';
import { PetProfile } from '../types';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

const mockPet: PetProfile = {
  id: '123',
  name: 'Buddy',
  breed: 'Golden',
  //... minimal needed
} as any;

describe('ShareButton', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses navigator.share if available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, share: mockShare, canShare: () => true },
      writable: true,
    });

    render(<ShareButton pet={mockPet} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('Buddy'),
        url: expect.stringContaining('/pet/123') // Assuming default URL structure
    }));
  });

  it('falls back to clipboard if navigator.share is undefined', async () => {
    Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, share: undefined },
        writable: true,
    });
    
    Object.assign(navigator, {
        clipboard: {
            writeText: vi.fn().mockResolvedValue(undefined)
        }
    });

    render(<ShareButton pet={mockPet} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/pet/123'));
  });
});
