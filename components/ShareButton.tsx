import React from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';

interface ShareButtonProps {
    pet: PetProfile;
    className?: string;
    variant?: 'icon' | 'text';
}

export const ShareButton: React.FC<ShareButtonProps> = ({ pet, className = '', variant = 'icon' }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        const url = `${window.location.origin}/pet/${pet.id}`;
        const title = `${pet.name} - ${pet.breed}`;
        const text = `Check out ${pet.name} on Paw Print!`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                addSnackbar(t('sharedSuccess'), 'success');
            } catch (error) {
                if ((error as any).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    fallbackShare(url);
                }
            }
        } else {
            fallbackShare(url);
        }
    };

    const fallbackShare = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            addSnackbar(t('linkCopiedToClipboard'), 'info');
        }).catch((err) => {
            console.error('Failed to copy: ', err);
            addSnackbar(t('shareFailed'), 'error');
        });
    };

    return (
        <button 
            onClick={handleShare}
            className={`transition-all active:scale-95 ${className}`}
            aria-label={t('sharePet')}
        >
            {variant === 'icon' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 hover:text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            ) : (
                <span className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {t('share')}
                </span>
            )}
        </button>
    );
};
