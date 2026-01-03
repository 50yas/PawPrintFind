import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
        expect(screen.getByText('Admin Console')).toBeInTheDocument();
    });

    it('handles admin login submission', async () => {
        (dbService.loginWithEmail as any).mockResolvedValue({});
        render(<Footer />);
        
        fireEvent.click(screen.getByLabelText('Admin Access'));
        
        const emailInput = screen.getByPlaceholderText('admin@pawprint.ai');
        const passwordInput = screen.getByPlaceholderText('••••••••••••');
        const submitButton = screen.getByText('Authenticate');
        
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
        
        const setupButton = screen.getByText('Initialize / Reset System Control');
        fireEvent.click(setupButton);
        
        expect(screen.getByText('System Initialization')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('handles secret key validation and admin registration', async () => {
        (dbService.verifyAdminSecret as any).mockReturnValue(true);
        (dbService.registerUser as any).mockResolvedValue({});
        (dbService.initializeSystem as any).mockResolvedValue({});
        
        render(<Footer />);
        fireEvent.click(screen.getByLabelText('Admin Access'));
        fireEvent.click(screen.getByText('Initialize / Reset System Control'));
        
        const keyInput = screen.getByPlaceholderText('••••••••');
        fireEvent.change(keyInput, { target: { value: 'secret-key' } });
        fireEvent.click(screen.getByText('Validate Key'));
        
        expect(dbService.verifyAdminSecret).toHaveBeenCalledWith('secret-key');
        expect(screen.getByText('KEY VALIDATED // CREATE ROOT ACCOUNT')).toBeInTheDocument();
        
        const emailInput = screen.getByPlaceholderText('root@pawprint.ai');
        const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
        fireEvent.change(emailInput, { target: { value: 'root@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'rootpassword' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Establish Super Admin'));
        });
        
        expect(dbService.registerUser).toHaveBeenCalledWith('root@test.com', 'rootpassword', ['super_admin'], expect.any(Object));
        expect(dbService.initializeSystem).toHaveBeenCalled();
        expect(mockAddSnackbar).toHaveBeenCalledWith("Super Admin initialized successfully. Please log in.", 'success');
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
});
