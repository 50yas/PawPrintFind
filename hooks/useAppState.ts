
import { useState, useEffect, useCallback } from 'react';
import { User, PetProfile, VetClinic, Donation, Appointment, ChatSession, View, BlogPost } from '../types';
import { dbService } from '../services/firebase';

export const useAppState = (currentUser: User | null, currentView: View) => {
    const [allPets, setAllPets] = useState<PetProfile[]>([]);
    const [vetClinics, setVetClinics] = useState<VetClinic[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let petsLoaded = false;
        let donationsLoaded = false;
        let clinicsLoaded = false;

        const checkLoaded = () => {
            if (petsLoaded && donationsLoaded && clinicsLoaded) {
                setIsLoading(false);
            }
        };

        const handleSubError = (source: string, error: any) => {
            console.error(`Subscription error for ${source}:`, error);
            // Mark as loaded to avoid infinite loading screen
            if (source === 'pets') petsLoaded = true;
            if (source === 'donations') donationsLoaded = true;
            if (source === 'clinics') clinicsLoaded = true;
            checkLoaded();
        };

        const unsubPets = dbService.subscribeToPets(
            (data) => {
                setAllPets(data);
                petsLoaded = true;
                checkLoaded();
            },
            (error) => handleSubError('pets', error)
        );

        const unsubDonations = dbService.subscribeToDonations(
            (data) => {
                setDonations(data);
                donationsLoaded = true;
                checkLoaded();
            },
            (error) => handleSubError('donations', error)
        );

        const unsubClinics = dbService.subscribeToClinics(
            (data) => {
                setVetClinics(data);
                clinicsLoaded = true;
                checkLoaded();
            },
            (error) => handleSubError('clinics', error)
        );

        return () => { unsubPets(); unsubDonations(); unsubClinics(); };
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.email) {
            const unsubAppts = dbService.subscribeToAppointments(currentUser.email, setAppointments);
            const unsubChats = dbService.subscribeToChats(currentUser.email, setChatSessions);

            if (currentUser.activeRole === 'super_admin') {
                // Wrap in try/catch to handle cases where local role != server role
                dbService.getUsers()
                    .then(setAllUsers)
                    .catch(err => {
                        console.warn(`[Admin-Sync] Permission Denied for user list. Code: ${err.code}. Message: ${err.message}`);
                        console.log("Check if your Firestore document has activeRole: 'super_admin'");
                        setAllUsers([]);
                    });
            }

            return () => { unsubAppts(); unsubChats(); };
            return () => { unsubAppts(); unsubChats(); };
        } else {
            setAppointments([]);
            setChatSessions([]);
        }
    }, [currentUser?.uid, currentUser?.email, currentUser?.activeRole]);

    const handleRefreshAdminData = useCallback(async () => {
        setIsLoading(true);
        try {
            const u = await dbService.getUsers();
            setAllUsers(u);
        } catch (e) {
            console.error("Manual Admin Sync Failed:", e);
        }
        const p = await dbService.getPets();
        setAllPets(p);
        setIsLoading(false);
    }, []);

    return {
        allPets,
        vetClinics,
        donations,
        appointments,
        chatSessions,
        allUsers,
        isLoading,
        handleRefreshAdminData,
        setAllPets,
        setAllUsers
    };
};
