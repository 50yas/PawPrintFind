import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from './AdminDashboard';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
    useTranslations: () => ({
        t: (key: string) => key,
    }),
}));

// Mock Snackbar
vi.mock('../contexts/SnackbarContext', () => ({
    useSnackbar: () => ({
        addSnackbar: vi.fn(),
    }),
}));

// Mock services
vi.mock('../services/firebase', () => ({
    dbService: {
        logAdminAction: vi.fn().mockResolvedValue(undefined),
        getBlogPosts: vi.fn().mockResolvedValue([]),
        subscribeToDonations: vi.fn().mockReturnValue(() => {}),
        deleteClinic: vi.fn(),
    },
    db: {}
}));

vi.mock('../services/loggerService', () => ({
    logger: {
        subscribe: vi.fn().mockReturnValue(() => {}),
    }
}));

// Mock lazy components
vi.mock('./admin/OperationsTab', () => ({ OperationsTab: () => <div data-testid="operations-tab">Operations Content</div> }));
vi.mock('./admin/FinanceTab', () => ({ FinanceTab: () => <div data-testid="finance-tab">Finance Content</div> }));

describe('AdminDashboard Navigation', () => {
    const mockProps: any = {
        users: [],
        currentUser: { uid: 'admin1', email: 'admin@test.com', activeRole: 'super_admin' },
        allPets: [],
        vetClinics: [],
        donations: [],
        onDeleteUser: vi.fn(),
        onLogout: vi.fn(),
        onRefresh: vi.fn(),
        onViewPet: vi.fn(),
    };

    it('navigates through multiple tabs', async () => {
        render(<AdminDashboard {...mockProps} />);
        
        fireEvent.click(screen.getByText('Operations'));
        expect(await screen.findByTestId('operations-tab')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Finance'));
        expect(await screen.findByTestId('finance-tab')).toBeInTheDocument();
    });
});
