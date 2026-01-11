import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from './Footer';
import React from 'react';
import { dbService } from '../services/firebase';

// Mock child components
vi.mock('./Modal', () => ({
    Modal: ({ children, isOpen, title }: any) => isOpen ? (
        <div data-testid="modal">
            <h2>{title}</h2>
            {children}
        </div>
    ) : null
}));

vi.mock('./LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock hooks
vi.mock('../hooks/useTranslations', () => ({
    useTranslations: () => ({
        t: (key: string) => key
    })
}));

const mockAddSnackbar = vi.fn();
vi.mock('../contexts/SnackbarContext', () => ({
    useSnackbar: () => ({
        addSnackbar: mockAddSnackbar
    })
}));

// Mock services
vi.mock('../services/firebase', () => ({
    dbService: {
        loginWithEmail: vi.fn(),
        verifyAdminSecret: vi.fn(),
        registerUser: vi.fn(),
        initializeSystem: vi.fn()
    }
}));

describe('Footer Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders branding and social links', () => {
        render(<Footer />);
        expect(screen.getAllByText(/Paw/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Print/)[0]).toBeInTheDocument();
        expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
        expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
        expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    });

    it('shows admin login modal when clicking admin button', () => {
        render(<Footer />);
        const adminButton = screen.getByLabelText('Admin Access');
        fireEvent.click(adminButton);
        
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('adminConsole')).toBeInTheDocument();
    });

    it('handles admin login submission', async () => {
        (dbService.loginWithEmail as any).mockResolvedValue({});
        render(<Footer />);
        
        fireEvent.click(screen.getByLabelText('Admin Access'));
        
        const emailInput = screen.getByPlaceholderText('adminEmailPlaceholder');
        const passwordInput = screen.getByPlaceholderText('passwordPlaceholder');
        const submitButton = screen.getByText('authenticate');
        
        fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        await act(async () => {
            fireEvent.click(submitButton);
        });
        
        expect(dbService.loginWithEmail).toHaveBeenCalledWith('admin@test.com', 'password123');
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('shows system initialization flow', () => {
        render(<Footer />);
        fireEvent.click(screen.getByLabelText('Admin Access'));
        
        const setupButton = screen.getByText('initializeResetSystem');
        fireEvent.click(setupButton);
        
        expect(screen.getByText('systemInitialization')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('handles secret key validation and admin registration', async () => {
        (dbService.verifyAdminSecret as any).mockReturnValue(true);
        (dbService.registerUser as any).mockResolvedValue({});
        (dbService.initializeSystem as any).mockResolvedValue({});
        
        render(<Footer />);
        fireEvent.click(screen.getByLabelText('Admin Access'));
        fireEvent.click(screen.getByText('initializeResetSystem'));
        
        const keyInput = screen.getByPlaceholderText('••••••••');
        fireEvent.change(keyInput, { target: { value: 'secret-key' } });
        await act(async () => {
            fireEvent.click(screen.getByText('validateKey'));
        });
        
        await waitFor(() => {
            expect(screen.getByText('keyValidatedCreateRoot')).toBeInTheDocument();
        });
        
        const emailInput = screen.getByPlaceholderText('rootEmailPlaceholder');
        const passwordInput = screen.getByPlaceholderText('minCharacters');
        fireEvent.change(emailInput, { target: { value: 'root@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'rootpassword' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('establishSuperAdmin'));
        });
        
        await waitFor(() => {
            expect(dbService.registerUser).toHaveBeenCalledWith('root@test.com', 'rootpassword', ['super_admin'], expect.anything());
            expect(dbService.initializeSystem).toHaveBeenCalled();
            expect(mockAddSnackbar).toHaveBeenCalledWith("superAdminInitializedSuccess", 'success');
            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });
    });
});
