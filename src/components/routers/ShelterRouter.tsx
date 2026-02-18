
import React, { lazy, Suspense } from 'react';
import { View, User, PetProfile, ChatSession, Donation, BlogPost } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { DashboardSkeleton, GridSkeleton } from '../ui/LoadingSkeletons';

const ShelterDashboard = lazy(() => import('../ShelterDashboard').then(m => ({ default: m.ShelterDashboard })));
const RegisterPet = lazy(() => import('../RegisterPet').then(m => ({ default: m.RegisterPet })));
const Home = lazy(() => import('../Home').then(m => ({ default: m.Home })));
const AdoptionCenter = lazy(() => import('../AdoptionCenter').then(m => ({ default: m.AdoptionCenter })));
const LostPetsCenter = lazy(() => import('../LostPetsCenter').then(m => ({ default: m.LostPetsCenter })));
const PressKit = lazy(() => import('../PressKit').then(m => ({ default: m.PressKit })));
const Donors = lazy(() => import('../Donors').then(m => ({ default: m.Donors })));
const Blog = lazy(() => import('../Blog').then(m => ({ default: m.Blog })));
const BlogPostDetail = lazy(() => import('../BlogPostDetail').then(m => ({ default: m.BlogPostDetail })));
const PublicPetDetail = lazy(() => import('../PublicPetDetail').then(m => ({ default: m.PublicPetDetail })));

const RouterSkeleton: React.FC<{ view: View }> = ({ view }) => {
    if (view === 'shelterDashboard') return <DashboardSkeleton />;
    if (view === 'adoptionCenter') return <div className="max-w-7xl mx-auto p-6"><GridSkeleton variant="card" count={6} /></div>;
    return <div className="flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>;
};

interface ShelterRouterProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
    allPets: PetProfile[];
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
    donations: Donation[];
    chatSessions: ChatSession[];
    editingPet: PetProfile | null;
    setEditingPet: (p: PetProfile | null) => void;
    selectedPet: PetProfile | null;
    setSelectedPet: (pet: PetProfile | null) => void;
    onViewPet: (pet: PetProfile) => void;
    onReportSighting?: (pet: PetProfile) => void;
    selectedPost: BlogPost | null;
    setSelectedPost: (p: BlogPost | null) => void;
    handleRegisterPet: (p: PetProfile) => Promise<void>;
    handleStartChat: (p: PetProfile) => Promise<void>;
    onOpenChat: (id: string) => void;
    setIsLoginModalOpen: (open: boolean) => void;
    isLoading: boolean;
}

export const ShelterRouter: React.FC<ShelterRouterProps> = ({
    currentView, setView, currentUser, allPets, lostPets, petsForAdoption, donations, chatSessions, editingPet, setEditingPet, selectedPet, setSelectedPet, onViewPet, onReportSighting, selectedPost, setSelectedPost, handleRegisterPet, handleStartChat, onOpenChat, setIsLoginModalOpen, isLoading
}) => {
    const shelterPets = allPets.filter(p => p.ownerEmail === currentUser.email);
    const shelterChats = chatSessions.filter(c => c.ownerEmail === currentUser.email);

    return (
        <Suspense fallback={<RouterSkeleton view={currentView} />}>
            {(() => {
                switch (currentView) {
                    case 'register':
                        return <RegisterPet onRegister={handleRegisterPet} goToDashboard={() => setView('shelterDashboard')} currentUser={currentUser} existingPet={editingPet} mode="forAdoption" />;
                    case 'adoptionCenter':
                        return <AdoptionCenter petsForAdoption={petsForAdoption} onInquire={handleStartChat} onViewPet={onViewPet} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
                    case 'lostPetsCenter':
                        return <LostPetsCenter lostPets={lostPets} onContactOwner={handleStartChat} onViewPet={onViewPet} onOpenScanner={() => setView('find')} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
                    case 'publicPetDetail':
                        return selectedPet ? <PublicPetDetail pet={selectedPet} goBack={() => setView(selectedPet.status === 'forAdoption' ? 'adoptionCenter' : 'lostPetsCenter')} onContactOwner={handleStartChat} onReportSighting={onReportSighting} currentUser={currentUser} /> : null;
                    case 'pressKit':
                        return <PressKit goBack={() => setView('home')} />;
                    case 'donors':
                        return <Donors goBack={() => setView('home')} donations={donations} />;
                    case 'blog':
                        return <Blog setView={setView} onSelectPost={(p) => { setSelectedPost(p); setView('blogPost'); }} />;
                    case 'blogPost':
                        return selectedPost ? <BlogPostDetail post={selectedPost} onBack={() => setView('blog')} /> : null;
                    case 'shelterDashboard':
                        return <ShelterDashboard shelterPets={shelterPets} onRegisterNew={() => { setEditingPet(null); setView('register'); }} onEditPet={(p) => { setEditingPet(p); setView('register'); }} onViewPet={onViewPet} chatSessions={shelterChats} onOpenChat={onOpenChat} onTransferOwnership={() => { }} />;
                    default:
                        return <Home setView={setView} openLogin={() => setIsLoginModalOpen(true)} currentUser={currentUser} lostPets={lostPets} petsForAdoption={petsForAdoption} onContactOwner={handleStartChat} onViewPet={onViewPet} />;
                }
            })()}
        </Suspense>
    );
};
