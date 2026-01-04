
import React from 'react';
import { Dashboard } from '../Dashboard';
import { RegisterPet } from '../RegisterPet';
import { FoundPet } from '../FoundPet';
import { FindVet } from '../FindVet';
import { Community } from '../Community';
import { Home } from '../Home';
import { View, User, PetProfile, VetClinic, Appointment, ChatSession, Donation, BlogPost } from '../../types';
import { dbService } from '../../services/firebase';
import { AdoptionCenter } from '../AdoptionCenter';
import { PressKit } from '../PressKit';
import { Donors } from '../Donors';
import { Blog } from '../Blog';
import { BlogPostDetail } from '../BlogPostDetail';

interface UserRouterProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    appointments: Appointment[];
    chatSessions: ChatSession[];
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
    donations: Donation[];
    allUsers: User[];
    editingPet: PetProfile | null;
    setEditingPet: (p: PetProfile | null) => void;
    petToLink: PetProfile | null;
    setPetToLink: (p: PetProfile | null) => void;
    selectedPost: BlogPost | null;
    setSelectedPost: (p: BlogPost | null) => void;
    handleRegisterPet: (p: PetProfile) => Promise<void>;
    handleStartChat: (p: PetProfile) => Promise<void>;
    handleLogout: () => void;
    setIsLoginModalOpen: (open: boolean) => void;
    setHealthCheckingPet: (p: PetProfile | null) => void;
    isLoading?: boolean;
}

export const UserRouter: React.FC<UserRouterProps> = ({
    currentView, setView, currentUser, allPets, vetClinics, appointments, chatSessions, lostPets, petsForAdoption, donations, allUsers, editingPet, setEditingPet, petToLink, setPetToLink, selectedPost, setSelectedPost, handleRegisterPet, handleStartChat, handleLogout, setIsLoginModalOpen, setHealthCheckingPet, isLoading
}) => {
    switch (currentView) {
        case 'register':
            return <RegisterPet onRegister={handleRegisterPet} goToDashboard={() => setView('dashboard')} currentUser={currentUser} existingPet={editingPet} mode="owned" />;
        case 'find':
            return <FoundPet lostPets={lostPets} partnerVets={vetClinics} onContactOwner={handleStartChat} isLoading={isLoading} />;
        case 'findVet':
            return <FindVet partnerVets={vetClinics} goBack={() => setView('dashboard')} mode="search" />;
        case 'linkVet':
            return <FindVet partnerVets={vetClinics} goBack={() => setView('dashboard')} mode="linking" onSendRequest={(vetEmail) => petToLink && dbService.savePet({ ...petToLink, vetEmail, vetLinkStatus: 'pending' }).then(() => setView('dashboard'))} />;
        case 'community':
            return <Community currentUser={currentUser} allUsers={allUsers} allPets={allPets} onRegisterStray={() => { setEditingPet(null); setView('register'); }} onFriendRequest={() => { }} onFriendResponse={() => { }} onSharePet={() => { }} goToDashboard={() => setView('dashboard')} />;
        case 'adoptionCenter':
            return <AdoptionCenter petsForAdoption={petsForAdoption} onInquire={handleStartChat} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
        case 'pressKit':
            return <PressKit goBack={() => setView('home')} />;
        case 'donors':
            return <Donors goBack={() => setView('home')} donations={donations} />;
        case 'blog':
            return <Blog setView={setView} onSelectPost={(p) => { setSelectedPost(p); setView('blogPost'); }} />;
        case 'blogPost':
            return selectedPost ? <BlogPostDetail post={selectedPost} onBack={() => setView('blog')} /> : null;
        case 'dashboard':
            return <Dashboard user={currentUser} userPets={allPets.filter(p => p.ownerEmail === currentUser.email)} appointments={appointments} onReportLost={(id, loc, rad) => dbService.savePet({ ...allPets.find(p => p.id === id)!, isLost: true, lastSeenLocation: loc, searchRadius: rad })} onMarkFound={(id) => dbService.savePet({ ...allPets.find(p => p.id === id)!, isLost: false })} onEditPet={(p) => { setEditingPet(p); setView('register'); }} onRegisterNew={() => { setEditingPet(null); setView('register'); }} setView={setView} chatSessions={chatSessions} onOpenChat={(id) => { }} onRequestAppointment={() => { }} onLinkVet={(pet) => { setPetToLink(pet); setView('linkVet'); }} onSharePet={() => { }} onHealthCheck={setHealthCheckingPet} onTransferOwnership={() => { }} onLogout={handleLogout} />;
        default:
            return <Home setView={setView} openLogin={() => setIsLoginModalOpen(true)} currentUser={currentUser} lostPets={lostPets} petsForAdoption={petsForAdoption} />;
    }
};
