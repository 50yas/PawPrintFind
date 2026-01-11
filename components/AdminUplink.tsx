
import React, { useState } from 'react';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslations } from '../hooks/useTranslations';
import { User } from '../types';

interface AdminUplinkProps {
    currentUser: User | null;
    onClose: () => void;
}

export const AdminUplink: React.FC<AdminUplinkProps> = ({ currentUser, onClose }) => {
    const { t } = useTranslations();
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUplink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Verify Key validity
            const result = await dbService.verifyAdminKey(key);

            if (!result.valid) {
                throw new Error(t('invalidAdminKey'));
            }

            // 2. Elevate Role
            await dbService.elevateUserRole(currentUser.uid, result.type, result.keyDocId);

            // 3. Force Reload to apply new privileges
            window.location.reload();

        } catch (err: any) {
            setError(err.message || t('uplinkFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 font-mono-tech animate-fade-in">
            <div className="max-w-md w-full glass-panel p-8 border-primary/50 shadow-[0_0_100px_rgba(13,148,136,0.2)] relative overflow-hidden">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>

                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-primary/10 border border-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-2xl">⚡</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-[0.3em] uppercase">{t('adminUplinkTitle')}</h2>
                    <p className="text-[10px] text-primary mt-2 uppercase tracking-widest">{t('secureRoleProtocol')}</p>
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-[10px] mb-6 text-center uppercase tracking-wider">{error}</div>}

                <form onSubmit={handleUplink} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block text-center">{t('enterAccessKey')}</label>
                        <input
                            type="password"
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            className="input-base !bg-black !border-primary/30 text-primary text-center tracking-[1em] text-lg py-3 focus:border-primary transition-all"
                            placeholder={t('passwordPlaceholder')}
                            autoFocus
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                        {loading ? <LoadingSpinner /> : t('initiateUplink')}
                    </button>
                </form>

                {/* Cyberpunk Deco */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            </div>
        </div>
    );
};
