
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAppState } from './useAppState';
import { dbService } from '../services/firebase';

vi.mock('../services/firebase', () => ({
  dbService: {
    subscribeToPets: vi.fn(() => vi.fn()),
    subscribeToDonations: vi.fn(() => vi.fn()),
    subscribeToClinics: vi.fn(() => vi.fn()),
    subscribeToAppointments: vi.fn(() => vi.fn()),
    subscribeToChats: vi.fn(() => vi.fn()),
    getUsers: vi.fn().mockResolvedValue([]),
  }
}));

describe('useAppState Hook', () => {
    it('should initialize with isLoading = true', () => {
        const { result } = renderHook(() => useAppState(null, 'home'));
        expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false when all subscriptions return data', async () => {
        // Mock implementations to immediately call the callback
        (dbService.subscribeToPets as any).mockImplementation((cb: any) => { cb([]); return vi.fn(); });
        (dbService.subscribeToDonations as any).mockImplementation((cb: any) => { cb([]); return vi.fn(); });
        (dbService.subscribeToClinics as any).mockImplementation((cb: any) => { cb([]); return vi.fn(); });

        const { result } = renderHook(() => useAppState(null, 'home'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should handle subscription errors gracefully and stop loading', async () => {
        // Mock subscribeToPets to simulate an error callback
        (dbService.subscribeToPets as any).mockImplementation((cb: any, errCb: any) => { 
            if (errCb) errCb(new Error("Permission Denied"));
            return vi.fn(); 
        });
        (dbService.subscribeToDonations as any).mockImplementation((cb: any) => { cb([]); return vi.fn(); });
        (dbService.subscribeToClinics as any).mockImplementation((cb: any) => { cb([]); return vi.fn(); });

        const { result } = renderHook(() => useAppState(null, 'home'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        
        // Ensure pets are empty (since it failed)
        expect(result.current.allPets).toEqual([]);
    });
});