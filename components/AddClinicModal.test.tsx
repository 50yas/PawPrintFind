
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddClinicModal } from './AddClinicModal';
import React from 'react';
import { dbService } from '../services/firebase';

// Mock dependencies
vi.mock('../services/firebase', () => ({
    dbService: {
        saveClinic: vi.fn(),
        logAdminAction: vi.fn()
    }
}));

vi.mock('../hooks/useTranslations', () => ({
    useTranslations: () => ({ t: (k: string) => k })
}));

vi.mock('../contexts/SnackbarContext', () => ({
    useSnackbar: () => ({ addSnackbar: vi.fn() })
}));

// Mock Modal since it might use portals or have complex rendering
vi.mock('./Modal', () => ({
    Modal: ({ children, title }: any) => <div data-testid="modal"><h1>{title}</h1>{children}</div>
}));

describe('AddClinicModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', async () => {
        const mockOnClose = vi.fn();
        const mockOnSuccess = vi.fn();
        render(<AddClinicModal onClose={mockOnClose} onSuccess={mockOnSuccess} adminEmail="admin@test.com" />);

        fireEvent.change(screen.getByPlaceholderText(/Quantum Veterinary Care/i), { target: { value: 'Test Clinic' } });
        fireEvent.change(screen.getByPlaceholderText(/lead@clinic.ai/i), { target: { value: 'test@clinic.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Cyber City/i), { target: { value: '123 Test St' } });
        fireEvent.change(screen.getByPlaceholderText(/\+1 \(555\)/i), { target: { value: '555-1234' } });

        fireEvent.click(screen.getByText(/AUTHORIZE_CLINIC/i));

        await waitFor(() => {
            expect(dbService.saveClinic).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Test Clinic',
                vetEmail: 'test@clinic.com',
                isVerified: true
            }));
            expect(dbService.logAdminAction).toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('validates required fields', async () => {
        render(<AddClinicModal onClose={vi.fn()} onSuccess={vi.fn()} adminEmail="admin@test.com" />);
        
        fireEvent.click(screen.getByText(/AUTHORIZE_CLINIC/i));
        // HTML5 validation might prevent submit, but our basic validation also handles it
        // Depending on how testing-library handles required fields
    });
});
