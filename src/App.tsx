import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { View, User, PetProfile, VetClinic, Appointment, ChatSession, Geolocation, UserRole, Donation, BlogPost } from './types';

// Core Services
import { dbService } from './services/firebase';

// Small, critical components (loaded immediately)
import { LoadingScreen } from './components/LoadingScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { OfflineBanner } from './components/OfflineBanner';
import { NotificationToast } from './components/NotificationToast';

// Lazy Loaded Components (reduce initial bundle)
const Navbar = lazy(() => import('./components/Navbar').then(m => ({ default: m.Navbar })));
const Footer = lazy(() => import('./components/Footer').then(m => ({ default: m.Footer })));
const MobileNavigation = lazy(() => import('./components/MobileNavigation').then(m => ({ default: m.MobileNavigation })));
const LiveAssistantFAB = lazy(() => import('./components/LiveAssistantFAB').then(m => ({ default: m.LiveAssistantFAB })));
const AIHealthCheckModal = lazy(() => import('./components/AIHealthCheckModal').then(m => ({ default: m.AIHealthCheckModal })));
const SecureChatModal = lazy(() => import('./components/SecureChatModal').then(m => ({ default: m.SecureChatModal })));
const BiometricBackground = lazy(() => import('./components/BiometricBackground').then(m => ({ default: m.BiometricBackground })));
const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const TutorialOverlay = lazy(() => import('./components/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));
const AppRouter = lazy(() => import('./components/AppRouter').then(m => ({ default: m.AppRouter })));

// UI Components
import { PageTransition } from './components/ui/PageTransition';

import { useAppState } from './hooks/useAppState';
import { useAuthSync } from './hooks/useAuthSync';
import { useSnackbar } from './contexts/SnackbarContext';
import { useTranslations } from './hooks/useTranslations';
import { generateAdoptionInquiry } from './utils/templateUtils';
import { useWebVitals } from './hooks/useWebVitals';
import { aiBridgeService } from './services/aiBridgeService';
import { adminService } from './services/adminService';

const DevMarquee = () => {
    const { t } = useTranslations();
    const devText = t('devModeMarquee');

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
    const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [showAdminInit, setShowAdminInit] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [predefinedFilters, setPredefinedFilters] = useState<any>(null);

    const { addSnackbar } = useSnackbar();
    const { t } = useTranslations();

    // Monitor Core Web Vitals (10% sampling in production)
    useWebVitals({
        sampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        enableLogging: true,
        enableAnalytics: import.meta.env.PROD
    });


    const handleTutorialClose = () => {
        setShowTutorial(false);
        localStorage.setItem('hasSeenTutorial', 'true');
    };
    const { currentUser, setCurrentUser } = useAuthSync(currentView, setCurrentView, setIsLoginModalOpen);
    const {
        allPets, vetClinics, donations, appointments, chatSessions, allUsers, isLoading,
        handleRefreshAdminData, setAllPets
    } = useAppState(currentUser, currentView);

    useEffect(() => {
        console.log("[App] State Update - View:", currentView, "SelectedPet:", selectedPet?.id);
    }, [currentView, selectedPet]);

    useEffect(() => {
        // 1. Detect Brave to apply specific rendering fallbacks (Once)
        const checkBrave = async () => {
            if ((navigator as any).brave && await (navigator as any).brave.isBrave()) {
                document.documentElement.classList.add('is-brave');
            }
        };
        checkBrave();
    }, []);

    useEffect(() => {
        // 2. Global Security & Quota Listeners (Once)
        const handleRateLimit = (e: any) => {
            addSnackbar(e.detail?.message || t('errors.dailyQuotaExceeded'), 'error');
        };
        const handleApiError = (e: any) => {
            addSnackbar(e.detail?.message || t('errors.apiConnectionFailed'), 'error');
        };

        window.addEventListener('pawprint_rate_limit', handleRateLimit);
        window.addEventListener('pawprint_api_error', handleApiError);

        return () => {
            window.removeEventListener('pawprint_rate_limit', handleRateLimit);
            window.removeEventListener('pawprint_api_error', handleApiError);
        };
    }, [addSnackbar, t]);

    useEffect(() => {
        // 3. Tutorial Logic (Dependent on auth/load state)
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (currentUser && !hasSeenTutorial && !isLoading && !showSplash) {
            const timer = setTimeout(() => setShowTutorial(true), 800);
            return () => clearTimeout(timer);
        }
    }, [currentUser, isLoading, showSplash]);

    // Enhanced Navigation with View Transitions
    const handleSetView = useCallback((newView: View) => {
        if ((document as any).startViewTransition) {
            (document as any).startViewTransition(() => {
                setCurrentView(newView);
            });
        } else {
            setCurrentView(newView);
        }
    }, []);

    // Deep-link handling for pets
    useEffect(() => {
        const handleLocationChange = (event?: PopStateEvent) => {
            const path = window.location.pathname;
            console.log("[Navigation] URL Change detected:", path);

            // Handle browser back/forward buttons
            if (event?.state?.view === 'publicPetDetail' && event.state.petId) {
                const pet = allPets.find(p => p.id === event.state.petId);
                if (pet) {
                    setSelectedPet(pet);
                    setCurrentView('publicPetDetail');
                    return;
                }
            }

            // URL-based view resolution
            if (path === '/payment-success') {
                setCurrentView('paymentSuccess');
            } else if (path.startsWith('/pet/') && allPets.length > 0) {
                const petId = path.split('/')[2];
                const pet = allPets.find(p => p.id === petId);
                if (pet) {
                    setSelectedPet(pet);
                    setCurrentView('publicPetDetail');
                } else {
                    setCurrentView('notFound');
                }
            } else if (path === '/donors') {
                setCurrentView('donors');
            } else if (path === '/blog') {
                setCurrentView('blog');
            } else if (path === '/press-kit') {
                setCurrentView('pressKit');
            } else if (path === '/adoption') {
                setCurrentView('adoptionCenter');
            } else if (path === '/lost-pets') {
                setCurrentView('lostPetsCenter');
            } else if (path === '/' || path === '') {
                // Root — keep current or go home
            } else {
                // Unknown route → 404
                setCurrentView('notFound');
            }
        };

        handleLocationChange(); // Initial check
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, [allPets]);

    const handleApplySearch = useCallback((filters: any) => {
        setPredefinedFilters(filters);
        handleSetView('adoptionCenter');
    }, [handleSetView]);

    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
    const [viewingPatient, setViewingPatient] = useState<PetProfile | null>(null);
    const [petToLink, setPetToLink] = useState<PetProfile | null>(null);
    const [healthCheckingPet, setHealthCheckingPet] = useState<PetProfile | null>(null);

    const [isAdminBrowsing, setIsAdminBrowsing] = useState(false);

    // Graceful initial load - show complete boot animation before revealing app
    useEffect(() => {
        if (!isLoading) {
            // Wait for boot sequence to complete (LoadingScreen runs for ~2.1s total)
            // This ensures all animations finish and everything is stable before revealing app
            // Prevents any "reload" perception by ensuring single, complete load
            const timer = setTimeout(() => setShowSplash(false), 1200);

            // AI Connectivity & Protocol Initialization
            const initAISystem = async () => {
                console.log("[AI Startup] Initializing Neural Protocols...");
                try {
                    // 1. Check System Metadata Initialization
                    const isInitialized = await adminService.isSystemInitialized();
                    if (!isInitialized) {
                        console.warn("[AI Startup] System not yet initialized. Setup required.");
                        // Only show snackbar if user is likely an admin or looking at home
                        if (currentUser?.activeRole === 'super_admin') {
                            addSnackbar("System Initialization Required. Use Ctrl+K to Uplink.", "info", 10000);
                        }
                    }

                    // 2. Fetch secure settings from Firestore
                    const settings = await aiBridgeService.init();
                    
                    if (!settings) {
                        console.warn("[AI Startup] No configuration found. System operating in restricted mode.");
                        return;
                    }

                    console.log(`[AI Startup] Active Provider: ${settings.provider.toUpperCase()}`);

                    // 3. Connectivity Watchdog (Backend check)
                    const { httpsCallable } = await import('firebase/functions');
                    const { functions } = await import('./services/firebase');
                    const smartSearch = httpsCallable(functions, 'smartSearch');
                    
                    // Lightweight ping to verify Backend Secrets are healthy
                    await smartSearch({ query: 'ping' });
                    console.log("[AI Startup] Backend Connectivity Verified.");

                } catch (error: any) {
                    if (error.code === 'functions/failed-precondition' || error.message?.includes("Secret") || error.message?.includes("API Key")) {
                        console.warn("[AI Watchdog] Connection Issue:", error.message);
                        addSnackbar("AI System Disconnected: Configuration Missing in Dashboard.", "error", 8000);
                    } else if (error.code === 'permission-denied') {
                        console.log("[AI Startup] Public access mode (Restricted Config).");
                    } else {
                        console.error("[AI Startup] Protocol initialization failed:", error);
                    }
                }
            };
            initAISystem();

            return () => clearTimeout(timer);
        }
    }, [isLoading, addSnackbar]);

    useEffect(() => {
        const handler = () => setIsLoginModalOpen(true);
        window.addEventListener('open_login_modal', handler);
        return () => window.removeEventListener('open_login_modal', handler);
    }, []);

    const handleLogout = async () => {
        await dbService.logout();
        setCurrentUser(null);
        setCurrentView('home');
        setIsAdminBrowsing(false);
        addSnackbar(t('secureSessionClosed'), 'info');
    };

    const handleRegisterPet = async (pet: PetProfile) => {
        try {
            console.log(`[App-Logic] Transmitting biometric data for ${pet.name}...`);
            await dbService.savePet(pet);
            addSnackbar(t('syncSuccessful', { name: pet.name }), 'success');
            setEditingPet(null);

            // Redirect based on active protocol
            const nextView = currentUser?.activeRole === 'shelter' ? 'shelterDashboard' : (currentUser?.activeRole === 'super_admin' ? 'adminDashboard' : 'dashboard');
            setCurrentView(nextView);
        } catch (err: any) {
            console.error("App Register Error:", err);
            addSnackbar(t('criticalSyncFailure') + (err.message || t('networkTimeout')), 'error');
        }
    };

    const handleStartChat = async (pet: PetProfile) => {
        if (!currentUser) {
            addSnackbar(t('loginToContactOwner'), 'info');
            setIsLoginModalOpen(true);
            return;
        }
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

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden pb-safe">
            {/* Fixed Marquee at the very top */}
            <DevMarquee />
            <OfflineBanner />

            {isAdminBrowsing && (
                <div className="fixed top-8 left-0 w-full z-[300] bg-primary/90 backdrop-blur-md border-b border-black/20 p-2 flex justify-between items-center px-6">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                        Admin Website Navigation Mode
                    </span>
                    <button
                        onClick={() => setIsAdminBrowsing(false)}
                        className="bg-black text-white text-[10px] font-black px-4 py-1.5 rounded-full hover:scale-105 transition-all uppercase tracking-widest"
                    >
                        Return to Command Core
                    </button>
                </div>
            )}

            <Suspense fallback={<div className="h-16 bg-background/80 backdrop-blur-sm" />}>
                <Navbar
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                    onLoginClick={() => setIsLoginModalOpen(true)}
                    onLogoutClick={handleLogout}
                    setView={handleSetView}
                    className={isAdminBrowsing ? "!top-20" : "!top-8"}
                />
            </Suspense>

            <ErrorBoundary>
                {/* Only load Three.js background on home view for performance */}
                {currentView === 'home' ? (
                    <div className="fixed inset-0 z-0 transition-all duration-1000 opacity-100">
                        <Suspense fallback={<div className="w-full h-full bg-background bg-gradient-radial from-cyan-950/20 via-background to-background" />}>
                            <BiometricBackground />
                        </Suspense>
                    </div>
                ) : (
                    <div className="fixed inset-0 z-0 bg-gradient-radial from-cyan-950/20 via-background to-background opacity-40 blur-sm" />
                )}
                {showSplash && <div className="fixed inset-0 z-[200]"><LoadingScreen /></div>}

                <div className={`relative z-10 flex-grow flex flex-col transition-opacity duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
                    {/* Main content padding: top for fixed navbar/marquee, bottom for mobile bottom nav */}
                    <main
                        className="flex-grow pt-32 md:pt-40 md:pb-24"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' } as React.CSSProperties}
                    >
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner />
                            </div>
                        }>
                            <PageTransition transitionKey={currentView} type="fade-scale" duration={300}>
                                <AppRouter
                                    currentView={currentView}
                                    setView={setCurrentView}
                                    currentUser={currentUser}
                                    allUsers={allUsers}
                                    allPets={allPets}
                                    vetClinics={vetClinics}
                                    donations={donations}
                                    appointments={appointments}
                                    chatSessions={chatSessions}
                                    isLoading={isLoading}
                                    showAdminInit={showAdminInit}
                                    setShowAdminInit={setShowAdminInit}
                                    isAdminBrowsing={isAdminBrowsing}
                                    setIsAdminBrowsing={setIsAdminBrowsing}
                                    selectedPost={selectedPost}
                                    setSelectedPost={setSelectedPost}
                                    editingPet={editingPet}
                                    setEditingPet={setEditingPet}
                                    viewingPatient={viewingPatient}
                                    setViewingPatient={setViewingPatient}
                                    selectedPet={selectedPet}
                                    setSelectedPet={setSelectedPet}
                                    petToLink={petToLink}
                                    setPetToLink={setPetToLink}
                                    setHealthCheckingPet={setHealthCheckingPet}
                                    predefinedFilters={predefinedFilters}
                                    handleApplySearch={handleApplySearch}
                                    handleLogout={handleLogout}
                                    handleRegisterPet={handleRegisterPet}
                                    handleStartChat={handleStartChat}
                                    handleRefreshAdminData={handleRefreshAdminData}
                                    setIsLoginModalOpen={setIsLoginModalOpen}
                                    setActiveChatSession={setActiveChatSession}
                                    onDeleteUser={async (uid) => {
                                        const targetUser = allUsers.find(u => u.uid === uid);
                                        await dbService.deleteUser(uid);
                                        await dbService.logAdminAction({
                                            adminEmail: currentUser!.email,
                                            action: 'DELETE_USER',
                                            targetId: uid,
                                            details: `Deleted user ${targetUser?.email || 'unknown'}`
                                        });
                                        await handleRefreshAdminData();
                                    }}
                                    onViewPet={(pet) => {
                                        console.log("[Navigation] Opening pet detail:", pet.id);
                                        setSelectedPet(pet);
                                        setCurrentView('publicPetDetail');
                                        // Update URL without reloading for sharing compatibility
                                        window.history.pushState({ view: 'publicPetDetail', petId: pet.id }, '', `/pet/${pet.id}`);
                                    }}
                                    onReportSighting={(pet) => {
                                        addSnackbar(t('reportSightingFeatureComingSoon'), 'info');
                                    }}
                                    setCurrentUser={setCurrentUser}
                                />
                            </PageTransition>
                        </Suspense>
                    </main>

                    <div className="pb-32 md:pb-0">
                        <Suspense fallback={<div className="h-32 bg-background" />}>
                            <Footer setView={handleSetView} currentUser={currentUser} />
                        </Suspense>
                    </div>
                </div>
            </ErrorBoundary>

            {/* Global UI Elements - Moved outside main wrapper for better z-index management and fixed positioning */}
            <Suspense fallback={null}>
                <MobileNavigation
                    currentView={currentView}
                    setView={handleSetView}
                    userRole={currentUser?.activeRole}
                    onAssistantClick={() => setIsAssistantOpen(true)}
                />
            </Suspense>

            <Suspense fallback={null}>
                <LiveAssistantFAB
                    currentUserRole={currentUser?.activeRole}
                    tools={{ navigateToView: (v) => { setCurrentView(v as View); setIsAssistantOpen(false); } }}
                    forceOpen={isAssistantOpen}
                    onClose={() => setIsAssistantOpen(false)}
                />
            </Suspense>

            {activeChatSession && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoadingSpinner /></div>}>
                    <SecureChatModal
                        session={activeChatSession}
                        currentUser={currentUser!}
                        onClose={() => setActiveChatSession(null)}
                    />
                </Suspense>
            )}

            {healthCheckingPet && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoadingSpinner /></div>}>
                    <AIHealthCheckModal
                        pet={healthCheckingPet}
                        onClose={() => setHealthCheckingPet(null)}
                        onComplete={(id, check) => dbService.savePet({ ...allPets.find(p => p.id === id)!, healthChecks: [...(allPets.find(p => p.id === id)!.healthChecks || []), check] })}
                        onBookAppointment={() => { setHealthCheckingPet(null); }}
                    />
                </Suspense>
            )}

            {isLoginModalOpen && (
                <div className="fixed inset-0 z-[5000] animate-fade-in overflow-hidden bg-background">
                    <Suspense fallback={<LoadingScreen />}>
                        <Auth isFullScreen onClose={() => setIsLoginModalOpen(false)} />
                    </Suspense>
                </div>
            )}

            {showTutorial && (
                <Suspense fallback={null}>
                    <TutorialOverlay onClose={handleTutorialClose} userRole={currentUser?.activeRole} />
                </Suspense>
            )}
        </div>
    );
}
