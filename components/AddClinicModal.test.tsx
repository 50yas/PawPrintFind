
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

    it('renders correctly', () => {
        render(<AddClinicModal onClose={vi.fn()} onSuccess={vi.fn()} adminEmail="admin@test.com" />);
        expect(screen.getByText('dashboard:admin.manualClinicReg')).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.clinicNameLabel')).toBeInTheDocument();
        expect(screen.getByText('dashboard:admin.leadVetEmail')).toBeInTheDocument();
    });

    it('validates required fields and submits', async () => {
        const mockOnSuccess = vi.fn();
        const mockOnClose = vi.fn();
        vi.mocked(dbService.saveClinic).mockResolvedValue();

        render(<AddClinicModal onClose={mockOnClose} onSuccess={mockOnSuccess} adminEmail="admin@test.com" />);
        
        // Fill form
        fireEvent.change(screen.getByPlaceholderText('Quantum Veterinary Care'), { target: { value: 'Test Clinic' } });
        fireEvent.change(screen.getByPlaceholderText('lead@clinic.ai'), { target: { value: 'test@clinic.com' } });
        fireEvent.change(screen.getByPlaceholderText('123 Biometric Way, Cyber City'), { target: { value: '123 Test St' } });
        fireEvent.change(screen.getByPlaceholderText('+1 (555) 999-0000'), { target: { value: '555-1234' } });

        fireEvent.click(screen.getByText('dashboard:admin.authorizeClinic'));

        await waitFor(() => {
            expect(dbService.saveClinic).toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
