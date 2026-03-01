import React, { useState, Suspense } from 'react';
import { User } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { GamificationTab } from './GamificationTab';

const SocialMediaTab = React.lazy(() => import('./SocialMediaTab').then(m => ({ default: m.SocialMediaTab })));
const BlogManagerTab  = React.lazy(() => import('./BlogManagerTab').then(m => ({ default: m.BlogManagerTab })));

type CommunitySubSection = 'gamification' | 'social' | 'blog';

interface CommunityTabProps {
    users: User[];
    currentUser: User;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({ users, currentUser }) => {
    const [subSection, setSubSection] = useState<CommunitySubSection>('gamification');

    const sections: { id: CommunitySubSection; label: string; icon: string }[] = [
        { id: 'gamification', label: 'Gamification',  icon: '🏆' },
        { id: 'social',       label: 'Social Media',  icon: '📡' },
        { id: 'blog',         label: 'Blog & Content', icon: '📝' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Section Toggle */}
            <div className="flex gap-3 p-1 bg-white/5 rounded-xl w-fit border border-white/10">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setSubSection(s.id)}
                        className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                            subSection === s.id
                                ? 'bg-primary/20 text-white border border-primary/40'
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <Suspense fallback={<div className="flex items-center justify-center py-16"><LoadingSpinner /></div>}>
                {subSection === 'gamification' && (
                    <GamificationTab users={users} currentUser={currentUser} />
                )}
                {subSection === 'social' && (
                    <SocialMediaTab currentUser={currentUser} />
                )}
                {subSection === 'blog' && (
                    <BlogManagerTab currentUser={currentUser} />
                )}
            </Suspense>
        </div>
    );
};
