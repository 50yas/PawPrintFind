
import React, { lazy, Suspense } from 'react';
import { Home } from '../Home';
import { View, PetProfile, Donation, BlogPost } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';

const PressKit = lazy(() => import('../PressKit').then(m => ({ default: m.PressKit })));
const Donors = lazy(() => import('../Donors').then(m => ({ default: m.Donors })));
const Blog = lazy(() => import('../Blog').then(m => ({ default: m.Blog })));
const BlogPostDetail = lazy(() => import('../BlogPostDetail').then(m => ({ default: m.BlogPostDetail })));
const AdoptionCenter = lazy(() => import('../AdoptionCenter').then(m => ({ default: m.AdoptionCenter })));
const LostPetsCenter = lazy(() => import('../LostPetsCenter').then(m => ({ default: m.LostPetsCenter })));
const PaymentSuccess = lazy(() => import('../PaymentSuccess').then(m => ({ default: m.PaymentSuccess })));
const PublicPetDetail = lazy(() => import('../PublicPetDetail').then(m => ({ default: m.PublicPetDetail })));

interface PublicRouterProps {
    currentView: View;
    setView: (view: View) => void;
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
    donations: Donation[];
    selectedPost: BlogPost | null;
    setSelectedPost: (p: BlogPost | null) => void;
    handleStartChat: (p: PetProfile) => Promise<void>;
    setIsLoginModalOpen: (open: boolean) => void;
    isLoading: boolean;
    selectedPet: PetProfile | null;
    setSelectedPet: (pet: PetProfile | null) => void;
    onReportSighting?: (pet: PetProfile) => void;
    onViewPet?: (pet: PetProfile) => void;
}

export const PublicRouter: React.FC<PublicRouterProps> = ({
    currentView, setView, lostPets, petsForAdoption, donations, selectedPost, setSelectedPost, handleStartChat, setIsLoginModalOpen, isLoading,
    selectedPet, setSelectedPet, onReportSighting, onViewPet
}) => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>}>
            {(() => {
                switch (currentView) {
                    case 'pressKit': return <PressKit goBack={() => setView('home')} />;
                    case 'donors': return <Donors goBack={() => setView('home')} donations={donations} />;
                    case 'blog': return <Blog setView={setView} onSelectPost={(p) => { setSelectedPost(p); setView('blogPost'); }} />;
                    case 'blogPost': return selectedPost ? <BlogPostDetail post={selectedPost} onBack={() => setView('blog')} /> : null;
                    case 'adoptionCenter': return <AdoptionCenter petsForAdoption={petsForAdoption} onInquire={handleStartChat} onViewPet={onViewPet!} goBack={() => setView('home')} currentUser={null} isLoading={isLoading} />;
                    case 'lostPetsCenter': return <LostPetsCenter lostPets={lostPets} onContactOwner={handleStartChat} onViewPet={onViewPet!} onOpenScanner={() => setView('find')} goBack={() => setView('home')} currentUser={null} isLoading={isLoading} />;
                    case 'paymentSuccess': return <PaymentSuccess setView={setView} />;
                    case 'publicPetDetail': {
                        const petToShow = selectedPet || (window.location.pathname.startsWith('/pet/') ? [...lostPets, ...petsForAdoption].find(p => p.id === window.location.pathname.split('/')[2]) : null);
                        if (!petToShow) return null;
                        return <PublicPetDetail pet={petToShow} goBack={() => setView(petToShow.status === 'forAdoption' ? 'adoptionCenter' : 'lostPetsCenter')} onContactOwner={handleStartChat} onReportSighting={onReportSighting} currentUser={null} />;
                    }
                    default: return <Home setView={setView} openLogin={() => setIsLoginModalOpen(true)} currentUser={null} lostPets={lostPets} petsForAdoption={petsForAdoption} onContactOwner={handleStartChat} />;
                }
            })()}
        </Suspense>
    );
};
