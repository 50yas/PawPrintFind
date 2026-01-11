
import React, { useState, useEffect, useRef } from 'react';
import { User, PetProfile, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { calculateDistance } from '../components/FoundPet'; 

interface VolunteerDashboardProps {
    user: User;
    lostPets: PetProfile[];
    setView: (view: View) => void;
    onLogout: () => void;
}

const MissionCard: React.FC<{ pet: PetProfile, distance: string, points: number, onClick: () => void }> = ({ pet, distance, points, onClick }) => (
    <div onClick={onClick} className="bg-[#0f172a]/60 hover:bg-primary/10 border border-white/5 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] flex items-center gap-5 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors"></div>
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
            <img src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay"></div>
        </div>
        <div className="flex-grow relative z-10">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-white text-xl group-hover:text-primary transition-colors tracking-tight">{pet.name}</h4>
                <span className="text-[10px] font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">+{points} XP_BOUNTY</span>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{pet.breed} • SIGNAL_LOST</p>
            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-red-400 bg-red-400/5 w-fit px-2 py-0.5 rounded border border-red-400/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 animate-ping" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                GEOTAG: {distance} FROM_YOU
            </div>
        </div>
    </div>
);

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ user, lostPets, setView, onLogout }) => {
    const { t } = useTranslations();

    const [isPatrolling, setIsPatrolling] = useState(false);
    const [patrolTime, setPatrolTime] = useState(0);
    const [patrolDistance, setPatrolDistance] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [progressToNext, setProgressToNext] = useState(0);
    
    // GPS Refs
    const watchIdRef = useRef<number | null>(null);
    const lastPositionRef = useRef<{lat: number, lng: number} | null>(null);

    // Gamification Logic
    useEffect(() => {
        const points = user.points || 0;
        const level = Math.floor(points / 500) + 1;
        const nextLevelPoints = level * 500;
        const currentLevelStart = (level - 1) * 500;
        const progress = ((points - currentLevelStart) / (nextLevelPoints - currentLevelStart)) * 100;
        
        setCurrentLevel(level);
        setProgressToNext(progress);
    }, [user.points]);

    // Real Patrol Logic
    useEffect(() => {
        let interval: any;
        
        if (isPatrolling) {
            interval = setInterval(() => {
                setPatrolTime(prev => prev + 1);
            }, 1000);

            if (navigator.geolocation) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                        if (lastPositionRef.current) {
                            const dist = calculateDistance(
                                { latitude: lastPositionRef.current.lat, longitude: lastPositionRef.current.lng },
                                { latitude: newPos.lat, longitude: newPos.lng }
                            );
                            if (dist > 0.005) { // 5 meters threshold
                                setPatrolDistance(prev => prev + dist);
                                lastPositionRef.current = newPos;
                            }
                        } else {
                            lastPositionRef.current = newPos;
                        }
                    },
                    (error) => console.error("GPS Error:", error),
                    { enableHighAccuracy: true }
                );
            }
        } else {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            lastPositionRef.current = null;
        }

        return () => {
            clearInterval(interval);
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [isPatrolling]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24 px-4 font-mono-tech">
            {/* VOLUNTEER IDENTITY CARD */}
            <div className="bg-[#050508] rounded-3xl p-8 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden border border-primary/20 group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8 w-full">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary p-[2px] shadow-[0_0_30px_rgba(20,184,166,0.4)]">
                                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center text-4xl font-bold font-mono">
                                    {user.email.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-black"></div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-black tracking-tight text-white">{t('volunteerTitle')}</h1>
                                <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Rank: Guardian_Level_{currentLevel}</span>
                            </div>
                            <p className="text-slate-500 text-xs font-mono mt-2 uppercase tracking-tighter">Verified Social Protector // Network Node: {user.email}</p>
                            
                            {/* XP HUD */}
                            <div className="mt-6 w-full max-w-lg bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between text-[10px] text-primary mb-2 font-mono font-bold tracking-widest uppercase">
                                    <span>XP_ACCUMULATED: {user.points}</span>
                                    <span>NEXT_LEVEL_IN: {currentLevel * 500 - user.points}</span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary transition-all duration-1000 relative shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${progressToNext}%` }}>
                                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={onLogout} className="flex-shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                        LOGOUT_SESSION
                    </button>
                </div>
            </div>

            {/* MISSION CONTROL */}
            <div className="grid lg:grid-cols-2 gap-10">
                <div className="glass-panel border-white/10 rounded-3xl p-1 bg-slate-900/40 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-[#0a0a0c] h-full rounded-[22px] p-8 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
                        <div className="space-y-3">
                            <h2 className={`text-3xl font-black tracking-tighter uppercase ${isPatrolling ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                                {isPatrolling ? '● ACTIVE_PATROL' : 'INITIATE_SEARCH'}
                            </h2>
                            <p className="text-sm text-slate-500 max-w-sm font-medium tracking-wide">{t('dashboard:volunteer.helpLocate')}</p>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setIsPatrolling(!isPatrolling)}
                                className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 transform active:scale-95 group ${
                                    isPatrolling 
                                    ? 'border-red-600 bg-red-600/10' 
                                    : 'border-primary bg-primary/5 hover:bg-primary/20 hover:shadow-[0_0_40px_rgba(20,184,166,0.3)]'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 transition-all duration-500 ${isPatrolling ? 'text-red-600 scale-110' : 'text-primary group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isPatrolling ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    )}
                                </svg>
                                <span className="text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">{isPatrolling ? 'STOP_SIGNAL' : 'START_LINK'}</span>
                            </button>
                            {isPatrolling && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-[ping_1.5s_infinite] opacity-30"></div>}
                        </div>

                        {isPatrolling && (
                            <div className="grid grid-cols-2 gap-8 w-full pt-4 animate-fade-in">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="text-3xl font-bold text-white tracking-tighter">{formatTime(patrolTime)}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{t('dashboard:volunteer.sessionTime')}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="text-3xl font-bold text-white tracking-tighter">{patrolDistance.toFixed(2)} km</div>
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{t('dashboard:volunteer.coverage')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TARGET ANALYTICS / MISSIONS */}
                <div className="glass-panel border-white/10 rounded-3xl p-8 bg-slate-900/30 flex flex-col h-[520px]">
                    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                        <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                            Active_Bounties
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-white/5">{lostPets.length} SECTORS_ACTIVE</span>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-3">
                        {lostPets.length > 0 ? lostPets.map(pet => (
                            <MissionCard 
                                key={pet.id} 
                                pet={pet} 
                                distance="SCANNING..." 
                                points={250} 
                                onClick={() => setView('find')}
                            />
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                                <div className="text-5xl">📡</div>
                                <p className="text-xs uppercase tracking-widest font-bold">{t('dashboard:volunteer.scanning')}</p>
                                <p className="text-[10px] font-medium text-slate-500">{t('dashboard:volunteer.secure')}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-white/10 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{t('dashboard:volunteer.protocolVersion')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
