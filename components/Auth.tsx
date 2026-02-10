
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { dbService, auth } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { GlassButton } from './ui/GlassButton';

const Background = lazy(() => import('./Background').then(m => ({ default: m.Background })));

interface AuthProps {
    onLogin?: (email: string, role: UserRole) => void;
    isFullScreen?: boolean;
    onClose?: () => void;
}

// Simple CountUp Component for futuristic number reveal
const CountUp = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const update = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(ease * end));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(update);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <>{count.toLocaleString()}</>;
};

export const Auth: React.FC<AuthProps> = ({ onLogin, isFullScreen, onClose }) => {
    const { t } = useTranslation('auth');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isMagicLink, setIsMagicLink] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
    const [isPhoneAuth, setIsPhoneAuth] = useState(false);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [publicStats, setPublicStats] = useState<{ activeNodes: number; biometricMatches: number } | null>(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await dbService.getPublicStats();
                setPublicStats(stats);
            } catch (err) {
                console.error("Failed to fetch public stats", err);
            }
        };
        fetchStats();
    }, []);

    React.useEffect(() => {
        if (!isFullScreen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullScreen, onClose]);

    const getFriendlyErrorMessage = (error: any) => {
        const code = error.code || error.message?.match(/\[(.*?)\]/)?.[1];
        switch (code) {
            case 'auth/email-already-in-use':
                return t('errors.emailInUse');
            case 'auth/invalid-credential':
                return t('errors.invalidCredential');
            case 'auth/user-not-found':
                return t('errors.userNotFound');
            case 'auth/wrong-password':
                return t('errors.wrongPassword');
            case 'auth/invalid-email':
                return t('errors.invalidEmail');
            case 'auth/popup-closed-by-user':
                return t('errors.popupClosed');
            case 'auth/weak-password':
                return t('errors.weakPassword');
            case 'auth/missing-email':
                return t('errors.missingEmail');
            default:
                return error.message || t('errors.default');
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isMagicLink) {
            if (!email) {
                setErrorMsg(t('errors.missingEmail'));
                return;
            }
            setLoading(true);
            setErrorMsg(null);
            try {
                const actionCodeSettings = {
                    url: window.location.href,
                    handleCodeInApp: true,
                };
                await sendSignInLinkToEmail(auth, email, actionCodeSettings);
                window.localStorage.setItem('emailForSignIn', email);
                setSuccessMsg(t('success.magicLinkSent'));
            } catch (error: any) {
                console.error("Magic Link Error:", error);
                setErrorMsg(getFriendlyErrorMessage(error));
            } finally {
                setLoading(false);
            }
            return;
        }

        if (isPhoneAuth) {
            if (!verificationId) {
                // Step 1: Send OTP
                if (!phoneNumber) {
                    setErrorMsg(t('errors.missingPhoneNumber') || "Please enter a valid phone number.");
                    return;
                }
                setLoading(true);
                setErrorMsg(null);
                try {
                    const verifier = dbService.setupRecaptcha('recaptcha-container');
                    const confirmationResult = await dbService.signInPhone(phoneNumber, verifier);
                    setVerificationId(confirmationResult.verificationId);
                    // Handle the confirmationResult for later verification
                    (window as any).confirmationResult = confirmationResult;
                    setSuccessMsg(t('success.otpSent') || "Verification code sent to your phone.");
                } catch (error: any) {
                    console.error("Phone Auth Error:", error);
                    setErrorMsg(getFriendlyErrorMessage(error));
                } finally {
                    setLoading(false);
                }
            } else {
                // Step 2: Verify OTP
                if (!verificationCode) {
                    setErrorMsg(t('errors.missingCode') || "Please enter the verification code.");
                    return;
                }
                setLoading(true);
                setErrorMsg(null);
                try {
                    const confirmationResult = (window as any).confirmationResult;
                    await confirmationResult.confirm(verificationCode);
                    if (onClose) onClose();
                } catch (error: any) {
                    console.error("OTP Verification Error:", error);
                    setErrorMsg(getFriendlyErrorMessage(error));
                } finally {
                    setLoading(false);
                }
            }
            return;
        }

        if (!email || (!isForgotPassword && !password)) {
            setErrorMsg(t('errors.requiredFields'));
            return;
        }

        if (isRegistering && password !== confirmPassword) {
            setErrorMsg(t('errors.passwordMismatch'));
            return;
        }

        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isForgotPassword) {
                await dbService.resetPassword(email);
                setSuccessMsg(t('success.recoverySent'));
                setIsForgotPassword(false);
            } else if (isRegistering) {
                await dbService.registerUser(email, password, [selectedRole], { phoneNumber });
                setSuccessMsg(t('success.accountCreated'));
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
        { id: 'owner', label: t('roles.owner.label'), icon: '👤', desc: t('roles.owner.desc') },
        { id: 'vet', label: t('roles.vet.label'), icon: '🏥', desc: t('roles.vet.desc') },
        { id: 'shelter', label: t('roles.shelter.label'), icon: '🏡', desc: t('roles.shelter.desc') },
        { id: 'volunteer', label: t('roles.volunteer.label'), icon: '🛡️', desc: t('roles.volunteer.desc') }
    ];

    const content = (
        <div className="flex flex-col h-[100dvh] lg:h-auto justify-center lg:block w-full">
            <div data-testid="auth-form-card" className={`glass-card-premium p-5 sm:p-10 rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-x-0 border-y-0 sm:border border-white/10 text-center relative overflow-y-auto sm:overflow-visible bg-transparent sm:bg-slate-950/40 backdrop-blur-none sm:backdrop-blur-3xl w-full max-w-md mx-auto animate-fade-in-up flex flex-col justify-center flex-grow`}>
                {isFullScreen && onClose && (
                    <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                <div className="mb-4 sm:mb-8 relative shrink-0">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 6 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-primary via-secondary to-primary bg-[length:200%_200%] animate-gradient rounded-xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-2xl shadow-primary/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </motion.div>
                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                        {isPhoneAuth ? (verificationId ? t('title.verifyPhone') || "Verify Code" : t('title.phoneLogin') || "Phone Login") : isMagicLink ? t('title.magicLink') : isForgotPassword ? t('title.recovery') : isRegistering ? t('title.register') : t('title.login')}
                    </h2>
                    <p className="text-[10px] sm:text-sm text-slate-400 mt-1 sm:mt-2 font-medium px-4 line-clamp-1">
                        {isPhoneAuth ? (verificationId ? t('subtitle.verifyPhone') || "Enter the 6-digit code" : t('subtitle.phoneLogin') || "Sign in with your phone number") : isMagicLink ? t('subtitle.magicLink') : isForgotPassword ? t('subtitle.recovery') : isRegistering ? t('subtitle.register') : t('subtitle.login')}
                    </p>
                </div>

                <div className="space-y-3 sm:space-y-6 shrink-0">
                    <AnimatePresence mode="wait">
                        {errorMsg && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex items-center gap-2 sm:gap-3 bg-red-500/10 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-red-500/30 text-left overflow-hidden"
                            >
                                <span className="text-sm sm:text-lg">⚠️</span>
                                <p className="text-[9px] sm:text-xs text-red-400 font-bold uppercase tracking-tight leading-tight">{errorMsg}</p>
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex items-center gap-2 sm:gap-3 bg-green-500/10 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-green-500/30 text-left overflow-hidden"
                            >
                                <span className="text-sm sm:text-lg">✅</span>
                                <p className="text-[9px] sm:text-xs text-green-400 font-bold uppercase tracking-tight leading-tight">{successMsg}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Protocol Selector - Compact Grid */}
                    {!isForgotPassword && !isMagicLink && (
                        <div className="space-y-2 sm:space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <label className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] block text-left">{t('labels.securityProtocol')}</label>
                                <span className="text-[7px] sm:text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">{t('labels.verified')}</span>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 sm:gap-3">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`group relative flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-2xl transition-all duration-300 border overflow-hidden ${selectedRole === role.id
                                            ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                            : 'bg-white/5 border-white/10 hover:border-white/30 grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center text-sm sm:text-xl transition-all duration-300 ${selectedRole === role.id ? 'bg-primary text-white shadow-lg' : 'bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-white'}`}>
                                            {role.icon}
                                        </div>
                                        <div className="text-center sm:text-left overflow-hidden w-full sm:w-auto">
                                            <span className={`block text-[7px] sm:text-[10px] font-black uppercase tracking-widest leading-none truncate ${selectedRole === role.id ? 'text-white' : 'text-slate-400'}`}>{role.label}</span>
                                            <span className="hidden sm:block text-[7px] sm:text-[8px] font-medium text-slate-500 mt-1 leading-tight truncate">{role.desc}</span>
                                        </div>
                                        {selectedRole === role.id && (
                                            <div className="absolute top-0 right-0 sm:-right-2 sm:-top-2 w-3 h-3 sm:w-8 sm:h-8 bg-primary rounded-bl-lg sm:rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 sm:h-4 sm:w-4 text-slate-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
                        {!isPhoneAuth && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('placeholders.email')}
                                    required={!isPhoneAuth}
                                    className="input-enhanced pl-10 sm:pl-12 py-3 sm:py-4 text-sm"
                                />
                            </div>
                        )}

                        {(isRegistering || (isPhoneAuth && !verificationId)) && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder={t('placeholders.phoneNumber') || "Phone Number (+1...)"}
                                    required={isPhoneAuth}
                                    className="input-enhanced pl-10 sm:pl-12 py-3 sm:py-4 text-sm"
                                />
                            </div>
                        )}

                        {isPhoneAuth && verificationId && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder={t('placeholders.verificationCode') || "6-digit code"}
                                    maxLength={6}
                                    required
                                    className="input-enhanced pl-10 sm:pl-12 py-3 sm:py-4 text-center text-lg sm:text-xl font-black tracking-[0.5em]"
                                />
                            </div>
                        )}

                        {!isForgotPassword && !isMagicLink && !isPhoneAuth && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('placeholders.password')}
                                    required
                                    className="input-enhanced pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                                    className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {isRegistering && (
                            <div className="group relative transition-all duration-300">
                                <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('placeholders.confirmPassword')}
                                    required
                                    className="input-enhanced pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="pt-2">
                            <GlassButton type="submit" isLoading={loading} fullWidth loadingText={isRegistering ? t('buttons.registering') : t('buttons.signingIn')}>
                                {isMagicLink ? t('buttons.sendMagicLink') : isForgotPassword ? t('buttons.initiateRecovery') : isRegistering ? t('buttons.authorizeNewAccount') : t('buttons.decryptDashboard')}
                            </GlassButton>
                        </div>
                    </form>

                    <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-6">
                        <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2">
                            {!isForgotPassword && !isMagicLink && !isRegistering && !isPhoneAuth && (
                                <button type="button" onClick={() => setIsPhoneAuth(true)} className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest hover:brightness-125 transition-all">{t('buttons.usePhoneAuth') || "Phone Login"}</button>
                            )}
                            {isPhoneAuth && !verificationId && (
                                <button type="button" onClick={() => setIsPhoneAuth(false)} className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-white transition-all">{t('buttons.useEmail') || "Email Login"}</button>
                            )}
                            {isPhoneAuth && verificationId && (
                                <button type="button" onClick={() => { setVerificationId(null); setVerificationCode(''); }} className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-white transition-all">{t('buttons.resendCode') || "Resend Code"}</button>
                            )}

                            {!isForgotPassword && !isMagicLink && !isRegistering && !isPhoneAuth && (
                                <button type="button" onClick={() => setIsMagicLink(true)} className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest hover:brightness-125 transition-all">{t('buttons.useMagicLink')}</button>
                            )}
                            {isMagicLink && (
                                <button type="button" onClick={() => setIsMagicLink(false)} className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-white transition-all">{t('buttons.usePassword')}</button>
                            )}

                            {!isForgotPassword && !isMagicLink && !isPhoneAuth && (
                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest hover:brightness-125 transition-all">{t('buttons.lostCredentials')}</button>
                            )}
                        </div>

                        <button type="button" onClick={() => { setIsRegistering(!isRegistering); setIsForgotPassword(false); setIsMagicLink(false); setIsPhoneAuth(false); }} className="text-[10px] sm:text-xs text-slate-400 hover:text-white transition-colors font-bold flex items-center justify-center gap-2">
                            {isRegistering ? (
                                <><span>{t('buttons.alreadyRegistered')}</span> <span className="text-primary border-b border-primary/30">{t('buttons.signInProtocol')}</span></>
                            ) : (
                                <><span>{t('buttons.newOperative')}</span> <span className="text-primary border-b border-primary/30">{t('buttons.initializeProfile')}</span></>
                            )}
                        </button>
                    </div>

                    <div id="recaptcha-container"></div>

                    {!isForgotPassword && (
                        <div className="pt-4 sm:pt-8 relative block sm:hidden">
                            {/* Hidden on mobile to save space, relies on "Sign in with Google" if needed, OR keep it very compact */}
                            <div className="relative flex justify-center text-xs uppercase mb-2">
                                <span className="bg-[#020617]/0 backdrop-blur-md px-4 text-slate-500 font-black tracking-[0.3em] text-[8px] sm:text-[9px]">{t('labels.externalUplink')}</span>
                            </div>
                            <button onClick={handleGoogleLogin} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] sm:text-xs rounded-xl border border-white/10 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-sm group">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 group-hover:scale-110 transition-transform" alt="" />
                                <span className="uppercase tracking-widest">{t('buttons.syncGoogle')}</span>
                            </button>
                        </div>
                    )}
                    {!isForgotPassword && (
                        <div className="pt-8 relative hidden sm:block">
                            <div className="absolute inset-x-0 top-4 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#020617]/0 backdrop-blur-md px-4 text-slate-500 font-black tracking-[0.3em] text-[9px]">{t('labels.externalUplink')}</span>
                            </div>
                            <button onClick={handleGoogleLogin} className="mt-6 w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl border border-white/10 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-sm group">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="" />
                                <span className="uppercase tracking-widest">{t('buttons.syncGoogle')}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Cyber Design accents - Hidden on mobile to reduce rendering cost/visual noise */}
                <div className="hidden sm:block absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="hidden sm:block absolute -top-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            {/* Fixed Mobile Stats Footer */}
            {isFullScreen && (
                <div className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-t border-white/5 p-2 grid grid-cols-2 gap-4 z-50">
                    <div className="flex flex-col items-center">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Active Nodes</p>
                        <p className="text-lg font-mono font-bold text-white tabular-nums leading-none">
                            <CountUp end={publicStats ? publicStats.activeNodes : 0} duration={2000} />
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Bio Matches</p>
                        <p className="text-lg font-mono font-bold text-emerald-400 tabular-nums leading-none">
                            <CountUp end={publicStats ? publicStats.biometricMatches : 0} duration={2500} />
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    if (isFullScreen) {
        return (
            <div data-testid="auth-container" className="cinematic-split h-screen overflow-hidden">
                <div className="hidden lg:flex flex-col relative overflow-hidden bg-slate-950 h-full justify-center">
                    <Suspense fallback={<div className="absolute inset-0 bg-slate-950" />}>
                        <Background />
                    </Suspense>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] z-10 pointer-events-none"></div>

                    <div className="relative z-20 px-16 xl:px-24">
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <h1 className="text-7xl xl:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                PAWPRINT<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300">FIND</span>
                            </h1>
                            <div className="h-1.5 w-24 bg-primary rounded-full mb-8 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                            <p className="text-xl xl:text-2xl text-slate-300 font-light leading-relaxed max-w-lg mb-12">
                                {t('subtitle.login')}
                            </p>

                            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 max-w-md">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        Active Nodes
                                    </p>
                                    <div className="relative group/stat">
                                        <p className="text-3xl font-mono font-bold text-white tabular-nums relative z-10">
                                            <CountUp end={publicStats ? publicStats.activeNodes : 0} duration={2000} />
                                        </p>
                                        <div className="absolute -inset-2 bg-primary/5 blur-lg rounded-lg opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-100"></span>
                                        Biometric Matches
                                    </p>
                                    <div className="relative group/stat">
                                        <p className="text-3xl font-mono font-bold text-emerald-400 tabular-nums relative z-10">
                                            <CountUp end={publicStats ? publicStats.biometricMatches : 0} duration={2500} />
                                        </p>
                                        <div className="absolute -inset-2 bg-emerald-500/5 blur-lg rounded-lg opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                {/* Scrollable Right Panel */}
                <div className="flex items-center justify-center relative bg-[#020617] h-full overflow-y-auto">
                    <div className="lg:hidden absolute inset-0 z-0 h-full w-full">
                        <Suspense fallback={<div className="absolute inset-0 bg-slate-950" />}>
                            <Background />
                        </Suspense>
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
                    </div>
                    <div className="relative z-10 w-full flex justify-center max-w-md py-12 px-6">
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    return content;
};
