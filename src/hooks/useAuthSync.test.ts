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

    it('syncs profile and redirects when on home page', async () => {
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
        // It should redirect because it's on the 'home' view
        expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
    });

    it('handles super_admin sync correctly', async () => {
        const mockFbUser = { uid: 'admin' } as any;
        const mockProfile = { uid: 'admin', activeRole: 'super_admin' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        renderHook(() => useAuthSync('home', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        await act(async () => {
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(mockSetCurrentView).toHaveBeenCalledWith('adminDashboard');
    });

    it('handles vet sync correctly', async () => {
        const mockFbUser = { uid: 'vet' } as any;
        const mockProfile = { uid: 'vet', activeRole: 'vet' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        renderHook(() => useAuthSync('home', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        await act(async () => {
            await onAuthStateChangedCallback(mockFbUser);
        });

        expect(mockSetCurrentView).toHaveBeenCalledWith('vetDashboard');
    });

    it('redirects if was logged out even if not on home page', async () => {
        const mockFbUser = { uid: '123' } as any;
        const mockProfile = { uid: '123', activeRole: 'owner' } as any;
        (dbService.syncUserProfile as any).mockResolvedValue(mockProfile);

        renderHook(() => useAuthSync('find', mockSetCurrentView, mockSetIsLoginModalOpen));
        
        await act(async () => {
            await onAuthStateChangedCallback(mockFbUser);
        });

        // wasLoggedOut = true on first run, so it should redirect
        expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
    });
});