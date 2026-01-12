import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { OfflineBanner } from './OfflineBanner';

vi.mock('../hooks/useTranslations', () => ({
    useTranslations: () => ({ t: (k: string) => k })
}));

describe('OfflineBanner', () => {
    beforeEach(() => {
        // Mock navigator.onLine
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: true,
        });
    });

    it('is hidden by default when online', () => {
        render(<OfflineBanner />);
        expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    });

    it('shows banner when window goes offline', () => {
        render(<OfflineBanner />);
        
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
    });

    it('hides banner when window goes back online', () => {
        render(<OfflineBanner />);
        
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        
        // It might take a moment to disappear (animation), but for now assuming immediate or text gone
        // Use waitFor if needed
        expect(screen.queryByText(/You are currently offline/i)).not.toBeInTheDocument();
    });
});
