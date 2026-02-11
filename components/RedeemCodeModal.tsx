
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';

interface RedeemCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{success: boolean, reward: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        setResult(null);
        try {
            const res = await dbService.redeemCode(code.trim());
            setResult(res);
            addSnackbar(t('codeRedeemedSuccess'), 'success');
            // Don't close immediately so they can see the result
        } catch (error: any) {
            console.error(error);
            addSnackbar(error.message || t('codeRedeemFailed'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('redeemCodeTitle')}>
            <div className="space-y-6 p-2">
                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-2">🎁</div>
                            <p className="text-slate-400 text-sm">{t('redeemCodeDesc')}</p>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                className="input-base w-full text-center text-2xl font-mono tracking-widest uppercase"
                                placeholder={t('enterCodePlaceholder')}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading || !code}
                            className="w-full btn btn-primary py-3 text-lg font-bold shadow-lg"
                        >
                            {isLoading ? <LoadingSpinner /> : t('redeemButton')}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8 animate-fade-in">
                        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            🎉
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{t('congratulations')}</h3>
                        <p className="text-slate-400">{t('youUnlocked')}</p>
                        <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                            <span className="font-black text-xl text-primary">{result.reward}</span>
                        </div>
                        <button onClick={onClose} className="mt-8 glass-btn w-full">
                            {t('closeButton')}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
