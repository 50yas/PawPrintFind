
import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { View, UserRole, User } from '../types';
import { Modal } from './Modal';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { useVersion } from './VersionDisplay';

interface FooterProps {
    setView?: (view: View) => void;
    onLogin?: (email: string, role: UserRole) => void;
    currentUser?: User | null;
}

const SocialLink: React.FC<{ href: string; icon: React.ReactNode; label: string; colorClass: string }> = ({ href, icon, label, colorClass }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label={label}
        className={`p-3 rounded-full bg-white/5 border border-white/10 transition-all duration-300 hover:scale-110 hover:bg-white/10 ${colorClass} group scan-hover`}
    >
        {icon}
    </a>
);

export const Footer: React.FC<FooterProps> = ({ setView, currentUser }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const version = useVersion();
    
    // Admin Modal State
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'setup'>('login');
    const [setupStep, setSetupStep] = useState<'key' | 'register'>('key');
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset modal states when opening/closing
    useEffect(() => {
        if (!showAdminModal) {
            setAuthMode('login');
            setSetupStep('key');
            setEmail('');
            setPassword('');
            setSecretKey('');
            setError('');
        }
    }, [showAdminModal]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await dbService.loginWithEmail(email, password);
            setShowAdminModal(false);
        } catch (err: any) {
            console.error(err);
            setError(t('invalidAdminCredentials'));
        }
        setIsLoading(false);
    };

    const handleSecretKeySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await dbService.verifyAdminSecret(secretKey)) {
            setSetupStep('register');
            setError('');
        } else {
            setError(t('invalidSecurityKey'));
        }
    };

    const handleInitializeAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await dbService.registerUser(email, password, ['super_admin'], {
                isVerified: true,
                points: 1000000,
                badges: ['System Architect', 'Root']
            });
            await dbService.initializeSystem();
            setShowAdminModal(false);
            addSnackbar(t('superAdminInitializedSuccess'), 'success');
        } catch (err: any) {
            setError(t('initializationFailed', { error: err.message }));
        }
        setIsLoading(false);
    };
    
    return (
        <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-xl mt-20 hud-grid-bg">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <div className="relative w-8 h-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg blur opacity-50"></div>
                                <div className="relative w-full h-full bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 p-1.5">
                                    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="text-white fill-current w-full h-full">
                                        <g transform="translate(0, 20) scale(0.9) translate(28, 0)">
                                            <path d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/>
                                            <path d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/>
                                            <path d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/>
                                            <path d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/>
                                            <path d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/>
                                        </g>
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white font-mono-tech tracking-tight">
                                PAW PRINT <span className="text-primary">FIND</span>
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                            {t('footerText').replace('Paw Print - ', '')}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4">
                            {setView && (
                                <>
                                    <button onClick={() => setView('blog')} className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider">{t('blogButton')}</button>
                                    <button onClick={() => setView('community')} className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider">{t('communityHubButton')}</button>
                                    <button onClick={() => setView('adoptionCenter')} className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider">{t('adoptionLink')}</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <SocialLink 
                            href="https://github.com/50yas" 
                            label="GitHub" 
                            colorClass="hover:text-white hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            }
                        />
                        <SocialLink 
                            href="https://www.linkedin.com/in/50yas/" 
                            label="LinkedIn" 
                            colorClass="hover:text-blue-400 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            }
                        />
                        <SocialLink 
                            href="https://instagram.com/50yas" 
                            label="Instagram" 
                            colorClass="hover:text-pink-500 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            }
                        />
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400/60">
                    <div className="flex gap-4 items-center flex-wrap justify-center md:justify-start">
                        <p>&copy; {new Date().getFullYear()} Paw Print Open Source.</p>
                        <span className="hidden md:inline text-slate-600">•</span>
                        <p className="font-mono text-[10px] text-slate-500 hover:text-primary transition-colors cursor-default">
                            {version.version} <span className="text-slate-600">Build #{version.buildNumber}</span>
                        </p>
                        <button 
                            onClick={() => {
                                if (currentUser?.activeRole === 'super_admin' && setView) {
                                    setView('adminDashboard');
                                } else {
                                    setShowAdminModal(true);
                                }
                            }} 
                            className="opacity-30 hover:opacity-100 transition-opacity text-white"
                            aria-label="Admin Access"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </button>
                        
                        {setView && (
                            <button onClick={() => setView('pressKit')} className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">{t('pressKit')}</button>
                        )}
                    </div>
                    <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                        {t('poweredByGemini')} 
                        <span className="w-1 h-1 rounded-full bg-blue-500 mx-1"></span>
                        React • Firebase • AI
                    </p>
                </div>
            </div>

            <Modal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} title={authMode === 'login' ? t('adminConsole') : t('systemInitialization')}>
                <div className="space-y-6">
                    <div className={`p-4 rounded-xl text-center border transition-colors ${authMode === 'setup' ? 'bg-primary/10 border-primary/30' : 'bg-red-900/10 border-red-500/20'}`}>
                        <p className={`${authMode === 'setup' ? 'text-primary' : 'text-red-500'} text-xs font-bold uppercase tracking-widest`}>
                            {authMode === 'setup' ? t('initializingSystem') : t('restrictedAccess')}
                        </p>
                        <p className="text-slate-400 text-[10px] mt-1 uppercase">
                            {authMode === 'setup' ? t('establishingRoot') : t('authorizedPersonnelOnly')}
                        </p>
                    </div>

                    {authMode === 'login' ? (
                        <div className="space-y-6 animate-fade-in">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('emailLabel')}</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="input-base"
                                        placeholder={t('adminEmailPlaceholder')}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('passwordLabel')}</label>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="input-base"
                                        placeholder={t('passwordPlaceholder')}
                                        required 
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-100/10 border border-red-500/30 rounded flex items-center gap-2 animate-bounce">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        <p className="text-xs text-red-500 font-bold">{error}</p>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full btn btn-primary py-3 flex justify-center items-center font-bold tracking-wide"
                                >
                                    {isLoading ? <LoadingSpinner /> : t('authenticate')}
                                </button>
                            </form>
                            
                            <div className="pt-4 border-t border-white/5 flex flex-col items-center">
                                <p className="text-[10px] text-slate-400 mb-2 font-mono uppercase tracking-widest">{t('criticalRecovery')}</p>
                                <button 
                                    onClick={() => setAuthMode('setup')}
                                    className="text-primary text-xs font-bold hover:underline uppercase tracking-tighter"
                                >
                                    {t('initializeResetSystem')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-slide-in-right">
                            {setupStep === 'key' ? (
                                <form onSubmit={handleSecretKeySubmit} className="space-y-4">
                                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                                        Enter the Private Security Key to unlock the system root initialization flow.
                                    </p>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('securityKey')}</label>
                                        <input 
                                            type="password" 
                                            value={secretKey}
                                            onChange={e => setSecretKey(e.target.value)}
                                            className="input-base text-center tracking-[0.5em] font-mono"
                                            placeholder="••••••••"
                                            required 
                                            autoFocus
                                        />
                                    </div>
                                    {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}
                                    <button type="submit" className="w-full btn btn-primary py-3 font-bold">{t('validateKey')}</button>
                                    <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[10px] text-slate-400 hover:text-white underline font-mono tracking-widest">{t('backToLogin')}</button>
                                </form>
                            ) : (
                                <form onSubmit={handleInitializeAdmin} className="space-y-4">
                                    <p className="text-xs text-primary text-center font-bold font-mono tracking-widest">{t('keyValidatedCreateRoot')}</p>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('newAdminEmail')}</label>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="input-base"
                                            placeholder={t('rootEmailPlaceholder')}
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('newAdminPassword')}</label>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="input-base"
                                            placeholder={t('minCharacters')}
                                            required 
                                            minLength={8}
                                        />
                                    </div>
                                    {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}
                                    <button type="submit" disabled={isLoading} className="w-full btn btn-primary py-3 flex justify-center font-bold">
                                        {isLoading ? <LoadingSpinner /> : t('establishSuperAdmin')}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </footer>
    );
};
