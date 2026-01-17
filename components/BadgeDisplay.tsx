import React from 'react';
import { BADGES } from '../services/gamificationService';

interface BadgeDisplayProps {
    badges: string[];
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
    if (!badges || badges.length === 0) {
        return (
            <div className="text-center p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <span className="text-2xl block mb-2 opacity-50">🛡️</span>
                <p className="text-sm text-muted-foreground">No badges yet. Start reporting sightings to earn your first badge!</p>
            </div>
        );
    }

    // Filter definitions based on user's badges
    const userBadges = BADGES.filter(def => badges.includes(def.name));

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {userBadges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                    <div className="text-3xl mb-2 filter drop-shadow-sm" role="img" aria-label={badge.name}>
                        {badge.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-800 leading-tight mb-1">{badge.name}</span>
                    <span className="text-[10px] text-gray-500 hidden sm:block">{badge.description}</span>
                </div>
            ))}
        </div>
    );
};
