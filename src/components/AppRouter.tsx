import React, { Suspense, lazy } from 'react';
import { View, User, PetProfile, VetClinic, Appointment, ChatSession, BlogPost, Donation } from '../types';

// Lazy load routers
const AdminRouter = lazy(() => import('./routers/AdminRouter').then(m => ({ default: m.AdminRouter })));
const VetRouter = lazy(() => import('./routers/VetRouter').then(m => ({ default: m.VetRouter })));
const ShelterRouter = lazy(() => import('./routers/ShelterRouter').then(m => ({ default: m.ShelterRouter })));
const UserRouter = lazy(() => import('./routers/UserRouter').then(m => ({ default: m.UserRouter })));
const PublicRouter = lazy(() => import('./routers/PublicRouter').then(m => ({ default: m.PublicRouter })));
const AdminUplink = lazy(() => import('./AdminUplink').then(m => ({ default: m.AdminUplink })));
const BlogPostDetail = lazy(() => import('./BlogPostDetail').then(m => ({ default: m.BlogPostDetail })));
const LostPetsCenter = lazy(() => import('./LostPetsCenter').then(m => ({ default: m.LostPetsCenter })));
const PublicPetDetail = lazy(() => import('./PublicPetDetail').then(m => ({ default: m.PublicPetDetail })));
const PaymentSuccess = lazy(() => import('./PaymentSuccess').then(m => ({ default: m.PaymentSuccess })));
const NotFound = lazy(() => import('./NotFound').then(m => ({ default: m.NotFound })));
const EcosystemHub = lazy(() => import('./EcosystemHub').then(m => ({ default: m.EcosystemHub })));

interface AppRouterProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User | null;
    allUsers: User[];
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    appointments: Appointment[];
    chatSessions: ChatSession[];
    isLoading: boolean;
    showAdminInit: boolean;
    setShowAdminInit: (show: boolean) => void;
    isAdminBrowsing: boolean;
    setIsAdminBrowsing: (is: boolean) => void;
    selectedPost: BlogPost | null;
    setSelectedPost: (post: BlogPost | null) => void;
    editingPet: PetProfile | null;
    setEditingPet: (pet: PetProfile | null) => void;
    viewingPatient: PetProfile | null;
    setViewingPatient: (pet: PetProfile | null) => void;
    selectedPet: PetProfile | null;
    setSelectedPet: (pet: PetProfile | null) => void;
    petToLink: PetProfile | null;
    setPetToLink: (pet: PetProfile | null) => void;
    setHealthCheckingPet: (pet: PetProfile | null) => void;
    predefinedFilters: any;
    handleApplySearch: (filters: any) => void;
    handleLogout: () => void;
    handleRegisterPet: (pet: PetProfile) => Promise<void>;
    handleStartChat: (pet: PetProfile) => Promise<void>;
    handleRefreshAdminData: () => Promise<void>;
    setIsLoginModalOpen: (open: boolean) => void;
    setActiveChatSession: (session: ChatSession | null) => void;
    onDeleteUser: (uid: string) => Promise<void>;
    onViewPet: (pet: PetProfile) => void;
    onReportSighting?: (pet: PetProfile) => void;
    setCurrentUser?: (u: User) => void;
}

export const AppRouter: React.FC<AppRouterProps> = (props) => {
    const {
        currentView, setView, currentUser, allUsers, allPets, vetClinics, donations,
        appointments, chatSessions, isLoading, showAdminInit, setShowAdminInit,
        isAdminBrowsing, setIsAdminBrowsing, selectedPost, setSelectedPost,
        editingPet, setEditingPet, viewingPatient, setViewingPatient,
        selectedPet, setSelectedPet,
        petToLink, setPetToLink, setHealthCheckingPet, predefinedFilters,
        handleApplySearch, handleLogout, handleRegisterPet, handleStartChat,
        handleRefreshAdminData, setIsLoginModalOpen, setActiveChatSession, onDeleteUser,
        onViewPet, onReportSighting, setCurrentUser
    } = props;

    const lostPets = allPets.filter(p => p.isLost);
    const petsForAdoption = allPets.filter(p => p.status === 'forAdoption');

    if (currentView === 'paymentSuccess') {
        return <PaymentSuccess setView={setView} />;
    }

    if (currentView === 'notFound') {
        return <NotFound setView={setView} />;
    }

    if (currentView === 'ecosystemHub') {
        return <EcosystemHub onNavigate={setView} />;
    }

    if (currentView === 'publicPetDetail') {
        const petToShow = selectedPet || (window.location.pathname.startsWith('/pet/') ? allPets.find(p => p.id === window.location.pathname.split('/')[2]) : null);

        if (petToShow) {
            return (
                <PublicPetDetail
                    pet={petToShow}
                    goBack={() => setView(petToShow.status === 'forAdoption' ? 'adoptionCenter' : 'lostPetsCenter')}
                    onContactOwner={handleStartChat}
                    onReportSighting={onReportSighting}
                    currentUser={currentUser}
                />
            );
        } else {
            return <NotFound setView={setView} />;
        }
    }

    if (showAdminInit) return <AdminUplink currentUser={currentUser || { uid: 'mock', email: 'mock@test.com', roles: ['super_admin'], activeRole: 'super_admin' } as any} onClose={() => setShowAdminInit(false)} />;

    if (currentView === 'lostPetsCenter') {
        return <LostPetsCenter lostPets={allPets.filter(p => p.isLost)} onContactOwner={handleStartChat} onViewPet={onViewPet} onOpenScanner={() => setView('find')} goBack={() => setView('home')} currentUser={currentUser} isLoading={isLoading} />;
    }

    if (!currentUser) {
        return (
            <PublicRouter
                currentView={currentView}
                setView={setView}
                lostPets={lostPets}
                petsForAdoption={petsForAdoption}
                donations={donations}
                selectedPost={selectedPost}
                setSelectedPost={setSelectedPost}
                handleStartChat={handleStartChat}
                setIsLoginModalOpen={setIsLoginModalOpen}
                isLoading={isLoading}
                selectedPet={selectedPet}
                setSelectedPet={setSelectedPet}
                onViewPet={onViewPet}
                onReportSighting={onReportSighting}
            />
        );
    }

    if (currentUser.activeRole === 'super_admin' && !isAdminBrowsing) {
        if (currentView === 'blogPost' || currentView === 'blogDetail') {
            return selectedPost ? <BlogPostDetail post={selectedPost} onBack={() => setView('dashboard')} /> : null;
        }

        return (
            <AdminRouter
                users={allUsers}
                currentUser={currentUser}
                allPets={allPets}
                vetClinics={vetClinics}
                donations={donations}
                onDeleteUser={onDeleteUser}
                onLogout={handleLogout}
                onRefresh={handleRefreshAdminData}
                onViewPost={(post) => {
                    setSelectedPost(post);
                    setView('blogPost');
                }}
                onBrowseSite={() => setIsAdminBrowsing(true)}
                onViewPet={onViewPet}
            />
        );
    }

    if (currentUser.activeRole === 'super_admin' && isAdminBrowsing) {
        return (
            <UserRouter
                currentView={currentView}
                setView={setView}
                currentUser={currentUser}
                allPets={allPets}
                vetClinics={vetClinics}
                appointments={appointments}
                chatSessions={chatSessions}
                lostPets={lostPets}
                petsForAdoption={petsForAdoption}
                donations={donations}
                allUsers={allUsers}
                editingPet={editingPet}
                setEditingPet={setEditingPet}
                petToLink={petToLink}
                setPetToLink={setPetToLink}
                selectedPost={selectedPost}
                setSelectedPost={setSelectedPost}
                handleRegisterPet={handleRegisterPet}
                handleStartChat={handleStartChat}
                handleLogout={handleLogout}
                setIsLoginModalOpen={setIsLoginModalOpen}
                setHealthCheckingPet={setHealthCheckingPet}
                onApplySearch={handleApplySearch}
                predefinedFilters={predefinedFilters}
                isLoading={isLoading}
                selectedPet={selectedPet}
                setSelectedPet={setSelectedPet}
                onViewPet={onViewPet}
                onReportSighting={onReportSighting}
                setCurrentUser={setCurrentUser}
            />
        );
    }

    if (currentUser.activeRole === 'vet') {
        return (
            <VetRouter
                currentView={currentView}
                setView={setView}
                currentUser={currentUser}
                allPets={allPets}
                lostPets={lostPets}
                petsForAdoption={petsForAdoption}
                vetClinics={vetClinics}
                donations={donations}
                appointments={appointments}
                viewingPatient={viewingPatient}
                setViewingPatient={setViewingPatient}
                selectedPet={selectedPet}
                setSelectedPet={setSelectedPet}
                onViewPet={onViewPet}
                onReportSighting={onReportSighting}
                selectedPost={selectedPost}
                setSelectedPost={setSelectedPost}
                handleStartChat={handleStartChat}
                setIsLoginModalOpen={setIsLoginModalOpen}
                isLoading={isLoading}
                setCurrentUser={setCurrentUser}
            />
        );
    }

    if (currentUser.activeRole === 'shelter') {
        return (
            <ShelterRouter
                currentView={currentView}
                setView={setView}
                currentUser={currentUser}
                allPets={allPets}
                lostPets={lostPets}
                petsForAdoption={petsForAdoption}
                donations={donations}
                chatSessions={chatSessions}
                editingPet={editingPet}
                setEditingPet={setEditingPet}
                selectedPet={selectedPet}
                setSelectedPet={setSelectedPet}
                onViewPet={onViewPet}
                onReportSighting={onReportSighting}
                selectedPost={selectedPost}
                setSelectedPost={setSelectedPost}
                handleRegisterPet={handleRegisterPet}
                handleStartChat={handleStartChat}
                onOpenChat={(id) => setActiveChatSession(chatSessions.find(s => s.id === id) || null)}
                setIsLoginModalOpen={setIsLoginModalOpen}
                isLoading={isLoading}
            />
        );
    }

    // Default UserRouter
    return (
        <UserRouter
            currentView={currentView}
            setView={setView}
            currentUser={currentUser}
            allPets={allPets}
            vetClinics={vetClinics}
            appointments={appointments}
            chatSessions={chatSessions}
            lostPets={lostPets}
            petsForAdoption={petsForAdoption}
            donations={donations}
            allUsers={allUsers}
            editingPet={editingPet}
            setEditingPet={setEditingPet}
            petToLink={petToLink}
            setPetToLink={setPetToLink}
            selectedPost={selectedPost}
            setSelectedPost={setSelectedPost}
            handleRegisterPet={handleRegisterPet}
            handleStartChat={handleStartChat}
            handleLogout={handleLogout}
            setIsLoginModalOpen={setIsLoginModalOpen}
            setHealthCheckingPet={setHealthCheckingPet}
            onApplySearch={handleApplySearch}
            predefinedFilters={predefinedFilters}
            isLoading={isLoading}
            selectedPet={selectedPet}
            setSelectedPet={setSelectedPet}
            onViewPet={onViewPet}
            onReportSighting={onReportSighting}
            setCurrentUser={setCurrentUser}
        />
    );
};
