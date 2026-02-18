import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface BadgeDisplayProps {
    badges: string[];
    isVerified?: boolean;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges, isVerified }) => {
    const { t } = useTranslations();

    if (!badges.length && !isVerified) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {isVerified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    {t('verifiedVetBadge')}
                </span>
            )}
            {badges.map((badge, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {badge}
                </span>
            ))}
        </div>
    );
};