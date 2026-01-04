
import React from 'react';
import { Home } from '../Home';
import { PressKit } from '../PressKit';
import { Donors } from '../Donors';
import { Blog } from '../Blog';
import { BlogPostDetail } from '../BlogPostDetail';
import { AdoptionCenter } from '../AdoptionCenter';
import { PaymentSuccess } from '../PaymentSuccess';
import { View, PetProfile, Donation, BlogPost } from '../../types';

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
    isLoading?: boolean;
}

export const PublicRouter: React.FC<PublicRouterProps> = ({
    currentView, setView, lostPets, petsForAdoption, donations, selectedPost, setSelectedPost, handleStartChat, setIsLoginModalOpen, isLoading
}) => {
    switch (currentView) {
        case 'pressKit': return <PressKit goBack={() => setView('home')} />;
        case 'donors': return <Donors goBack={() => setView('home')} donations={donations} />;
        case 'blog': return <Blog setView={setView} onSelectPost={(p) => { setSelectedPost(p); setView('blogPost'); }} />;
        case 'blogPost': return selectedPost ? <BlogPostDetail post={selectedPost} onBack={() => setView('blog')} /> : null;
        case 'adoptionCenter': return <AdoptionCenter petsForAdoption={petsForAdoption} onInquire={handleStartChat} goBack={() => setView('home')} currentUser={null} isLoading={isLoading} />;
        case 'paymentSuccess': return <PaymentSuccess setView={setView} />;
        default: return <Home setView={setView} openLogin={() => setIsLoginModalOpen(true)} currentUser={null} lostPets={lostPets} petsForAdoption={petsForAdoption} />;
    }
};
