
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

    useEffect(() => {
        const unsubPets = dbService.subscribeToPets(setAllPets);
        const unsubDonations = dbService.subscribeToDonations(setDonations);
        const unsubClinics = dbService.subscribeToClinics(setVetClinics);
        return () => { unsubPets(); unsubDonations(); unsubClinics(); };
    }, []);

    useEffect(() => {
        if (currentUser) {
            const unsubAppts = dbService.subscribeToAppointments(currentUser.email, setAppointments);
            const unsubChats = dbService.subscribeToChats(currentUser.email, setChatSessions);

            if (currentUser.activeRole === 'super_admin') {
                dbService.getUsers().then(setAllUsers).catch(console.error);
            }

            return () => { unsubAppts(); unsubChats(); };
        } else {
            setAppointments([]);
            setChatSessions([]);
        }
    }, [currentUser]);

    const handleRefreshAdminData = useCallback(async () => {
        const u = await dbService.getUsers();
        const p = await dbService.getPets();
        setAllUsers(u);
        setAllPets(p);
    }, []);

    return {
        allPets,
        vetClinics,
        donations,
        appointments,
        chatSessions,
        allUsers,
        handleRefreshAdminData,
        setAllPets,
        setAllUsers
    };
};
