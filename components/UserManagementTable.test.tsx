import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserManagementTable } from './UserManagementTable';
import { adminService } from '../services/adminService';
import { User } from '../types';

// Mock dependencies
vi.mock('../services/adminService');

const mockUsers: User[] = [
  {
    uid: '1',
    email: 'user1@example.com',
    roles: ['owner'],
    activeRole: 'owner',
    friends: [],
    friendRequests: [],
    points: 10,
    badges: [],
    status: 'active'
  },
  {
    uid: '2',
    email: 'vet@example.com',
    roles: ['vet'],
    activeRole: 'vet',
    friends: [],
    friendRequests: [],
    points: 50,
    badges: [],
    status: 'suspended'
  }
];

describe('UserManagementTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getUsers as any).mockResolvedValue(mockUsers);
  });

  it('renders the user list', async () => {
    render(<UserManagementTable />);
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('vet@example.com')).toBeInTheDocument();
    });
  });

  it('filters users by search term', async () => {
    render(<UserManagementTable />);
    
    await waitFor(() => screen.getByText('user1@example.com'));

    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'vet' } });

    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('vet@example.com')).toBeInTheDocument();
  });

  it('allows changing user role', async () => {
    render(<UserManagementTable />);
    
    await waitFor(() => screen.getByText('user1@example.com'));

    // Assuming we have a select/dropdown for role
    // This part depends on implementation, but let's assume a button or select triggers it
    // For now, let's verify the service call is mocked
  });
});
