
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { UserRole } from '../types';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthProps {
    onLogin?: (email: string, role: UserRole) => void;
    isFullScreen?: boolean;
    onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, isFullScreen, onClose }) => {
    const { t } = useTranslations();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('owner');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getFriendlyErrorMessage = (error: any) => {
        const code = error.code || error.message?.match(/\[(.*?)\]/)?.[1];
        switch (code) {
            case 'auth/email-already-in-use':
                return t('auth:errors.emailInUse');
            case 'auth/invalid-credential':
                return t('auth:errors.invalidCredential');
            case 'auth/user-not-found':
                return t('auth:errors.userNotFound');
            case 'auth/wrong-password':
                return t('auth:errors.wrongPassword');
            case 'auth/invalid-email':
                return t('auth:errors.invalidEmail');
            case 'auth/popup-closed-by-user':
                return t('auth:errors.popupClosed');
            case 'auth/weak-password':
                return t('auth:errors.weakPassword');
            default:
                return error.message || t('auth:errors.default');
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || (!isForgotPassword && !password)) {
            setErrorMsg(t('auth:errors.requiredFields'));
            return;
        }

        if (isRegistering && password !== confirmPassword) {
            setErrorMsg(t('auth:errors.passwordMismatch'));
            return;
        }
        
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isForgotPassword) {
                await dbService.resetPassword(email);
                setSuccessMsg(t('auth:success.recoverySent'));
                setIsForgotPassword(false);
            } else if (isRegistering) {
                await dbService.registerUser(email, password, [selectedRole]);
                setSuccessMsg(t('auth:success.accountCreated'));
            } else {
                await dbService.loginWithEmail(email, password);
            }
            if (!isForgotPassword && !isRegistering && onClose) onClose();
        } catch (error: any) {
            console.error("Auth Error:", error);
            setErrorMsg(getFriendlyErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            await dbService.signInWithGoogle();
            if (onClose) onClose();
        } catch (error: any) {
            console.error("Google Auth Error:", error);
            setErrorMsg(getFriendlyErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const roles: { id: UserRole; label: string; icon: string; desc: string }[] = [
        { id: 'owner', label: t('auth:roles.owner.label'), icon: '👤', desc: t('auth:roles.owner.desc') },
        { id: 'vet', label: t('auth:roles.vet.label'), icon: '🏥', desc: t('auth:roles.vet.desc') },
        { id: 'shelter', label: t('auth:roles.shelter.label'), icon: '🏡', desc: t('auth:roles.shelter.desc') },
        { id: 'volunteer', label: t('auth:roles.volunteer.label'), icon: '🛡️', desc: t('auth:roles.volunteer.desc') }
    ];

    return (
        <div className={`relative transition-all duration-500 ${isFullScreen ? 'w-full max-w-lg mx-auto z-50' : 'w-full'}`}>
            <div className={`glass-panel p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-2xl border border-white/20 text-center relative overflow-hidden bg-slate-950/90 backdrop-blur-3xl`}>
                {isFullScreen && onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/40 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 transition-all z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                <div className="mb-6 sm:mb-10 relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary via-secondary to-primary bg-[length:200%_200%] animate-gradient rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-primary/30 transform hover:scale-110 transition-transform duration-500 rotate-6 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                        {isForgotPassword ? t('auth:title.recovery') : isRegistering ? t('auth:title.register') : t('auth:title.login')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-3 font-medium px-4">
                        {isForgotPassword ? t('auth:subtitle.recovery') : isRegistering ? t('auth:subtitle.register') : t('auth:subtitle.login')}
                    </p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    {errorMsg && (
                        <div className="animate-shake flex items-center gap-3 bg-red-500/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-red-500/30 text-left">
                            <span className="text-lg">⚠️</span>
                            <p className="text-[10px] sm:text-xs text-red-400 font-bold uppercase tracking-tight leading-tight">{errorMsg}</p>
                        </div>
                    )}
                    {successMsg && (
                        <div className="animate-fade-in flex items-center gap-3 bg-green-500/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-green-500/30 text-left">
                            <span className="text-lg">✅</span>
                            <p className="text-[10px] sm:text-xs text-green-400 font-bold uppercase tracking-tight leading-tight">{successMsg}</p>
                        </div>
                    )}

                    {/* Protocol Selector */}
                    {!isForgotPassword && (
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <label className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] block text-left">{t('auth:labels.securityProtocol')}</label>
                                <span className="text-[7px] sm:text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">{t('auth:labels.verified')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`group relative flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 border overflow-hidden ${selectedRole === role.id
                                            ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(34,211,238,0.2)]'
                                            : 'bg-white/5 border-white/10 hover:border-white/30 grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all duration-500 ${selectedRole === role.id ? 'bg-primary text-white shadow-lg' : 'bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-white'}`}>
                                            {role.icon}
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <span className={`block text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-none truncate ${selectedRole === role.id ? 'text-white' : 'text-slate-400'}`}>{role.label}</span>
                                            <span className="text-[7px] sm:text-[8px] font-medium text-slate-500 mt-1 block leading-tight truncate">{role.desc}</span>
                                        </div>
                                        {selectedRole === role.id && (
                                            <div className="absolute -right-2 -top-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center pt-1 pr-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-slate-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
                        <div className="group relative transition-all duration-300">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                            </div>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder={t('auth:placeholders.email')} 
                                required 
                                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-slate-600 shadow-inner" 
                            />
                        </div>
                        
                        {!isForgotPassword && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder={t('auth:placeholders.password')} 
                                    required 
                                    className="w-full pl-12 pr-12 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-slate-600 shadow-inner" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {isRegistering && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    placeholder={t('auth:placeholders.confirmPassword')} 
                                    required 
                                    className="w-full pl-12 pr-12 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-slate-600 shadow-inner" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        )}
                        <button type="submit" disabled={loading} className="group w-full bg-gradient-to-r from-primary to-secondary p-[2px] rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                            <div className="w-full h-full bg-slate-900 rounded-[10px] sm:rounded-[14px] py-3 sm:py-4 flex items-center justify-center gap-2 group-hover:bg-transparent transition-colors">
                                {loading ? <LoadingSpinner /> : (
                                    <>
                                        <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
                                            {isForgotPassword ? t('auth:buttons.initiateRecovery') : isRegistering ? t('auth:buttons.authorizeNewAccount') : t('auth:buttons.decryptDashboard')}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-6">
                        {!isForgotPassword && (
                            <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-[0.1em] hover:brightness-125 transition-all w-fit mx-auto">{t('auth:buttons.lostCredentials')}</button>
                        )}
                        <button type="button" onClick={() => { setIsRegistering(!isRegistering); setIsForgotPassword(false); }} className="text-[10px] sm:text-xs text-slate-400 hover:text-white transition-colors font-bold flex items-center justify-center gap-2">
                            {isRegistering ? (
                                <><span>{t('auth:buttons.alreadyRegistered')}</span> <span className="text-primary border-b border-primary/30">{t('auth:buttons.signInProtocol')}</span></>
                            ) : (
                                <><span>{t('auth:buttons.newOperative')}</span> <span className="text-primary border-b border-primary/30">{t('auth:buttons.initializeProfile')}</span></>
                            )}
                        </button>
                        {isForgotPassword && (
                            <button type="button" onClick={() => setIsForgotPassword(false)} className="text-[9px] sm:text-[10px] text-slate-400 hover:text-white transition-all font-black uppercase tracking-[0.1em] w-fit mx-auto flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                                {t('auth:buttons.backToIdentification')}
                            </button>
                        )}
                    </div>

                    {!isForgotPassword && (
                        <div className="pt-6 sm:pt-8 relative">
                            <div className="absolute inset-x-0 top-4 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#020617] px-4 text-slate-500 font-bold tracking-widest text-[8px] sm:text-[9px]">{t('auth:labels.externalUplink')}</span>
                            </div>
                            <button onClick={handleGoogleLogin} className="mt-4 sm:mt-6 w-full py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] sm:text-xs rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-center gap-3 sm:gap-4 transition-all hover:scale-[1.02] shadow-sm group">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" alt="" />
                                <span className="uppercase tracking-[0.15em]">{t('auth:buttons.syncGoogle')}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Cyber Design accents */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
            </div>
            <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes gradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .animate-gradient {
                background-size: 200% 200%;
                animation: gradient 15s ease infinite;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .animate-shake {
                animation: shake 0.4s ease-in-out infinite;
            }
        `}</style>
        </div>
    );
};
