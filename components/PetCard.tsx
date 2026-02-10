import React, { useState, useRef, memo } from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage } from './ui/CinematicImage';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { calculateProfileCompleteness } from '../services/geminiService';

// --- Types ---

export type PetCardVariant = 'owner' | 'community' | 'mission' | 'shelter';

interface BasePetCardProps {
    pet: PetProfile;
    className?: string;
}

interface OwnerPetCardProps extends BasePetCardProps {
    variant: 'owner';
    onMarkFound: (id: string) => void;
    onReportLost: (pet: PetProfile) => void;
    onEdit: (pet: PetProfile) => void;
    onShare: (pet: PetProfile) => void;
    onTransfer: (pet: PetProfile) => void;
    onHealthCheck: (pet: PetProfile) => void;
    onGenerateQR: (pet: PetProfile) => void;
    onViewDetail: (pet: PetProfile) => void;
}

interface CommunityPetCardProps extends BasePetCardProps {
    variant: 'community';
    onShare: (pet: PetProfile) => void;
    onViewDetail: (pet: PetProfile) => void;
    isGuardian?: boolean;
    onEdit?: (pet: PetProfile) => void;
}

interface MissionPetCardProps extends BasePetCardProps {
    variant: 'mission';
    onViewDetail: (pet: PetProfile) => void;
    distance?: string;
    points?: number;
    onClick?: () => void;
}

interface ShelterPetCardProps extends BasePetCardProps {
    variant: 'shelter';
    onViewDetail: (pet: PetProfile) => void;
    onEdit: (pet: PetProfile) => void;
    onAdopt: (pet: PetProfile) => void;
}

export type PetCardProps = OwnerPetCardProps | CommunityPetCardProps | MissionPetCardProps | ShelterPetCardProps;

// --- Sub-components / Helpers ---

const CompletenessRing: React.FC<{ score: number }> = memo(({ score }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score < 50 ? 'text-red-500' : score < 80 ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="relative flex items-center justify-center w-12 h-12 bg-black/40 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
            <svg className="transform -rotate-90 w-12 h-12">
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/20" />
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`transition-all duration-1000 ease-out ${color}`} />
            </svg>
            <span className={`absolute text-[10px] font-bold text-white font-mono`}>{score}%</span>
        </div>
    );
});

// --- Variant Implementations ---

const OwnerPetCard: React.FC<OwnerPetCardProps> = ({ 
    pet, onMarkFound, onReportLost, onEdit, onShare, onTransfer, onHealthCheck, onGenerateQR, onViewDetail 
}) => {
    const { t } = useTranslations();
    const isLost = pet.isLost;
    const completeness = calculateProfileCompleteness(pet);
    
    // 3D Tilt State
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -15; 
        const rotateY = ((x - centerX) / centerX) * 15;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
    };
    
    return (
        <div 
            className="group relative w-full h-[480px] perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <GlassCard 
                ref={cardRef}
                className="w-full h-full overflow-hidden transition-transform duration-200 ease-out transform-style-3d relative border-white/10"
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                }}
            >
                {/* 1. Background Image with Adaptive Overlay */}
                <div className="absolute inset-0 cursor-pointer" onClick={() => onViewDetail(pet)}>
                    <CinematicImage 
                        className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-110" 
                        src={pet.photos[0]?.url} 
                        alt={pet.name} 
                    />
                    {/* Cinematic Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent transition-opacity duration-300"></div>
                    
                    {/* Holographic Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundSize: '200% 200%', backgroundPosition: '0% 0%', transform: `translate(${rotation.y}px, ${rotation.x}px)`}}></div>
                </div>

                {/* 2. HUD SCANNING EFFECT (Only visible on Hover) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                    {/* Viewfinder Corners */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/70 rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/70 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/70 rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/70 rounded-br-lg"></div>

                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-primary shadow-[0_0_20px_rgba(45,212,191,0.8)] animate-[scan_2s_linear_infinite]"></div>
                    
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#2dd4bf1a_1px,transparent_1px),linear-gradient(to_bottom,#2dd4bf1a_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                    {/* Facial Recognition Box Simulation */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-40 h-40 border border-primary/50 rounded-lg shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                        <div className="absolute -top-6 left-0 text-[10px] text-primary font-mono bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-md border border-primary/20">{t('dashboard:common.targetLocked')}</div>
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                    </div>

                    {/* Data Points */}
                    <div className="absolute top-20 right-6 text-right space-y-2">
                        <div className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-1 rounded border-r-2 border-cyan-500 shadow-sm translate-x-4 group-hover:translate-x-0 transition-transform duration-300 delay-100">{t('dashboard:common.biometricMatch')}</div>
                        <div className="text-[10px] font-mono text-green-300 bg-slate-950/80 px-2 py-1 rounded border-r-2 border-green-500 shadow-sm translate-x-4 group-hover:translate-x-0 transition-transform duration-300 delay-200">{t('dashboard:common.vaccinationOk')}</div>
                        <div className="text-[10px] font-mono text-purple-300 bg-slate-950/80 px-2 py-1 rounded border-r-2 border-purple-500 shadow-sm translate-x-4 group-hover:translate-x-0 transition-transform duration-300 delay-300">{t('dashboard:common.gpsActive')}</div>
                    </div>
                </div>

                {/* 3. Top Status Bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 transform translate-z-20">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-md border shadow-lg ${isLost ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-emerald-500/80 border-emerald-400 text-white'}`}>
                        {isLost ? '🚨 SIGNAL LOST' : '● SECURE'}
                    </span>
                    <CompletenessRing score={completeness} />
                </div>

                {/* 4. Main Info */}
                <div className="absolute bottom-28 left-6 z-20 transition-transform duration-500 group-hover:-translate-y-6 transform translate-z-30">
                    <h3 className="text-4xl font-extrabold text-white leading-none tracking-tight drop-shadow-md cursor-pointer" onClick={() => onViewDetail(pet)}>{pet.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-cyan-200 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30 backdrop-blur-sm">{pet.breed}</span>
                        <span className="text-xs font-mono text-purple-200 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30 backdrop-blur-sm">{pet.age}</span>
                    </div>
                </div>

                {/* 5. Action Panel (Slide Up on Hover) */}
                <GlassCard className="absolute bottom-0 left-0 w-full rounded-none border-t border-white/10 p-5 transform translate-y-[65%] group-hover:translate-y-0 transition-transform duration-500 ease-out z-30 translate-z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] bg-slate-900/90 backdrop-blur-2xl">
                    
                    {/* Visible Strip (Buttons Preview) */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(pet); }} className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-white/10 rounded-full" title={t('editButton')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onHealthCheck(pet); }} className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-full" title={t('aiHealthCheckButton')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>
                        </div>
                        {/* Animated Arrow Indicator */}
                        <div className="text-primary animate-bounce group-hover:opacity-0 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </div>
                    </div>

                    {/* Expanded Controls */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <GlassButton onClick={(e) => { e.stopPropagation(); onGenerateQR(pet); }} variant="secondary" className="text-[10px] py-2 flex flex-col items-center gap-1 h-auto border-white/5 hover:border-primary/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zm-6 12v-2m0 0l-3-3m3 3l3-3m2 8H9m13 0h-3m3 0v-3m0 3v3m-3-3h3m-6 0v-3m0 3h3m-3 0v3m-3-3h3" /></svg>
                            Tag
                        </GlassButton>
                        <GlassButton onClick={(e) => { e.stopPropagation(); onShare(pet); }} variant="secondary" className="text-[10px] py-2 flex flex-col items-center gap-1 h-auto border-white/5 hover:border-blue-500/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Share
                        </GlassButton>
                        <GlassButton onClick={(e) => { e.stopPropagation(); onTransfer(pet); }} variant="secondary" className="text-[10px] py-2 flex flex-col items-center gap-1 h-auto text-red-400 border-white/5 hover:border-red-500/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            Transfer
                        </GlassButton>
                    </div>

                    {/* Primary State Button */}
                    {pet.isLost ? (
                        <GlassButton onClick={(e) => { e.stopPropagation(); onMarkFound(pet.id); }} variant="primary" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 border-green-400/50 py-3 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {t('markFoundButton')}
                        </GlassButton>
                    ) : (
                        <GlassButton onClick={(e) => { e.stopPropagation(); onReportLost(pet); }} variant="danger" className="w-full py-3 text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {t('reportLostButton')}
                        </GlassButton>
                    )}
                </GlassCard>
            </GlassCard>
        </div>
    );
};

const CommunityPetCard: React.FC<CommunityPetCardProps> = ({ pet, onShare, onViewDetail, isGuardian, onEdit }) => {
    const { t } = useTranslations();
    const statusColor = pet.isLost 
        ? 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30' 
        : 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
    
    return (
        <div 
            className="bg-card rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg border border-border cursor-pointer active:scale-95 transition-transform" 
            onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                onViewDetail(pet);
            }}
        >
            <div className="md:flex">
                <div className="md:flex-shrink-0 w-full md:w-48 h-48 relative">
                    <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-bold text-card-foreground">{pet.name}</h3>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColor}`}>{pet.isLost ? t('statusLost') : t('statusSafe')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pet.breed}</p>
                        <p className="text-xs text-muted-foreground mt-2">{t('guardians')}: {pet.guardianEmails.length}</p>
                    </div>
                    <div className="mt-4 flex flex-row items-center justify-end gap-3">
                        {isGuardian && onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(pet); }} className="btn btn-ghost !py-1 !px-2 text-sm">{t('editButton')}</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onShare(pet); }} className="btn btn-secondary !py-2 !px-4 text-sm">{t('shareButton')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MissionPetCard: React.FC<MissionPetCardProps> = ({ pet, distance, points, onClick, onViewDetail }) => (
    <div 
        onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            if (onViewDetail) onViewDetail(pet);
            else if (onClick) onClick();
        }} 
        className="bg-[#0f172a]/60 hover:bg-primary/10 border border-white/5 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] flex items-center gap-5 group relative overflow-hidden active:scale-95"
    >
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors"></div>
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
            <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover" />
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

const ShelterPetCard: React.FC<ShelterPetCardProps> = ({ pet, onEdit, onAdopt, onViewDetail }) => {
    const { t } = useTranslations();
    return (
        <div 
            className="bg-card rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-border group cursor-pointer active:scale-95" 
            onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                onViewDetail(pet);
            }}
        >
            <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                    <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                        Available
                    </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-bold text-card-foreground">{pet.name}</h3>
                            <span className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">ID: {pet.id.substring(0, 6)}</span>
                        </div>
                        <p className="text-sm font-medium text-primary mt-1">{pet.breed} • {pet.age}</p>
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{pet.behavior}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 sm:justify-end">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(pet); }} className="btn btn-secondary text-sm !px-4 !py-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            {t('editButton')}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onAdopt(pet); }} className="btn btn-primary text-sm !px-4 !py-2 shadow-md flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                            {t('markAsAdoptedButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export const PetCard: React.FC<PetCardProps> = (props) => {
    switch (props.variant) {
        case 'owner':
            return <OwnerPetCard {...props} />;
        case 'community':
            return <CommunityPetCard {...props} />;
        case 'mission':
            return <MissionPetCard {...props} />;
        case 'shelter':
            return <ShelterPetCard {...props} />;
        default:
            return null;
    }
};

export default PetCard;
