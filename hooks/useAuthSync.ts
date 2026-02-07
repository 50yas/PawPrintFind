
import { useState, useEffect } from 'react';
import { User, View } from '../types';
import { dbService } from '../services/firebase';
import { authService } from '../services/authService';

export const useAuthSync = (
    currentView: View,
    setCurrentView: (v: View) => void,
    setIsLoginModalOpen: (o: boolean) => void
) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

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
                    setCurrentUser(profile);
                    setIsLoginModalOpen(false);
                } catch (e: any) {
                    console.error("Sync Error:", e.message);
                }
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribeAuth();
    }, [setIsLoginModalOpen]); // Removed currentView and setCurrentView dependencies

    return { currentUser, setCurrentUser };
};
