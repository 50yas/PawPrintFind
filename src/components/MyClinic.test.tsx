
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyClinic } from './MyClinic';
import { findClinicOnGoogleMaps } from '../services/geminiService';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  findClinicOnGoogleMaps: vi.fn(),
}));

// Mock Snackbar
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

// Mock LoadingSpinner
vi.mock('./LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('MyClinic Component', () => {
  const defaultProps = {
    onSave: vi.fn(),
    vetEmail: 'vet@test.com',
    existingClinic: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial form correctly', () => {
    render(<MyClinic {...defaultProps} />);
    expect(screen.getByText('myClinicTitle')).toBeInTheDocument();
    expect(screen.getByText('saveClinicButton')).toBeInTheDocument();
  });

  it('populates form with existing clinic data', () => {
    const existingClinic = {
        name: 'Existing Clinic',
        address: '123 Test St',
        phone: '555-1234',
        vetEmail: 'vet@test.com'
    };
    render(<MyClinic {...defaultProps} existingClinic={existingClinic} />);
    expect(screen.getByDisplayValue('Existing Clinic')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
  });

  it('calls onSave when form is submitted', () => {
    render(<MyClinic {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByText('clinicNameLabel').nextElementSibling as HTMLInputElement, { target: { value: 'New Clinic' } });
    fireEvent.change(screen.getByText('addressLabel').nextElementSibling as HTMLTextAreaElement, { target: { value: 'New Address' } });
    fireEvent.change(screen.getByText('phoneLabel').nextElementSibling as HTMLInputElement, { target: { value: '123-456-7890' } });

    // Submit
    fireEvent.click(screen.getByText('saveClinicButton'));

    expect(defaultProps.onSave).toHaveBeenCalledWith({
        vetEmail: 'vet@test.com',
        name: 'New Clinic',
        address: 'New Address',
        phone: '123-456-7890',
        location: undefined
    });
  });

  it('performs Google Maps search', async () => {
    (findClinicOnGoogleMaps as any).mockResolvedValue([{ title: 'Found Clinic', address: 'Found Addr', phone: '999' }]);
    render(<MyClinic {...defaultProps} />);

    // Type in search
    const searchInput = screen.getByPlaceholderText('searchClinicPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Search Term' } });
    
    // Click search
    fireEvent.click(screen.getByText('searchButtonGoogle'));

    await waitFor(() => {
        expect(findClinicOnGoogleMaps).toHaveBeenCalledWith('Search Term', '');
    });

    // Check if result card appears
    expect(screen.getByText('Found Clinic')).toBeInTheDocument();
  });

  it('syncs data from search result', async () => {
    (findClinicOnGoogleMaps as any).mockResolvedValue([{ title: 'Found Clinic', address: 'Found Addr', phone: '999' }]);
    render(<MyClinic {...defaultProps} />);

    // Perform search
    const searchInput = screen.getByPlaceholderText('searchClinicPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Search Term' } });
    fireEvent.click(screen.getByText('searchButtonGoogle'));

    await waitFor(() => {
        expect(screen.getByText('Found Clinic')).toBeInTheDocument();
    });

    // Click Sync
    fireEvent.click(screen.getByText('syncAllDataButton'));

    // Check if form is populated
    expect(screen.getByDisplayValue('Found Clinic')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Found Addr')).toBeInTheDocument();
    expect(screen.getByDisplayValue('999')).toBeInTheDocument();
  });
});
