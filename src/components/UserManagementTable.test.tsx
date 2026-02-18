import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserManagementTable } from './UserManagementTable';
import { adminService } from '../services/adminService';
import React from 'react';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock adminService
vi.mock('../services/adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
    updateUserRole: vi.fn(),
    toggleUserStatus: vi.fn(),
    toggleUserSubscription: vi.fn(),
  },
}));

describe('UserManagementTable Component', () => {
  const mockUsers = [
    { uid: 'u1', email: 'owner@test.com', roles: ['owner'], activeRole: 'owner', status: 'active' },
    { uid: 'u2', email: 'vet@test.com', roles: ['vet'], activeRole: 'vet', status: 'active', subscription: { status: 'inactive' } },
    { uid: 'u3', email: 'provet@test.com', roles: ['vet'], activeRole: 'vet', status: 'active', subscription: { status: 'active' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getUsers as any).mockResolvedValue(mockUsers);
  });

  it('renders user list', async () => {
    render(<UserManagementTable />);
    await waitFor(() => {
        expect(screen.getByText('owner@test.com')).toBeInTheDocument();
        expect(screen.getByText('vet@test.com')).toBeInTheDocument();
    });
  });

  it('shows Promotes button for free vets', async () => {
    render(<UserManagementTable />);
    await waitFor(() => {
        const vetRow = screen.getByText('vet@test.com').closest('tr');
        expect(vetRow).toHaveTextContent('Free');
        expect(screen.getAllByText('Promote')[0]).toBeInTheDocument();
    });
  });

  it('shows Demote button for pro vets', async () => {
    render(<UserManagementTable />);
    await waitFor(() => {
        const proVetRow = screen.getByText('provet@test.com').closest('tr');
        expect(proVetRow).toHaveTextContent('Pro');
        expect(screen.getByText('Demote')).toBeInTheDocument();
    });
  });

  it('calls toggleUserSubscription when Promote is clicked', async () => {
    render(<UserManagementTable />);
    await waitFor(() => screen.getByText('vet@test.com'));
    
    const promoteBtns = screen.getAllByText('Promote');
    fireEvent.click(promoteBtns[0]); // Click first promote button

    expect(adminService.toggleUserSubscription).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('calls toggleUserSubscription when Demote is clicked', async () => {
    render(<UserManagementTable />);
    await waitFor(() => screen.getByText('provet@test.com'));
    
    const demoteBtn = screen.getByText('Demote');
    fireEvent.click(demoteBtn);

    expect(adminService.toggleUserSubscription).toHaveBeenCalledWith('u3', false);
  });
});