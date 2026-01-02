
import { useState, useEffect } from 'react';
import { User, View } from '../types';
import { dbService } from '../services/firebase';

export const useAuthSync = (
    currentView: View,
    setCurrentView: (v: View) => void,
    setIsLoginModalOpen: (o: boolean) => void
) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribeAuth = dbService.auth.onAuthStateChanged(async (fbUser) => {
            if (fbUser) {
                if (fbUser.isAnonymous) return;
                try {
                    const profile = await dbService.syncUserProfile(fbUser);
                    setCurrentUser(profile);
                    setIsLoginModalOpen(false);

                    if (currentView === 'home') {
                        // Redirect based on role
                        if (profile.activeRole === 'super_admin') {
                            setCurrentView('adminDashboard');
                        } else if (profile.activeRole === 'vet') {
                            setCurrentView('vetDashboard');
                        } else if (profile.activeRole === 'shelter') {
                            setCurrentView('shelterDashboard');
                        } else {
                            setCurrentView('dashboard');
                        }
                    }
                } catch (e: any) {
                    console.error("Sync Error:", e.message);
                }
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribeAuth();
    }, [currentView, setCurrentView, setIsLoginModalOpen]);

    return { currentUser, setCurrentUser };
};
