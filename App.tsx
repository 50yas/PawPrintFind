import React, { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { View, User, PetProfile, VetClinic, Appointment, ChatSession, Geolocation, UserRole, Donation, BlogPost } from './types';

// Standard Components
import { Navbar } from './components/Navbar';
import { AdminUplink } from './components/AdminUplink';
import { NotificationToast } from './components/NotificationToast';
import { LiveAssistantFAB } from './components/LiveAssistantFAB';
import { AIHealthCheckModal } from './components/AIHealthCheckModal';
import { MobileNavigation } from './components/MobileNavigation';
import { dbService } from './services/firebase';
import { LoadingScreen } from './components/LoadingScreen';
import { BiometricBackground } from './components/BiometricBackground';
import { Footer } from './components/Footer';
import { SecureChatModal } from './components/SecureChatModal';
import { BlogPostDetail } from './components/BlogPostDetail';
import { Auth } from './components/Auth';

// Modular Routers
import { AdminRouter } from './components/routers/AdminRouter';
import { VetRouter } from './components/routers/VetRouter';
import { ShelterRouter } from './components/routers/ShelterRouter';
import { UserRouter } from './components/routers/UserRouter';
import { PublicRouter } from './components/routers/PublicRouter';

import { useAppState } from './hooks/useAppState';
import { useAuthSync } from './hooks/useAuthSync';
import { useSnackbar } from './contexts/SnackbarContext';
import { useTranslations } from './hooks/useTranslations';
import { generateAdoptionInquiry } from './src/utils/templateUtils';

const DevMarquee = () => {
    const devText = "DEV MODE: DEVELOPMENT IN PROGRESS • SVILUPPO IN CORSO • EN DESARROLLO • EN DÉVELOPPEMENT • ENTWICKLUNG LÄUFT • 正在开发中 • قيد التطوير • ÎN DEZVOLTARE •";

    return (
        <div className="fixed top-0 left-0 w-full h-8 overflow-hidden bg-yellow-400 border-b-2 border-black shadow-lg select-none flex items-center shrink-0 z-[250]">
            <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 20px, transparent 20px, transparent 40px)' }}></div>
            <div className="flex animate-marquee whitespace-nowrap items-center h-full relative z-10">
                <span className="text-[13px] font-black text-black px-4 uppercase tracking-normal drop-shadow-sm">{devText}</span>
                <span className="text-[13px] font-black text-black px-4 uppercase tracking-normal drop-shadow-sm">{devText}</span>
                <span className="text-[13px] font-black text-black px-4 uppercase tracking-normal drop-shadow-sm">{devText}</span>
                <span className="text-[13px] font-black text-black px-4 uppercase tracking-normal drop-shadow-sm">{devText}</span>
            </div>
        </div>
    );
};

export default function App() {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [showAdminInit, setShowAdminInit] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        // Detect Brave to apply specific rendering fallbacks
        const checkBrave = async () => {
            if ((navigator as any).brave && await (navigator as any).brave.isBrave()) {
                document.documentElement.classList.add('is-brave');
            }
        };
        checkBrave();
    }, []);

    const { addSnackbar } = useSnackbar();
    const { t } = useTranslations();
    const { currentUser, setCurrentUser } = useAuthSync(currentView, setCurrentView, setIsLoginModalOpen);
    const {
        allPets, vetClinics, donations, appointments, chatSessions, allUsers, isLoading,
        handleRefreshAdminData, setAllPets
    } = useAppState(currentUser, currentView);

    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
    const [viewingPatient, setViewingPatient] = useState<PetProfile | null>(null);
    const [petToLink, setPetToLink] = useState<PetProfile | null>(null);
    const [healthCheckingPet, setHealthCheckingPet] = useState<PetProfile | null>(null);

    const lostPets = allPets.filter(p => p.isLost);
    const petsForAdoption = allPets.filter(p => p.status === 'forAdoption');

    useEffect(() => {
        setTimeout(() => setShowSplash(false), 2500);
    }, []);

    useEffect(() => {
        const handler = () => setIsLoginModalOpen(true);
        window.addEventListener('open_login_modal', handler);
        return () => window.removeEventListener('open_login_modal', handler);
    }, []);

    const handleLogout = async () => {
        await dbService.logout();
        setCurrentUser(null);
        setCurrentView('home');
        addSnackbar("Secure session closed.", 'info');
    };

    const handleRegisterPet = async (pet: PetProfile) => {
        try {
            console.log(`[App-Logic] Transmitting biometric data for ${pet.name}...`);
            await dbService.savePet(pet);
            addSnackbar(`Sync Successful: ${pet.name} is now protected.`, 'success');
            setEditingPet(null);
            
            // Redirect based on active protocol
            const nextView = currentUser?.activeRole === 'shelter' ? 'shelterDashboard' : 'dashboard';
            setCurrentView(nextView);
        } catch (err: any) { 
            console.error("App Register Error:", err);
            addSnackbar("Critical Sync Failure: " + (err.message || "Network Timeout"), 'error'); 
        }
    };

    const handleStartChat = async (pet: PetProfile) => {
        if (!currentUser) return;
        const sessionId = [pet.id, currentUser.uid].sort().join('_');
        
        // Check if session exists to determine if we should send initial message
        const existingSession = chatSessions.find(s => s.id === sessionId);
        const messages = existingSession?.messages || [];

        if (messages.length === 0 && pet.status === 'forAdoption') {
            const template = t('adoptionInquiryTemplate');
            const initialMessage = generateAdoptionInquiry(template, pet.name);
            messages.push({
                senderEmail: currentUser.email,
                text: initialMessage,
                timestamp: Date.now()
            });
        }

        const newSession: ChatSession = {
            id: sessionId, petId: pet.id, petName: pet.name, petPhotoUrl: pet.photos[0]?.url || '',
            ownerEmail: pet.ownerEmail || '', finderEmail: currentUser.email, messages: messages
        };
        await dbService.saveChatSession(newSession);
        setActiveChatSession(newSession);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') setShowAdminInit(true);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const renderView = () => {
        if (showAdminInit && currentUser) return <AdminUplink currentUser={currentUser} onClose={() => setShowAdminInit(false)} />;

        if (!currentUser) {
            return (
                <PublicRouter
                    currentView={currentView}
                    setView={setCurrentView}
                    lostPets={lostPets}
                    petsForAdoption={petsForAdoption}
                    donations={donations}
                    selectedPost={selectedPost}
                    setSelectedPost={setSelectedPost}
                    handleStartChat={handleStartChat}
                    setIsLoginModalOpen={setIsLoginModalOpen}
                    isLoading={isLoading}
                />
            );
        }

        if (currentUser.activeRole === 'super_admin') {
            if (currentView === 'blogPost' && selectedPost) {
                return <BlogPostDetail post={selectedPost} onBack={() => setCurrentView('dashboard')} />;
            }
            if (currentView === 'blogDetail' && selectedPost) {
                return <BlogPostDetail post={selectedPost} onBack={() => setCurrentView('dashboard')} />;
            }
            
            return (
                <AdminRouter
                    users={allUsers}
                    currentUser={currentUser}
                    allPets={allPets}
                    vetClinics={vetClinics}
                    donations={donations}
                    onDeleteUser={async (uid) => {
                        const targetUser = allUsers.find(u => u.uid === uid);
                        await dbService.deleteUser(uid);
                        await dbService.logAdminAction({
                            adminEmail: currentUser.email,
                            action: 'DELETE_USER',
                            targetId: uid,
                            details: `Deleted user ${targetUser?.email || 'unknown'}`
                        });
                        await handleRefreshAdminData();
                    }}
                    onLogout={handleLogout}
                    onRefresh={handleRefreshAdminData}
                    onViewPost={(post) => {
                        setSelectedPost(post);
                        setCurrentView('blogPost');
                    }}
                />
            );
        }

        if (currentUser.activeRole === 'vet') {
            return (
                <VetRouter
                    currentView={currentView}
                    setView={setCurrentView}
                    currentUser={currentUser}
                    allPets={allPets}
                    lostPets={lostPets}
                    petsForAdoption={petsForAdoption}
                    vetClinics={vetClinics}
                    donations={donations}
                    appointments={appointments}
                    viewingPatient={viewingPatient}
                    setViewingPatient={setViewingPatient}
                    selectedPost={selectedPost}
                    setSelectedPost={setSelectedPost}
                    handleStartChat={handleStartChat}
                    setIsLoginModalOpen={setIsLoginModalOpen}
                    isLoading={isLoading}
                />
            );
        }

        if (currentUser.activeRole === 'shelter') {
            return (
                <ShelterRouter
                    currentView={currentView}
                    setView={setCurrentView}
                    currentUser={currentUser}
                    allPets={allPets}
                    lostPets={lostPets}
                    petsForAdoption={petsForAdoption}
                    donations={donations}
                    chatSessions={chatSessions}
                    editingPet={editingPet}
                    setEditingPet={setEditingPet}
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

        return (
            <UserRouter
                currentView={currentView}
                setView={setCurrentView}
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
                isLoading={isLoading}
            />
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden pb-safe">
            {/* Fixed Marquee at the very top */}
            <DevMarquee />

            <Navbar
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onLoginClick={() => setIsLoginModalOpen(true)}
                onLogoutClick={handleLogout}
                setView={setCurrentView}
                className="!top-8"
            />

            <ErrorBoundary>
                <div className={`fixed inset-0 z-0 transition-all duration-1000 ${currentView !== 'home' ? 'opacity-40 blur-sm' : 'opacity-100'}`}><BiometricBackground /></div>
                {showSplash && <div className="fixed inset-0 z-[200]"><LoadingScreen /></div>}

                <div className={`relative z-10 flex-grow flex flex-col transition-opacity duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
                    {/* Main content padding adjusted to account for fixed marquee + fixed navbar */}
                    <main className="flex-grow pt-32 md:pt-40 pb-32 md:pb-24">
                        {renderView()}
                    </main>

                    <div className="pb-32 md:pb-0">
                        <Footer setView={setCurrentView} currentUser={currentUser} />
                    </div>
                </div>
            </ErrorBoundary>

            {/* Global UI Elements - Moved outside main wrapper for better z-index management and fixed positioning */}
            <MobileNavigation
                currentView={currentView}
                setView={setCurrentView}
                userRole={currentUser?.activeRole}
                onAssistantClick={() => setIsAssistantOpen(true)}
            />

            {isAssistantOpen && (
                <LiveAssistantFAB
                    currentUserRole={currentUser?.activeRole}
                    tools={{ navigateToView: (v) => { setCurrentView(v as View); setIsAssistantOpen(false); } }}
                    forceOpen={true}
                    onClose={() => setIsAssistantOpen(false)}
                />
            )}

            {activeChatSession && (
                <SecureChatModal
                    session={activeChatSession}
                    currentUser={currentUser!}
                    onClose={() => setActiveChatSession(null)}
                />
            )}

            {healthCheckingPet && (
                <AIHealthCheckModal
                    pet={healthCheckingPet}
                    onClose={() => setHealthCheckingPet(null)}
                    onComplete={(id, check) => dbService.savePet({ ...allPets.find(p => p.id === id)!, healthChecks: [...(allPets.find(p => p.id === id)!.healthChecks || []), check] })}
                    onBookAppointment={() => { setHealthCheckingPet(null); }}
                />
            )}

            {isLoginModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={() => setIsLoginModalOpen(false)}>
                    <div onClick={e => e.stopPropagation()} className="w-full max-w-md relative my-auto">
                        <Auth isFullScreen onClose={() => setIsLoginModalOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
