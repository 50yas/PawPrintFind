import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, KarmaBalance, KarmaTransaction, KarmaTier, Mission, LeaderboardEntry, KarmaAction } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { adminService } from '../../services/adminService';
import { karmaService } from '../../services/karmaService';
import { BADGES, BadgeDefinition } from '../../services/gamificationService';
import { GlassCard, GlassButton } from '../ui';
import { MetricCard } from '../analytics/MetricCard';

type GamSubTab = 'leaderboard' | 'karma' | 'badges' | 'missions';

interface GamificationTabProps {
    users: User[];
    currentUser: User;
}

const TIER_COLORS: Record<KarmaTier, string> = {
    scout: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    tracker: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ranger: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    guardian: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    legend: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const KARMA_ACTIONS: { value: KarmaAction; label: string; points: number }[] = [
    { value: 'sighting_report', label: 'Sighting Report', points: 50 },
    { value: 'verified_sighting', label: 'Verified Sighting', points: 150 },
    { value: 'search_patrol', label: 'Search Patrol (per km)', points: 10 },
    { value: 'patrol_time', label: 'Patrol Time (per 15 min)', points: 5 },
    { value: 'successful_reunion', label: 'Successful Reunion', points: 500 },
    { value: 'mission_complete', label: 'Mission Complete', points: 0 },
    { value: 'daily_check_in', label: 'Daily Check-in', points: 10 },
    { value: 'referral', label: 'Referral', points: 100 },
    { value: 'waiting_mode_scan', label: 'Waiting Mode Scan', points: 25 },
    { value: 'photo_verification', label: 'Photo Verification', points: 30 },
    { value: 'community_alert', label: 'Community Alert', points: 20 },
    { value: 'first_sighting_bonus', label: 'First Sighting Bonus', points: 200 },
    { value: 'streak_bonus', label: 'Streak Bonus', points: 0 },
    { value: 'donation_bonus', label: 'Donation Bonus', points: 50 },
];

const MISSION_PRIORITY_STYLES: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    low: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

export const GamificationTab: React.FC<GamificationTabProps> = ({ users, currentUser }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();

    const [subTab, setSubTab] = useState<GamSubTab>('leaderboard');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [karmaStats, setKarmaStats] = useState<{ tierDistribution: Record<KarmaTier, number>; totalKarmaAwarded: number; activeRiders: number; totalPatrolKm: number } | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [loadingMissions, setLoadingMissions] = useState(false);

    // Karma Management state
    const [karmaUserSearch, setKarmaUserSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedBalance, setSelectedBalance] = useState<KarmaBalance | null>(null);
    const [selectedTxHistory, setSelectedTxHistory] = useState<KarmaTransaction[]>([]);
    const [loadingKarmaUser, setLoadingKarmaUser] = useState(false);

    // Award/Deduct modal
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustPoints, setAdjustPoints] = useState(0);
    const [adjustAction, setAdjustAction] = useState<KarmaAction>('sighting_report');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    // Badge award modal
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
    const [badgeUserSearch, setBadgeUserSearch] = useState('');
    const [badgeTargetUid, setBadgeTargetUid] = useState('');
    const [awardingBadge, setAwardingBadge] = useState(false);

    // Mission status filter
    const [missionStatusFilter, setMissionStatusFilter] = useState<'all' | Mission['status']>('all');

    // Load leaderboard + stats on mount / tab switch
    useEffect(() => {
        if (subTab === 'leaderboard') {
            setLoadingLeaderboard(true);
            Promise.all([
                karmaService.getLeaderboard('allTime', 50),
                adminService.getKarmaAdminStats(),
            ]).then(([lb, stats]) => {
                setLeaderboard(lb);
                setKarmaStats(stats);
            }).catch(err => {
                console.error('[GamificationTab] leaderboard load error:', err);
            }).finally(() => setLoadingLeaderboard(false));
        }
        if (subTab === 'missions') {
            setLoadingMissions(true);
            getDocs(collection(db, 'missions')).then(snap => {
                setMissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission)));
            }).catch(err => console.error('[GamificationTab] missions load error:', err))
              .finally(() => setLoadingMissions(false));
        }
    }, [subTab]);

    const loadKarmaForUser = async (uid: string) => {
        setLoadingKarmaUser(true);
        try {
            const [balance, history] = await Promise.all([
                karmaService.getBalance(uid),
                karmaService.getTransactionHistory(uid, 20),
            ]);
            setSelectedBalance(balance);
            setSelectedTxHistory(history);
        } catch (e: any) {
            addSnackbar('Failed to load karma: ' + e.message, 'error');
        }
        setLoadingKarmaUser(false);
    };

    const handleSelectKarmaUser = async (uid: string) => {
        setSelectedUserId(uid);
        await loadKarmaForUser(uid);
    };

    const handleAdjustKarma = async () => {
        if (!selectedUserId) return;
        setAdjusting(true);
        try {
            await adminService.adminAdjustKarma(currentUser.email, selectedUserId, adjustPoints, adjustReason || `Admin adjustment via ${adjustAction}`);
            addSnackbar(`Karma ${adjustPoints >= 0 ? 'awarded' : 'deducted'} successfully`, 'success');
            setShowAdjustModal(false);
            setAdjustPoints(0);
            setAdjustReason('');
            await loadKarmaForUser(selectedUserId);
        } catch (e: any) {
            addSnackbar(e.message, 'error');
        }
        setAdjusting(false);
    };

    const handleAwardBadge = async () => {
        if (!selectedBadge || !badgeTargetUid) return;
        setAwardingBadge(true);
        try {
            await adminService.adminAwardBadge(currentUser.email, badgeTargetUid, selectedBadge.name);
            addSnackbar(`Badge "${selectedBadge.name}" awarded successfully`, 'success');
            setShowBadgeModal(false);
            setBadgeTargetUid('');
            setBadgeUserSearch('');
            setSelectedBadge(null);
        } catch (e: any) {
            addSnackbar(e.message, 'error');
        }
        setAwardingBadge(false);
    };

    const handleMarkMissionComplete = async (missionId: string) => {
        try {
            await updateDoc(doc(db, 'missions', missionId), { status: 'completed' });
            setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: 'completed' as Mission['status'] } : m));
            addSnackbar('Mission marked as complete', 'success');
        } catch (e: any) {
            addSnackbar(e.message, 'error');
        }
    };

    const filteredMissions = missions.filter(m => missionStatusFilter === 'all' || m.status === missionStatusFilter);

    const filteredKarmaUsers = users.filter(u =>
        u.email.toLowerCase().includes(karmaUserSearch.toLowerCase()) ||
        u.uid.toLowerCase().includes(karmaUserSearch.toLowerCase())
    );

    const filteredBadgeUsers = users.filter(u =>
        u.email.toLowerCase().includes(badgeUserSearch.toLowerCase()) ||
        u.uid.toLowerCase().includes(badgeUserSearch.toLowerCase())
    );

    const subTabs: { id: GamSubTab; label: string; icon: string }[] = [
        { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
        { id: 'karma', label: 'Karma Management', icon: '⚡' },
        { id: 'badges', label: 'Badges', icon: '🎖️' },
        { id: 'missions', label: 'Missions', icon: '🗺️' },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <span className="text-3xl">🏆</span>
                    Gamification
                </h2>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-0">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 -mb-px ${
                            subTab === tab.id
                                ? 'border-primary text-white'
                                : 'border-transparent text-slate-500 hover:text-white hover:border-white/20'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Leaderboard Sub-tab */}
            {subTab === 'leaderboard' && (
                <div className="space-y-6">
                    {/* Tier Distribution Metrics */}
                    {karmaStats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {(['scout', 'tracker', 'ranger', 'guardian', 'legend'] as KarmaTier[]).map(tier => (
                                <MetricCard
                                    key={tier}
                                    title={tier.charAt(0).toUpperCase() + tier.slice(1)}
                                    value={karmaStats.tierDistribution[tier] || 0}
                                    icon={tier === 'legend' ? '⭐' : tier === 'guardian' ? '🛡️' : tier === 'ranger' ? '🌲' : tier === 'tracker' ? '🔍' : '🐾'}
                                    colorClass={`${TIER_COLORS[tier].split(' ')[0]} ${TIER_COLORS[tier].split(' ')[1]}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Leaderboard Table */}
                    {loadingLeaderboard ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs min-w-[700px]">
                                    <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                        <tr className="border-b border-white/10">
                                            <th className="p-4">Rank</th>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Tier</th>
                                            <th className="p-4">Karma</th>
                                            <th className="p-4">Patrol Km</th>
                                            <th className="p-4">Reunions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {leaderboard.map((entry) => (
                                            <tr key={entry.userId} className="hud-table-row group">
                                                <td className="p-4">
                                                    <span className={`font-black text-lg ${entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                        #{entry.rank}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-sm border border-primary/30">
                                                            {entry.avatarInitial}
                                                        </div>
                                                        <span className="font-mono text-slate-300 text-[10px]">{entry.userId.substring(0, 12)}…</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${TIER_COLORS[entry.tier]}`}>
                                                        {entry.tier}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-black text-primary">{entry.totalKarma.toLocaleString()}</td>
                                                <td className="p-4 font-mono text-slate-400">{entry.patrolKm.toFixed(1)}</td>
                                                <td className="p-4 font-mono text-slate-400">{entry.reunionsCount}</td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-10">
                                                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">No leaderboard data yet</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* Karma Management Sub-tab */}
            {subTab === 'karma' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Search */}
                        <div className="lg:col-span-1">
                            <GlassCard className="p-5 border-white/10 bg-black/40">
                                <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Select User</h3>
                                <div className="relative mb-3">
                                    <input
                                        value={karmaUserSearch}
                                        onChange={e => setKarmaUserSearch(e.target.value)}
                                        placeholder="Search by email or UID..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                                    {filteredKarmaUsers.slice(0, 20).map(u => (
                                        <button
                                            key={u.uid}
                                            onClick={() => handleSelectKarmaUser(u.uid)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono transition-colors ${selectedUserId === u.uid ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <p className="font-bold truncate">{u.email}</p>
                                            <p className="text-[8px] text-slate-600 truncate">{u.uid}</p>
                                        </button>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>

                        {/* Karma Details */}
                        <div className="lg:col-span-2 space-y-4">
                            {loadingKarmaUser ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            ) : selectedBalance ? (
                                <>
                                    <GlassCard className="p-5 border-white/10 bg-black/40">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Karma Balance</h3>
                                            <GlassButton
                                                onClick={() => setShowAdjustModal(true)}
                                                variant="primary"
                                                className="!py-2 !px-4 text-[10px]"
                                            >
                                                ⚡ Award / Deduct
                                            </GlassButton>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Total Earned', value: selectedBalance.totalEarned.toLocaleString() },
                                                { label: 'Current Balance', value: selectedBalance.currentBalance.toLocaleString() },
                                                { label: 'Streak Days', value: selectedBalance.streakDays.toString() },
                                                { label: 'Tier', value: selectedBalance.currentTier.toUpperCase() },
                                                { label: 'Rider Type', value: selectedBalance.riderType || 'None' },
                                                { label: 'Multiplier', value: `${selectedBalance.riderBonusMultiplier}x` },
                                            ].map(stat => (
                                                <div key={stat.label} className="p-3 bg-white/5 rounded-xl border border-white/10">
                                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                                                    <p className="font-black text-white text-sm">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>

                                    {/* Transaction History */}
                                    <GlassCard className="p-5 border-white/10 bg-black/40">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Last 20 Transactions</h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                            {selectedTxHistory.map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <div>
                                                        <p className="text-[10px] font-black text-white uppercase">{tx.action}</p>
                                                        <p className="text-[9px] text-slate-500 font-mono">{new Date(tx.timestamp).toLocaleString()}</p>
                                                    </div>
                                                    <span className={`font-black text-sm ${tx.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {tx.points >= 0 ? '+' : ''}{tx.points}
                                                    </span>
                                                </div>
                                            ))}
                                            {selectedTxHistory.length === 0 && (
                                                <p className="text-center text-slate-600 font-mono text-xs uppercase py-4">No transactions</p>
                                            )}
                                        </div>
                                    </GlassCard>
                                </>
                            ) : (
                                <GlassCard className="p-8 border-white/10 bg-black/40 flex items-center justify-center">
                                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Select a user to view karma</p>
                                </GlassCard>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Badges Sub-tab */}
            {subTab === 'badges' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {BADGES.map(badge => (
                            <GlassCard key={badge.id} className="p-4 border-white/10 bg-black/40 hover:border-primary/30 transition-all">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-2xl">{badge.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-white text-sm">{badge.name}</p>
                                        <span className="text-[8px] uppercase font-black text-primary/70 tracking-wider">{badge.category}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-3 line-clamp-2">{badge.description}</p>
                                <GlassButton
                                    onClick={() => { setSelectedBadge(badge); setShowBadgeModal(true); }}
                                    variant="secondary"
                                    className="w-full !py-1.5 text-[9px]"
                                >
                                    Award to User
                                </GlassButton>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Missions Sub-tab */}
            {subTab === 'missions' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Filter:</span>
                        {(['all', 'open', 'in_progress', 'completed', 'expired'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setMissionStatusFilter(status)}
                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                                    missionStatusFilter === status ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {loadingMissions ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs min-w-[800px]">
                                    <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                        <tr className="border-b border-white/10">
                                            <th className="p-4">Title</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Priority</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Karma Reward</th>
                                            <th className="p-4">Expires</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredMissions.map(mission => (
                                            <tr key={mission.id} className="hud-table-row group">
                                                <td className="p-4">
                                                    <p className="font-bold text-white">{mission.title}</p>
                                                    <p className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">{mission.description}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase border border-blue-500/30">
                                                        {mission.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${MISSION_PRIORITY_STYLES[mission.priority]}`}>
                                                        {mission.priority}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                                                        mission.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                        mission.status === 'open' ? 'bg-primary/20 text-primary border-primary/30' :
                                                        mission.status === 'expired' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                    }`}>
                                                        {mission.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-black text-primary">{mission.karmaReward}</td>
                                                <td className="p-4 text-slate-500 font-mono text-[9px]">
                                                    {mission.expiresAt ? new Date(mission.expiresAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {mission.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleMarkMissionComplete(mission.id)}
                                                            className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black text-[9px] tracking-widest border border-emerald-500/20"
                                                        >
                                                            Mark Complete
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredMissions.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10">
                                                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">No missions found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* Award/Deduct Karma Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-6 max-w-md w-full border-primary/30 bg-slate-950">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                            <span>⚡</span> Award / Deduct Karma
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Action Type</label>
                                <select
                                    value={adjustAction}
                                    onChange={e => {
                                        const a = e.target.value as KarmaAction;
                                        setAdjustAction(a);
                                        const found = KARMA_ACTIONS.find(k => k.value === a);
                                        if (found && found.points > 0) setAdjustPoints(found.points);
                                    }}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
                                >
                                    {KARMA_ACTIONS.map(a => (
                                        <option key={a.value} value={a.value}>{a.label} ({a.points > 0 ? `+${a.points}` : 'varies'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Points (negative to deduct)</label>
                                <input
                                    type="number"
                                    value={adjustPoints}
                                    onChange={e => setAdjustPoints(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reason</label>
                                <textarea
                                    value={adjustReason}
                                    onChange={e => setAdjustReason(e.target.value)}
                                    placeholder="Reason for adjustment..."
                                    rows={3}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <GlassButton
                                onClick={() => setShowAdjustModal(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </GlassButton>
                            <GlassButton
                                onClick={handleAdjustKarma}
                                variant="primary"
                                className="flex-1"
                                disabled={adjusting}
                            >
                                {adjusting ? 'Processing…' : `${adjustPoints >= 0 ? 'Award' : 'Deduct'} ${Math.abs(adjustPoints)} pts`}
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Award Badge Modal */}
            {showBadgeModal && selectedBadge && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-6 max-w-md w-full border-primary/30 bg-slate-950">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                            <span>{selectedBadge.icon}</span> Award Badge
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">Award "{selectedBadge.name}" to a user</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Search User</label>
                                <input
                                    value={badgeUserSearch}
                                    onChange={e => setBadgeUserSearch(e.target.value)}
                                    placeholder="Search by email..."
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary mb-2"
                                />
                                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                    {filteredBadgeUsers.slice(0, 10).map(u => (
                                        <button
                                            key={u.uid}
                                            onClick={() => setBadgeTargetUid(u.uid)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono transition-colors ${badgeTargetUid === u.uid ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:bg-white/5'}`}
                                        >
                                            {u.email}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <GlassButton
                                onClick={() => { setShowBadgeModal(false); setBadgeTargetUid(''); setBadgeUserSearch(''); }}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </GlassButton>
                            <GlassButton
                                onClick={handleAwardBadge}
                                variant="primary"
                                className="flex-1"
                                disabled={awardingBadge || !badgeTargetUid}
                            >
                                {awardingBadge ? 'Awarding…' : 'Award Badge'}
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
