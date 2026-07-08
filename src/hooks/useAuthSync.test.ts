import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthSync } from './useAuthSync';
import { dbService } from '../services/firebase';

// Mock dbService
vi.mock('../services/firebase', () => ({
    dbService: {
        auth: {
            onAuthStateChanged: vi.fn()
        },
        syncUserProfile: vi.fn()
    }
}));

describe('useAuthSync Hook', () => {
    let onAuthStateChangedCallback: any;
    const mockSetCurrentView = vi.fn();
    const mockSetIsLoginModalOpen = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (dbService.auth.onAuthStateChanged as any).mockImplementation((cb: any) => {
            onAuthStateChangedCallback = cb;
            return vi.fn(); // unsubscribe function
        });
    });

    it('sets currentUser to null when logged out', async () => {
        const { result } = renderHook(() => useAuthSync('home', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        act(() => {
            onAuthStateChangedCallback(null);
        });

        expect(result.current.currentUser).toBeNull();
    });

    it('syncs profile and redirects when logged in if on home page', async () => {
        const mockFbUser = { uid: '123', email: 'test@test.com' } as any;
        const mockProfile = { uid: '123', email: 'test@test.com', activeRole: 'owner' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        const { result } = renderHook(() => useAuthSync('home', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        await act(async () => {
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(dbService.syncUserProfile).toHaveBeenCalledWith(mockFbUser);
        expect(result.current.currentUser).toEqual(mockProfile);
        expect(mockSetIsLoginModalOpen).toHaveBeenCalledWith(false);
        // Should redirect to dashboard for owners
        expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
    });

    it('handles super_admin sync correctly and redirects to adminDashboard', async () => {
        const mockFbUser = { uid: 'admin' } as any;
        const mockProfile = { uid: 'admin', activeRole: 'super_admin' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        renderHook(() => useAuthSync('home', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        await act(async () => {
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(mockSetCurrentView).toHaveBeenCalledWith('adminDashboard');
    });

    it('handles vet sync correctly and redirects to vetDashboard', async () => {
        const mockFbUser = { uid: 'vet' } as any;
        const mockProfile = { uid: 'vet', activeRole: 'vet' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        renderHook(() => useAuthSync('home', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        await act(async () => {
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(mockSetCurrentView).toHaveBeenCalledWith('vetDashboard');
    });

    it('does not redirect if not on home page and already logged in', async () => {
        const mockFbUser = { uid: '123' } as any;
        const mockProfile = { uid: '123', activeRole: 'owner' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        const { result } = renderHook(() => useAuthSync('find', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        // Use a persistent object for profile to avoid issues with multiple calls if any

        await act(async () => {
            // First call: wasLoggedOut = true
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(mockSetCurrentView).toHaveBeenCalled(); // It redirects on first login even if on 'find'
        mockSetCurrentView.mockClear();

        await act(async () => {
            // Second call: wasLoggedOut = false
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(mockSetCurrentView).not.toHaveBeenCalled();
    });
});
