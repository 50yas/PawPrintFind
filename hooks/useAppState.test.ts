import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAppState } from './useAppState';
import { dbService } from '../services/firebase';

// Mock dbService
vi.mock('../services/firebase', () => ({
    dbService: {
        subscribeToPets: vi.fn(),
        subscribeToDonations: vi.fn(),
        subscribeToClinics: vi.fn(),
        subscribeToAppointments: vi.fn(),
        subscribeToChats: vi.fn(),
        getUsers: vi.fn(),
        getPets: vi.fn()
    }
}));

describe('useAppState Hook', () => {
    let mockUnsubscribes: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnsubscribes = {
            pets: vi.fn(),
            donations: vi.fn(),
            clinics: vi.fn(),
            appts: vi.fn(),
            chats: vi.fn()
        };

        (dbService.subscribeToPets as any).mockReturnValue(mockUnsubscribes.pets);
        (dbService.subscribeToDonations as any).mockReturnValue(mockUnsubscribes.donations);
        (dbService.subscribeToClinics as any).mockReturnValue(mockUnsubscribes.clinics);
        (dbService.subscribeToAppointments as any).mockReturnValue(mockUnsubscribes.appts);
        (dbService.subscribeToChats as any).mockReturnValue(mockUnsubscribes.chats);
    });

    it('initializes with default values and starts loading', () => {
        const { result } = renderHook(() => useAppState(null, 'home'));
        
        expect(result.current.allPets).toEqual([]);
        expect(result.current.isLoading).toBe(true);
        expect(dbService.subscribeToPets).toHaveBeenCalled();
        expect(dbService.subscribeToDonations).toHaveBeenCalled();
        expect(dbService.subscribeToClinics).toHaveBeenCalled();
    });

    it('stops loading after primary data is received', async () => {
        let petCallback: any;
        let donationCallback: any;
        let clinicCallback: any;

        (dbService.subscribeToPets as any).mockImplementation((cb: any) => { petCallback = cb; return mockUnsubscribes.pets; });
        (dbService.subscribeToDonations as any).mockImplementation((cb: any) => { donationCallback = cb; return mockUnsubscribes.donations; });
        (dbService.subscribeToClinics as any).mockImplementation((cb: any) => { clinicCallback = cb; return mockUnsubscribes.clinics; });

        const { result } = renderHook(() => useAppState(null, 'home'));

        act(() => {
            petCallback([{ id: '1', name: 'Buddy' }]);
            donationCallback([{ id: 'd1', amount: '10' }]);
            clinicCallback([{ id: 'c1', name: 'Clinic' }]);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.allPets).toHaveLength(1);
        expect(result.current.donations).toHaveLength(1);
        expect(result.current.vetClinics).toHaveLength(1);
    });

    it('subscribes to user-specific data when user is logged in', () => {
        const currentUser = { uid: 'u1', email: 'test@test.com', activeRole: 'owner' } as any;
        renderHook(() => useAppState(currentUser, 'dashboard'));

        expect(dbService.subscribeToAppointments).toHaveBeenCalledWith('test@test.com', expect.any(Function));
        expect(dbService.subscribeToChats).toHaveBeenCalledWith('test@test.com', expect.any(Function));
    });

    it('fetches all users if user is super_admin', async () => {
        const currentUser = { uid: 'admin', email: 'admin@test.com', activeRole: 'super_admin' } as any;
        (dbService.getUsers as any).mockResolvedValue([{ uid: 'u1', email: 'user1@test.com' }]);

        const { result } = renderHook(() => useAppState(currentUser, 'adminDashboard'));

        await waitFor(() => {
            expect(result.current.allUsers).toHaveLength(1);
        });
        expect(dbService.getUsers).toHaveBeenCalled();
    });

    it('cleans up subscriptions on unmount', () => {
        const { unmount } = renderHook(() => useAppState(null, 'home'));
        unmount();
        
        expect(mockUnsubscribes.pets).toHaveBeenCalled();
        expect(mockUnsubscribes.donations).toHaveBeenCalled();
        expect(mockUnsubscribes.clinics).toHaveBeenCalled();
    });
});
