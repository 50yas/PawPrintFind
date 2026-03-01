
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PetProfile, View, RiderType, KarmaBalance, PartnerStore, Mission, KarmaTransaction } from '../types';
import { dbService } from '../services/firebase';
import { karmaService } from '../services/karmaService';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePatrol } from '../hooks/usePatrol';
import { useNearbyPets } from '../hooks/useNearbyPets';
import { useWaitingMode } from '../hooks/useWaitingMode';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard } from './ui/GlassCard';

/** Returns true when the user is an anonymous guest (no Firestore account). */
const isAnonymousUser = (user: User): boolean =>
    user.email === 'anonymous@pawprint.ai' || user.badges?.includes('Guest');

interface RiderMissionCenterProps {
    user: User;
    lostPets: PetProfile[];
    setView: (view: View) => void;
    onViewPet: (pet: PetProfile) => void;
    onLogout: () => void;
}

const RIDER_TYPE_INFO: Record<RiderType, { label: string; icon: string; color: string }> = {
    bicycle: { label: 'Bicycle', icon: '🚲', color: 'text-green-400' },
    ebike: { label: 'E-Bike', icon: '⚡', color: 'text-yellow-400' },
    monowheel: { label: 'Monowheel', icon: '🎡', color: 'text-purple-400' },
    scooter: { label: 'Scooter', icon: '🛵', color: 'text-blue-400' },
    motorcycle: { label: 'Motorcycle', icon: '🏍️', color: 'text-red-400' },
    food_delivery: { label: 'Food Delivery', icon: '📦', color: 'text-orange-400' },
    walking: { label: 'Walking', icon: '🚶', color: 'text-teal-400' },
};

const TIER_COLORS: Record<string, string> = {
    scout: 'text-gray-400',
    tracker: 'text-green-400',
    ranger: 'text-blue-400',
    guardian: 'text-purple-400',
    legend: 'text-yellow-400',
};

const TIER_ICONS: Record<string, string> = {
    scout: '🔭',
    tracker: '🐾',
    ranger: '🌲',
    guardian: '🛡️',
    legend: '👑',
};

export const RiderMissionCenter: React.FC<RiderMissionCenterProps> = ({
    user,
    lostPets,
    setView,
    onViewPet,
    onLogout,
}) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState<'patrol' | 'missions' | 'store' | 'history'>('patrol');
    const [karmaBalance, setKarmaBalance] = useState<KarmaBalance | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [partnerStores, setPartnerStores] = useState<PartnerStore[]>([]);
    const [karmaHistory, setKarmaHistory] = useState<KarmaTransaction[]>([]);
    const [riderType, setRiderType] = useState<RiderType>('walking');
    const [showRiderSetup, setShowRiderSetup] = useState(true);
    const [vehicleName, setVehicleName] = useState('');
    const [deliveryPlatform, setDeliveryPlatform] = useState('');
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [redeemingStore, setRedeemingStore] = useState<PartnerStore | null>(null);
    const [redeemMessage, setRedeemMessage] = useState('');

    const anonymous = isAnonymousUser(user);

    const { location, getLocation } = useGeolocation();
    // Pass isAnonymous so the hook skips Firestore writes for guest users
    const patrol = usePatrol(user.uid, riderType, undefined, anonymous);
    const { nearbyPets, count: nearbyCount } = useNearbyPets(location, 5);
    // Pass empty string for userId when anonymous so useWaitingMode makes no Firestore calls
    const waitingMode = useWaitingMode(riderType === 'food_delivery', location, anonymous ? '' : user.uid);

    // Load karma data — skipped for anonymous users (would trigger Firestore permission errors)
    useEffect(() => {
        if (anonymous) return;
        getLocation();
        karmaService.getBalance(user.uid).then(setKarmaBalance).catch(console.error);
        dbService.getKarmaHistory(user.uid, 20).then(setKarmaHistory).catch(console.error);
        dbService.getPartnerStores().then(setPartnerStores).catch(console.error);
    }, [user.uid, anonymous]);

    // Load missions
    useEffect(() => {
        if (anonymous) return;
        // Simplified: load open missions from dbService
        // In production, filter by proximity to user location
        setMissions([]); // Missions will be populated via Cloud Functions when pets go lost
    }, [anonymous]);

    // Anonymous gate: show sign-in prompt after all hooks have been called
    if (anonymous) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="w-full max-w-md"
                >
                    <GlassCard className="p-10 text-center border border-primary/20 shadow-[0_0_40px_rgba(20,184,166,0.08)]">
                        <div className="text-6xl mb-5">🐾</div>
                        <h2 className="text-2xl font-black text-white mb-3">
                            Sign In Required
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            The Rider Mission Center is available to registered users only.
                            Create a free account to earn Karma Points, patrol for lost pets,
                            and redeem rewards at partner stores.
                        </p>
                        <button
                            onClick={() => {
                                addSnackbar('Please sign in to access the Rider Mission Center', 'info');
                                setView('home');
                            }}
                            className="w-full bg-gradient-to-r from-primary to-teal-500 text-slate-900 font-black uppercase rounded-2xl py-4 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_35px_rgba(20,184,166,0.5)] hover:-translate-y-0.5 transition-all"
                        >
                            Sign In / Create Account
                        </button>
                        <button
                            onClick={() => setView('home')}
                            className="w-full mt-3 text-slate-500 text-sm hover:text-slate-300 transition-colors"
                        >
                            Back to Home
                        </button>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    const handleRiderSetup = async () => {
        setIsSettingUp(true);
        try {
            await dbService.setRiderType(user.uid, riderType, vehicleName, deliveryPlatform);
            setShowRiderSetup(false);
        } catch (e) {
            console.error('Failed to set rider type:', e);
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleRedeem = async (store: PartnerStore) => {
        setRedeemingStore(store);
        try {
            const result = await dbService.redeemKarma(user.uid, store.id, store.karmaPointsAccepted);
            setRedeemMessage(`Redemption code: ${result.redemptionCode} — Valid 30 days. Show this to the store!`);
            // Refresh balance
            karmaService.getBalance(user.uid).then(setKarmaBalance);
        } catch (e: any) {
            setRedeemMessage(e.message || 'Redemption failed');
        }
    };

    const tierInfo = karmaBalance ? {
        tier: karmaBalance.currentTier,
        icon: TIER_ICONS[karmaBalance.currentTier] || '🔭',
        color: TIER_COLORS[karmaBalance.currentTier] || 'text-gray-400',
    } : null;

    // Rider setup modal
    if (showRiderSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <GlassCard className="p-8">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">🏍️</div>
                            <h1 className="text-2xl font-black text-white mb-2">Rider Setup</h1>
                            <p className="text-slate-400 text-sm">Choose your vehicle to earn bonus Karma Points</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {(Object.keys(RIDER_TYPE_INFO) as RiderType[]).map(type => {
                                const info = RIDER_TYPE_INFO[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setRiderType(type)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                            riderType === type
                                                ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                        }`}
                                    >
                                        <div className="text-3xl mb-1">{info.icon}</div>
                                        <div className={`text-xs font-bold ${info.color}`}>{info.label}</div>
                                        {type === 'food_delivery' && (
                                            <div className="text-[9px] text-orange-400 mt-1 font-bold">+50% BONUS</div>
                                        )}
                                        {type === 'monowheel' && (
                                            <div className="text-[9px] text-purple-400 mt-1 font-bold">+30% BONUS</div>
                                        )}
                                        {type === 'bicycle' && (
                                            <div className="text-[9px] text-green-400 mt-1 font-bold">+20% BONUS</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Vehicle Name <span className="text-slate-600">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={vehicleName}
                                    onChange={e => setVehicleName(e.target.value)}
                                    placeholder="e.g. KingSong S22, Trek FX3..."
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none"
                                />
                            </div>
                            {riderType === 'food_delivery' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Delivery Platform <span className="text-slate-600">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={deliveryPlatform}
                                        onChange={e => setDeliveryPlatform(e.target.value)}
                                        placeholder="Uber Eats, Deliveroo, Glovo..."
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRiderSetup}
                            disabled={isSettingUp}
                            className="w-full bg-gradient-to-r from-primary to-teal-500 text-slate-900 font-black uppercase rounded-2xl py-4 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all disabled:opacity-50"
                        >
                            {isSettingUp ? 'Setting up...' : 'Start Earning Karma'}
                        </button>
                        <button
                            onClick={() => setShowRiderSetup(false)}
                            className="w-full mt-3 text-slate-500 text-sm hover:text-white transition-colors"
                        >
                            Skip for now
                        </button>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-white flex items-center gap-2">
                                {RIDER_TYPE_INFO[riderType]?.icon} Rider Mission Center
                            </h1>
                            {karmaBalance && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={TIER_COLORS[karmaBalance.currentTier]}>
                                        {TIER_ICONS[karmaBalance.currentTier]} {karmaBalance.currentTier.toUpperCase()}
                                    </span>
                                    <span className="text-slate-500">·</span>
                                    <span className="text-primary font-bold">{karmaBalance.currentBalance.toLocaleString()} karma</span>
                                    {karmaBalance.streakDays > 1 && (
                                        <>
                                            <span className="text-slate-500">·</span>
                                            <span className="text-orange-400">🔥 {karmaBalance.streakDays}d streak</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRiderSetup(true)}
                        className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
                    >
                        {RIDER_TYPE_INFO[riderType]?.icon} {RIDER_TYPE_INFO[riderType]?.label}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Waiting Mode Alert (food delivery riders) */}
                <AnimatePresence>
                    {waitingMode.isWaiting && waitingMode.nearbyAlerts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6 p-4 rounded-2xl bg-orange-500/20 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">📦</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-orange-300 text-sm">Waiting Mode Active</h3>
                                    <p className="text-xs text-slate-300 mt-1">
                                        You've been stationary for {Math.floor(waitingMode.idleSeconds / 60)}min.
                                        <strong className="text-orange-300"> {waitingMode.nearbyAlerts.length} lost pet{waitingMode.nearbyAlerts.length > 1 ? 's' : ''}</strong> within 1km need your help!
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        {waitingMode.nearbyAlerts.slice(0, 3).map(pet => (
                                            <button
                                                key={pet.id}
                                                onClick={() => onViewPet(pet)}
                                                className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2 hover:bg-black/50 transition-all text-xs"
                                            >
                                                <span>{pet.type === 'cat' ? '🐱' : '🐶'}</span>
                                                <span className="text-white font-medium">{pet.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={waitingMode.dismiss} className="text-slate-500 hover:text-white p-1 transition-colors">✕</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-black/40 rounded-2xl mb-6 border border-white/10">
                    {([
                        { id: 'patrol', label: 'Patrol', icon: '🗺️' },
                        { id: 'missions', label: `Missions${missions.length > 0 ? ` (${missions.length})` : ''}`, icon: '🎯' },
                        { id: 'store', label: 'Karma Store', icon: '🏪' },
                        { id: 'history', label: 'History', icon: '📜' },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                activeTab === tab.id
                                    ? 'bg-primary/80 text-white shadow-[0_0_10px_rgba(20,184,166,0.4)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="mr-1">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* PATROL TAB */}
                {activeTab === 'patrol' && (
                    <div className="space-y-6">
                        {/* Patrol Control */}
                        <GlassCard className="p-6">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                Patrol Control
                            </h2>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white font-mono">{patrol.formattedTime}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Time</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black text-primary">{patrol.patrolDistance.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">km</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black text-yellow-400">+{patrol.karmaEarned}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Karma</div>
                                </div>
                            </div>
                            {patrol.error && (
                                <p className="text-xs text-red-400 mb-4 text-center bg-red-500/10 p-3 rounded-xl">{patrol.error}</p>
                            )}
                            <button
                                onClick={patrol.isPatrolling ? patrol.stopPatrol : patrol.startPatrol}
                                className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider transition-all ${
                                    patrol.isPatrolling
                                        ? 'bg-red-500/80 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                                        : 'bg-gradient-to-r from-primary to-teal-500 text-slate-900 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:-translate-y-1'
                                }`}
                            >
                                {patrol.isPatrolling ? '🛑 Stop Patrol' : '🚀 Start Patrol'}
                            </button>
                            {patrol.isPatrolling && (
                                <p className="text-center text-xs text-slate-500 mt-3">
                                    Earning {Math.round(10 * karmaService.getRiderMultiplier(riderType) * karmaService.calculateStreakMultiplier(karmaBalance?.streakDays || 0))} karma/km · GPS tracking active
                                </p>
                            )}
                        </GlassCard>

                        {/* Nearby Lost Pets */}
                        <GlassCard className="p-6">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>📍</span>
                                Nearby Lost Pets
                                {nearbyCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        {nearbyCount}
                                    </span>
                                )}
                            </h2>
                            {!location && (
                                <div className="text-center py-6">
                                    <p className="text-slate-400 text-sm mb-3">Enable location to see nearby pets</p>
                                    <button onClick={getLocation} className="text-primary text-sm font-bold hover:underline">
                                        Enable Location
                                    </button>
                                </div>
                            )}
                            {location && nearbyPets.length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-6">No lost pets within 5km. Keep patrolling!</p>
                            )}
                            <div className="space-y-3">
                                {nearbyPets.slice(0, 5).map(pet => (
                                    <motion.button
                                        key={pet.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => onViewPet(pet)}
                                        className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all text-left"
                                    >
                                        <div className="text-3xl">
                                            {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐾'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white">{pet.name}</div>
                                            <div className="text-xs text-slate-400">{pet.breed} · {pet.color}</div>
                                        </div>
                                        <div className="text-xs text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-lg">LOST</div>
                                    </motion.button>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Karma Breakdown */}
                        {karmaBalance && (
                            <GlassCard className="p-6">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                                    Your Karma Stats
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-primary">{karmaBalance.totalEarned.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500 mt-1">Total Earned</div>
                                    </div>
                                    <div className="bg-black/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-yellow-400">{karmaBalance.currentBalance.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500 mt-1">Available</div>
                                    </div>
                                    <div className="bg-black/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-teal-400">{karmaBalance.monthlyStats.patrolKm.toFixed(1)}</div>
                                        <div className="text-xs text-slate-500 mt-1">km this month</div>
                                    </div>
                                    <div className="bg-black/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-orange-400">{karmaBalance.monthlyStats.sightings}</div>
                                        <div className="text-xs text-slate-500 mt-1">Sightings this month</div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">Your multiplier</span>
                                        <span className="text-primary font-bold">
                                            {karmaService.getRiderMultiplier(riderType)}x rider
                                            {karmaBalance.streakDays > 1 && ` × ${karmaService.calculateStreakMultiplier(karmaBalance.streakDays).toFixed(2)}x streak`}
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                    </div>
                )}

                {/* MISSIONS TAB */}
                {activeTab === 'missions' && (
                    <div className="space-y-4">
                        {missions.length === 0 ? (
                            <GlassCard className="p-12 text-center">
                                <div className="text-6xl mb-4">🎯</div>
                                <h3 className="text-lg font-bold text-white mb-2">No Active Missions</h3>
                                <p className="text-slate-400 text-sm">Missions are created automatically when pets go missing. Check back soon or start a patrol!</p>
                                <button
                                    onClick={() => setActiveTab('patrol')}
                                    className="mt-4 bg-primary/20 text-primary border border-primary/30 px-6 py-3 rounded-xl font-bold hover:bg-primary/30 transition-all"
                                >
                                    Go to Patrol
                                </button>
                            </GlassCard>
                        ) : (
                            missions.map(mission => (
                                <GlassCard key={mission.id} className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                                            mission.priority === 'critical' ? 'bg-red-500 animate-ping' :
                                            mission.priority === 'high' ? 'bg-orange-500' :
                                            mission.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                                        }`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-white text-sm">{mission.title}</h3>
                                                <span className="text-yellow-400 font-black text-sm">+{mission.karmaReward} karma</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-3">{mission.description}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-1 rounded-lg">{mission.type.replace('_', ' ')}</span>
                                                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-1 rounded-lg">{mission.zoneRadiusKm}km zone</span>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                )}

                {/* KARMA STORE TAB */}
                {activeTab === 'store' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-black text-white">Partner Stores</h2>
                            {karmaBalance && (
                                <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                                    {karmaBalance.currentBalance.toLocaleString()} karma
                                </div>
                            )}
                        </div>
                        {partnerStores.length === 0 ? (
                            <GlassCard className="p-12 text-center">
                                <div className="text-6xl mb-4">🏪</div>
                                <h3 className="text-lg font-bold text-white mb-2">Coming Soon!</h3>
                                <p className="text-slate-400 text-sm">Partner stores and vet clinics will be listed here. Earn karma now and redeem for discounts!</p>
                            </GlassCard>
                        ) : (
                            partnerStores.map(store => {
                                const canAfford = (karmaBalance?.currentBalance || 0) >= store.karmaPointsAccepted;
                                return (
                                    <GlassCard key={store.id} className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl">
                                                {store.type === 'vet_clinic' ? '🏥' :
                                                 store.type === 'pet_shop' ? '🐾' :
                                                 store.type === 'pet_food' ? '🦴' : '🏪'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white">{store.name}</div>
                                                <div className="text-xs text-slate-400 mb-2">{store.address}</div>
                                                <div className="text-sm text-primary font-bold mb-3">{store.rewardDescription}</div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500">{store.karmaPointsAccepted} karma required</span>
                                                    {redeemingStore?.id === store.id && redeemMessage ? (
                                                        <div className="text-xs text-green-400 font-bold max-w-xs text-right">{redeemMessage}</div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRedeem(store)}
                                                            disabled={!canAfford}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                                canAfford
                                                                    ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                                                                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {canAfford ? 'Redeem' : 'Not enough karma'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                );
                            })
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-black text-white mb-4">Karma History</h2>
                        {karmaHistory.length === 0 ? (
                            <GlassCard className="p-8 text-center">
                                <p className="text-slate-400 text-sm">No karma transactions yet. Start patrolling!</p>
                            </GlassCard>
                        ) : (
                            karmaHistory.map(tx => (
                                <div key={tx.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="text-xl">
                                        {tx.action === 'sighting_report' ? '🔭' :
                                         tx.action === 'successful_reunion' ? '🤝' :
                                         tx.action === 'search_patrol' ? '🗺️' :
                                         tx.action === 'patrol_time' ? '⏱️' :
                                         tx.action === 'waiting_mode_scan' ? '📦' : '⭐'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-white capitalize">{tx.action.replace(/_/g, ' ')}</div>
                                        <div className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-sm font-black text-primary">+{tx.points}</div>
                                    {tx.multiplier > 1 && (
                                        <div className="text-[10px] text-yellow-400">{tx.multiplier.toFixed(1)}x</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
