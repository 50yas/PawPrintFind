import React, { useState, useEffect } from 'react';
import { dbService, auth } from '../services/firebase';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useTranslations } from '../hooks/useTranslations';

interface FavoriteButtonProps {
    petId: string;
    className?: string;
    variant?: 'icon' | 'text';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ petId, className = '', variant = 'icon' }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { addSnackbar } = useSnackbar();
    const { t } = useTranslations();

    useEffect(() => {
        const checkStatus = async () => {
            if (auth.currentUser) {
                const status = await dbService.checkIsFavorite(auth.currentUser.uid, petId);
                setIsFavorite(status);
            }
        };
        checkStatus();
    }, [petId]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!auth.currentUser) {
            addSnackbar(t('loginToFavoriteWarning'), 'error');
            return;
        }

        setIsLoading(true);
        try {
            if (isFavorite) {
                await dbService.removeFavorite(auth.currentUser.uid, petId);
                setIsFavorite(false);
                addSnackbar(t('removedFromFavorites'), 'info');
            } else {
                await dbService.addFavorite(auth.currentUser.uid, petId);
                setIsFavorite(true);
                addSnackbar(t('addedToFavorites'), 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            addSnackbar(t('errorTogglingFavorite'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button 
            onClick={handleToggle} 
            disabled={isLoading}
            className={`transition-all active:scale-95 ${className} ${isLoading ? 'opacity-50' : ''}`}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        >
            {variant === 'icon' ? (
                 <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'fill-transparent text-white hover:text-red-400'}`} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ) : (
                <span className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isFavorite ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${isFavorite ? 'fill-current' : 'fill-none'}`} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isFavorite ? t('savedToFavorites') : t('saveToFavorites')}
                </span>
            )}
        </button>
    );
};
