import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';

export const OfflineBanner: React.FC = () => {
    const { t } = useTranslations();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[150] bg-red-500/80 backdrop-blur-md text-white p-2 text-center text-sm font-medium border-t border-white/20 shadow-lg animate-slide-up">
            {t('You are currently offline. Functionality may be limited.')}
        </div>
    );
};
