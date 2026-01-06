import React, { useState } from 'react';
import { View, UserRole } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Language } from '../contexts/LanguageContext';
import DarkModeToggle from './DarkModeToggle';
import { NavigationBottomSheet } from './NavigationBottomSheet';

interface MobileNavigationProps {
    currentView: View;
    setView: (view: View) => void;
    userRole?: UserRole;
    onAssistantClick: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentView, setView, userRole, onAssistantClick }) => {
    const { t, locale, setLocale } = useTranslations();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper for active class
    const isActive = (view: View) => currentView === view ? 'text-primary scale-110' : 'text-slate-400 hover:text-white';

    // Role based default dashboard
    const getDashboardView = () => {
        if (userRole === 'vet') return 'vetDashboard';
        if (userRole === 'shelter') return 'shelterDashboard';
        if (userRole === 'super_admin') return 'adminDashboard';
        return 'dashboard';
    };

    const dashboardView = getDashboardView();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'it', name: 'Italiano' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'zh', name: '中文' },
        { code: 'ar', name: 'العربية' },
        { code: 'ro', name: 'Română' }
    ];

    const handleAuthAction = () => {
        if (userRole) {
            setView(dashboardView);
        } else {
            window.dispatchEvent(new CustomEvent('open_login_modal'));
        }
    };

    return (
        <div 
            className="fixed bottom-0 left-0 right-0 w-full bg-slate-950/95 backdrop-blur-3xl border-t border-white/10 z-[9999] md:hidden no-print shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-safe"
            style={{ 
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                zIndex: 9999,
                WebkitTransform: 'translate3d(0,0,0)',
                transform: 'translate3d(0,0,0)',
                height: 'auto'
            }}
        >
            {/* Vertical Language Selector Overlay */}
            {showLangMenu && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[-1]" onClick={() => setShowLangMenu(false)} aria-hidden="true"></div>
                    <div className="absolute bottom-[85px] right-4 w-48 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 animate-slide-up-mobile shadow-2xl flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="px-3 py-2 border-b border-white/10 mb-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Select Language</span>
                        </div>
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { setLocale(lang.code as Language); setShowLangMenu(false); }}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${locale === lang.code ? 'bg-primary/20 text-white border border-primary/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
                            >
                                <span>{lang.name}</span>
                                {locale === lang.code && <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#22d3ee]"></span>}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <NavigationBottomSheet 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                setView={setView} 
            />

            <div className="flex justify-around items-center px-2 h-[75px] relative">
                {/* 1. Home */}
                <button 
                    onClick={() => setView('home')} 
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('home')}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-tighter">{t('homeButton')}</span>
                </button>

                {/* 2. More / Grid */}
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isMenuOpen ? 'text-primary' : 'text-slate-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-tighter">{t('moreButton') || 'MORE'}</span>
                </button>

                {/* 3. CENTER FAB - AI Assistant */}
                <div className="flex justify-center -mt-8 relative z-10">
                    <button 
                        onClick={onAssistantClick}
                        className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(45,212,191,0.5)] relative overflow-hidden active:scale-90 transition-all group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-20 group-hover:opacity-40 animate-pulse"></div>
                        <div className="relative z-10 p-3">
                             <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white fill-current">
                                <path d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/>
                                <path d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/>
                                <path d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/>
                                <path d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/>
                                <path d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/>
                             </svg>
                        </div>
                    </button>
                </div>

                {/* 4. Dashboard / Auth */}
                <button 
                    onClick={handleAuthAction} 
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${userRole ? isActive(dashboardView) : 'text-slate-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-tighter">{userRole ? 'DASH' : 'LOGIN'}</span>
                </button>

                {/* 5. Language / Theme */}
                <div className="flex flex-col items-center gap-1">
                    <button 
                        onClick={() => setShowLangMenu(!showLangMenu)} 
                        className={`transition-all duration-300 ${showLangMenu ? 'text-primary' : 'text-slate-400'}`}
                    >
                        <span className="text-[10px] font-black">{locale.toUpperCase()}</span>
                    </button>
                    <DarkModeToggle />
                </div>
            </div>
        </div>
    );
};