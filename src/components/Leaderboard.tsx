
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardEntry, View } from '../types';
import { dbService } from '../services/firebase';
import { GlassCard } from './ui/GlassCard';
import { LoadingSpinner } from './LoadingSpinner';

interface LeaderboardProps {
    setView?: (view: View) => void;
    currentUserId?: string;
    compact?: boolean;
}

const TIER_ICONS: Record<string, string> = {
    scout: '🔭',
    tracker: '🐾',
    ranger: '🌲',
    guardian: '🛡️',
    legend: '👑',
};

const TIER_COLORS: Record<string, string> = {
    scout: 'text-gray-400',
    tracker: 'text-green-400',
    ranger: 'text-blue-400',
    guardian: 'text-purple-400',
    legend: 'text-yellow-400',
};

const RANK_STYLES: Record<number, string> = {
    1: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    2: 'bg-slate-500/20 border-slate-400/30 text-slate-300',
    3: 'bg-orange-700/20 border-orange-600/30 text-orange-400',
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
    setView,
    currentUserId,
    compact = false,
}) => {
    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('allTime');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        dbService.getLeaderboard(timeframe)
            .then(setEntries)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [timeframe]);

    const renderEntry = (entry: LeaderboardEntry, index: number) => {
        const isCurrentUser = entry.userId === currentUserId;
        const rankStyle = RANK_STYLES[entry.rank] || 'bg-white/5 border-white/10 text-slate-400';

        return (
            <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isCurrentUser
                        ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
            >
                {/* Rank */}
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-sm font-black border ${rankStyle}`}>
                    {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-lg font-black ${
                    isCurrentUser ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white'
                }`}>
                    {entry.avatarInitial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">
                            {isCurrentUser ? 'You' : entry.displayName}
                        </span>
                        <span className={`text-xs ${TIER_COLORS[entry.tier]}`}>
                            {TIER_ICONS[entry.tier]} {entry.tier}
                        </span>
                    </div>
                    {!compact && (
                        <div className="flex gap-3 text-[10px] text-slate-500 mt-0.5">
                            <span>👁️ {entry.sightingsCount}</span>
                            <span>🤝 {entry.reunionsCount}</span>
                            <span>🗺️ {entry.patrolKm.toFixed(1)}km</span>
                            {entry.riderType && <span>🚲 {entry.riderType.replace('_', ' ')}</span>}
                        </div>
                    )}
                </div>

                {/* Karma */}
                <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-primary">{entry.totalKarma.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-600">karma</div>
                </div>
            </motion.div>
        );
    };

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Top Riders</h3>
                    {setView && (
                        <button onClick={() => setView('leaderboard')} className="text-xs text-primary hover:underline">
                            View all
                        </button>
                    )}
                </div>
                {isLoading ? <LoadingSpinner /> : entries.slice(0, 5).map(renderEntry)}
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    {setView && (
                        <button onClick={() => setView('riderMissionCenter')} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <div>
                        <h1 className="text-lg font-black text-white">Leaderboard</h1>
                        <p className="text-xs text-slate-400">Top Karma earners in the community</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Timeframe selector */}
                <div className="flex gap-1 p-1 bg-black/40 rounded-2xl mb-6 border border-white/10">
                    {(['allTime', 'monthly', 'weekly'] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                timeframe === tf
                                    ? 'bg-primary/80 text-white shadow-[0_0_10px_rgba(20,184,166,0.4)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tf === 'allTime' ? 'All Time' : tf === 'monthly' ? 'Monthly' : 'Weekly'}
                        </button>
                    ))}
                </div>

                {/* Entries */}
                {isLoading ? (
                    <div className="flex justify-center py-16"><LoadingSpinner /></div>
                ) : entries.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-lg font-bold text-white mb-2">Be the first!</h3>
                        <p className="text-slate-400 text-sm">Start patrolling and reporting sightings to claim your spot on the leaderboard.</p>
                    </GlassCard>
                ) : (
                    <div className="space-y-2">
                        {entries.map(renderEntry)}
                    </div>
                )}
            </div>
        </div>
    );
};
