
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
    const [isRegistering, setIsRegistering] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('owner');

    const getFriendlyErrorMessage = (error: any) => {
        const code = error.message?.match(/\[(.*?)\]/)?.[1] || error.code;
        switch (code) {
            case 'auth/email-already-in-use':
                return "This email is already registered. Please log in instead.";
            case 'auth/user-not-found':
                return "No account found with this email.";
            case 'auth/wrong-password':
                return "Incorrect password. Please try again.";
            case 'auth/invalid-email':
                return "Please enter a valid email address.";
            case 'auth/popup-closed-by-user':
                return "Sign-in cancelled.";
            case 'auth/weak-password':
                return "Password should be at least 6 characters.";
            default:
                if (error.message?.includes("auth/email-already-in-use")) return "This email is already registered.";
                return error.message || "Authentication failed. Please try again.";
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isForgotPassword) {
                await dbService.resetPassword(email);
                setSuccessMsg("Recovery email sent. Check your inbox.");
                setIsForgotPassword(false);
            } else if (isRegistering) {
                await dbService.registerUser(email, password, selectedRole);
            } else {
                await dbService.loginWithEmail(email, password);
            }
            if (!isForgotPassword && onClose) onClose();
        } catch (error: any) {
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
            setErrorMsg(getFriendlyErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const roles: { id: UserRole; label: string; icon: string }[] = [
        { id: 'owner', label: t('loginAsOwner'), icon: '👤' },
        { id: 'vet', label: t('loginAsVet'), icon: '🏥' },
        { id: 'shelter', label: t('loginAsShelter'), icon: '🏡' },
        { id: 'volunteer', label: t('volunteerTitle'), icon: '🛡️' }
    ];

    return (
        <div className={`relative transition-all duration-500 ${isFullScreen ? 'w-full max-w-md mx-auto z-50' : 'w-full'}`}>
            <div className={`glass-panel p-8 rounded-[2.5rem] shadow-2xl border border-white/10 text-center relative overflow-hidden bg-slate-900/95 backdrop-blur-3xl`}>
                {isFullScreen && onClose && (
                    <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-white/5 transition-colors z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                <div className="mb-6 relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 transform hover:scale-105 transition-transform duration-500 rotate-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                        {isForgotPassword ? 'Reset Protocol' : isRegistering ? 'Initialize Identity' : 'Secure Entry'}
                    </h2>
                    <p className="text-xs font-mono text-primary mt-2 tracking-widest uppercase opacity-70">Paw Print Network Auth</p>
                </div>

                <div className="space-y-6">
                    {errorMsg && <p className="text-[10px] text-red-400 bg-red-500/10 p-3 rounded-xl font-bold border border-red-500/20 uppercase tracking-tighter">{errorMsg}</p>}
                    {successMsg && <p className="text-[10px] text-green-400 bg-green-500/10 p-3 rounded-xl font-bold border border-green-500/20 uppercase tracking-tighter">{successMsg}</p>}

                    {/* iPhone-style Carousel Role Selector */}
                    {!isForgotPassword && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block text-left pl-2">Select Account Protocol</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x no-scrollbar">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`snap-center flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 min-w-[90px] border ${selectedRole === role.id
                                            ? 'bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-105'
                                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 grayscale'
                                            }`}
                                    >
                                        <span className="text-2xl">{role.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full">{role.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="relative">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="IDENT_EMAIL" required className="input-enhanced !font-mono !text-xs !bg-black/40 !py-4" />
                        </div>
                        {!isForgotPassword && (
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="SECURITY_PHRASE" required className="input-enhanced !font-mono !text-xs !bg-black/40 !py-4" />
                        )}
                        <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            {loading ? <LoadingSpinner /> : isForgotPassword ? 'Send Link' : isRegistering ? 'Establish Link' : 'Initialize Access'}
                        </button>
                    </form>

                    <div className="flex flex-col gap-3 mt-4">
                        {!isForgotPassword && (
                            <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] text-primary font-bold hover:underline uppercase tracking-widest">Protocol Recovery?</button>
                        )}
                        <button type="button" onClick={() => { setIsRegistering(!isRegistering); setIsForgotPassword(false); }} className="text-[10px] text-muted-foreground hover:text-white transition-colors font-bold uppercase tracking-widest">
                            {isRegistering ? 'Existing Identity? Enter' : 'New Identity? Register'}
                        </button>
                        {isForgotPassword && (
                            <button type="button" onClick={() => setIsForgotPassword(false)} className="text-[10px] text-muted-foreground hover:underline uppercase font-bold tracking-widest">Abort & Back</button>
                        )}
                    </div>

                    {!isForgotPassword && (
                        <div className="pt-4 border-t border-white/10">
                            <button onClick={handleGoogleLogin} className="w-full py-3.5 bg-white text-gray-900 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-100 transition-all hover:scale-[1.02] shadow-sm">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="" />
                                Google Auth Uplink
                            </button>
                        </div>
                    )}
                </div>

                {/* Design accents */}
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>
            <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        </div>
    );
};
