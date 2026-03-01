
import { useState, useEffect, useRef } from 'react';
import { User, View } from '../types';
import { dbService } from '../services/firebase';
import { authService } from '../services/authService';

const getDashboardView = (role: string | undefined): View => {
    switch (role) {
        case 'super_admin': return 'adminDashboard';
        case 'shelter': return 'shelterDashboard';
        case 'vet': return 'vetDashboard';
        default: return 'dashboard';
    }
};

export const useAuthSync = (
    currentView: View,
    setCurrentView: (v: View) => void,
    setIsLoginModalOpen: (o: boolean) => void
) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // Track if previous auth state had a user (to distinguish fresh login from page refresh)
    const hadUserRef = useRef<boolean>(false);

    useEffect(() => {
        // Handle Magic Link Completion
        const handleMagicLink = async () => {
            const href = window.location.href;
            if (authService.completeMagicLinkSignIn && window.localStorage.getItem('emailForSignIn')) {
                const email = window.localStorage.getItem('emailForSignIn');
                if (email && href.includes('apiKey')) {
                    try {
                        await authService.completeMagicLinkSignIn(email, href);
                        window.localStorage.removeItem('emailForSignIn');
                        // URL cleanup
                        window.history.replaceState({}, '', window.location.pathname);
                    } catch (e: any) {
                        console.error("Magic Link Sync Error:", e.message);
                    }
                }
            }
        };
        handleMagicLink();

        const unsubscribeAuth = dbService.auth.onAuthStateChanged(async (fbUser) => {
            if (fbUser) {
                if (fbUser.isAnonymous) return;
                try {
                    const profile = await dbService.syncUserProfile(fbUser);
                    const wasLoggedOut = !hadUserRef.current;
                    hadUserRef.current = true;
                    setCurrentUser(profile);
                    setIsLoginModalOpen(false);
                    // Redirect to dashboard if: fresh login OR currently on home page
                    if (wasLoggedOut || currentView === 'home') {
                        const dashView = getDashboardView(profile.activeRole);
                        setCurrentView(dashView);
                    }
                } catch (e: any) {
                    console.error("Sync Error:", e.message);
                }
            } else {
                hadUserRef.current = false;
                setCurrentUser(null);
            }
        });
        return () => unsubscribeAuth();
    }, [setIsLoginModalOpen, setCurrentView]); // eslint-disable-line react-hooks/exhaustive-deps

    return { currentUser, setCurrentUser };
};
