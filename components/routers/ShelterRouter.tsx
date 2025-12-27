
import React from 'react';
import { ShelterDashboard } from '../ShelterDashboard';
import { RegisterPet } from '../RegisterPet';
import { View, User, PetProfile, ChatSession } from '../../types';

interface ShelterRouterProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
    allPets: PetProfile[];
    chatSessions: ChatSession[];
    editingPet: PetProfile | null;
    setEditingPet: (p: PetProfile | null) => void;
    handleRegisterPet: (p: PetProfile) => Promise<void>;
    onOpenChat: (id: string) => void;
}

export const ShelterRouter: React.FC<ShelterRouterProps> = ({
    currentView, setView, currentUser, allPets, chatSessions, editingPet, setEditingPet, handleRegisterPet, onOpenChat
}) => {
    const shelterPets = allPets.filter(p => p.ownerEmail === currentUser.email);
    const shelterChats = chatSessions.filter(c => c.ownerEmail === currentUser.email);

    switch (currentView) {
        case 'register':
            return <RegisterPet onRegister={handleRegisterPet} goToDashboard={() => setView('shelterDashboard')} currentUser={currentUser} existingPet={editingPet} mode="forAdoption" />;
        default:
            return <ShelterDashboard shelterPets={shelterPets} onRegisterNew={() => { setEditingPet(null); setView('register'); }} onEditPet={(p) => { setEditingPet(p); setView('register'); }} chatSessions={shelterChats} onOpenChat={onOpenChat} onTransferOwnership={() => { }} />;
    }
};
