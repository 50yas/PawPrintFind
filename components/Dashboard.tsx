
import React, { useState, memo, useRef, useEffect } from 'react';
import { PetProfile, User, Geolocation, ChatSession, Appointment, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SightingsMap } from './SightingsMap';
import { ReportLostModal } from './ReportLostModal';
import { SharePetModal } from './SharePetModal';
import { calculateProfileCompleteness } from '../services/geminiService';
import { Modal } from './Modal';
import { OwnerPetDetailModal } from './OwnerPetDetailModal';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { CinematicImage } from './ui/CinematicImage';

interface DashboardProps {
  user: User;
  userPets: PetProfile[];
  appointments?: Appointment[];
  onReportLost: (petId: string, location: Geolocation, radius: number) => void;
  onMarkFound: (petId: string) => void;
  onEditPet: (pet: PetProfile) => void;
  onRegisterNew: () => void;
  setView: (view: View) => void;
  chatSessions: ChatSession[];
  onOpenChat: (sessionId: string) => void;
  onRequestAppointment: (pet: PetProfile) => void;
  onLinkVet: (pet: PetProfile) => void;
  onSharePet: (pet: PetProfile, friendEmails: string[]) => void;
  onHealthCheck: (pet: PetProfile) => void;
  onTransferOwnership: (pet: PetProfile) => void;
  onLogout?: () => void;
}

const QRCodeModal: React.FC<{ pet: PetProfile; onClose: () => void }> = ({ pet, onClose }) => {
    const { t } = useTranslations();
    const qrData = `https://pawprint.ai/p/${pet.id}`; 
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=14b8a6`;

    return (
        <Modal isOpen={true} onClose={onClose} title={t('petTagTitle')}>
            <div className="flex flex-col items-center">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center mb-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-2 overflow-hidden border-2 border-primary">
                        <img src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                    <p className="text-xs text-gray-500 mb-4">{t('scanToViewProfile')}</p>
                    <img src={qrImageUrl} alt="QR Code" className="w-40 h-40 mx-auto" />
                    <p className="text-[10px] text-gray-400 mt-2 font-mono">ID: {pet.aiIdentityCode || pet.id.substring(0, 8)}</p>
                </div>
                <div className="flex gap-2 w-full">
                    <button onClick={onClose} className="flex-1 btn btn-secondary">{t('closeButton')}</button>
                    <button className="flex-1 btn btn-primary" onClick={() => window.print()}>{t('printButton')}</button>
                </div>
            </div>
        </Modal>
    );
};

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

// NEW: ENHANCED HOLOGRAPHIC PET CARD
const PetCard: React.FC<{ 
    pet: PetProfile; 
    onMarkFound: (petId: string) => void; 
    onReportLostClick: (pet: PetProfile) => void; 
    onEditPet: (pet: PetProfile) => void; 
    onRequestAppointment: (pet: PetProfile) => void;
    onLinkVet: (pet: PetProfile) => void;
    onShare: (pet: PetProfile) => void;
    onHealthCheck: (pet: PetProfile) => void;
    onTransferOwnership: (pet: PetProfile) => void;
    onGenerateQR: (pet: PetProfile) => void;
    onViewDetail: (pet: PetProfile) => void;
}> = memo(({ pet, onMarkFound, onReportLostClick, onEditPet, onRequestAppointment, onLinkVet, onShare, onHealthCheck, onTransferOwnership, onGenerateQR, onViewDetail }) => {
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
        
        const rotateX = ((y - centerY) / centerY) * -15; // Increased tilt range for more pop
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

                    {/* Scanning Line - Cyan for tech feel */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-primary shadow-[0_0_20px_rgba(45,212,191,0.8)] animate-[scan_2s_linear_infinite]"></div>
                    
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#2dd4bf1a_1px,transparent_1px),linear-gradient(to_bottom,#2dd4bf1a_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                    {/* Facial Recognition Box Simulation */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-40 h-40 border border-primary/50 rounded-lg shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                        <div className="absolute -top-6 left-0 text-[10px] text-primary font-mono bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-md border border-primary/20">TARGET LOCKED</div>
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                    </div>

                    {/* Data Points */}
                    <div className="absolute top-20 right-6 text-right space-y-2">
                        <div className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-1 rounded border-r-2 border-cyan-500 shadow-sm translate-x-4 group-hover:translate-x-0 transition-transform duration-300 delay-100">BIOMETRIC MATCH</div>
                        <div className="text-[10px] font-mono text-green-300 bg-slate-950/80 px-2 py-1 rounded border-r-2 border-green-500 shadow-sm translate-x-4 group-hover:translate-x-0 transition-transform duration-300 delay-200">VACCINATION: OK</div>
                        <div className="text-[10px] font-mono text-purple-300 bg-slate-950/80 px-2 py-1 rounded border-r-2 border-purple-500 shadow-sm translate-x-4 group-hover:translate-x-0 transition-transform duration-300 delay-300">GPS: ACTIVE</div>
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
                    <h3 className="text-4xl font-extrabold text-white leading-none tracking-tight drop-shadow-md">{pet.name}</h3>
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
                            <button onClick={() => onEditPet(pet)} className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-white/10 rounded-full" title={t('editButton')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => onHealthCheck(pet)} className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-full" title={t('aiHealthCheckButton')}>
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
                        <GlassButton onClick={() => onGenerateQR(pet)} variant="secondary" className="text-[10px] py-2 flex flex-col items-center gap-1 h-auto border-white/5 hover:border-primary/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zm-6 12v-2m0 0l-3-3m3 3l3-3m2 8H9m13 0h-3m3 0v-3m0 3v3m-3-3h3m-6 0v-3m0 3h3m-3 0v3m-3-3h3" /></svg>
                            Tag
                        </GlassButton>
                        <GlassButton onClick={() => onShare(pet)} variant="secondary" className="text-[10px] py-2 flex flex-col items-center gap-1 h-auto border-white/5 hover:border-blue-500/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Share
                        </GlassButton>
                        <GlassButton onClick={() => onTransferOwnership(pet)} variant="secondary" className="text-[10px] py-2 flex flex-col items-center gap-1 h-auto text-red-400 border-white/5 hover:border-red-500/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            Transfer
                        </GlassButton>
                    </div>

                    {/* Primary State Button */}
                    {pet.isLost ? (
                        <GlassButton onClick={() => onMarkFound(pet.id)} variant="primary" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 border-green-400/50 py-3 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {t('markFoundButton')}
                        </GlassButton>
                    ) : (
                        <GlassButton onClick={() => onReportLostClick(pet)} variant="danger" className="w-full py-3 text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {t('reportLostButton')}
                        </GlassButton>
                    )}
                </GlassCard>
            </GlassCard>
            
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    )
});

const QuickAction: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; colorClass: string }> = ({ title, icon, onClick, colorClass }) => (
    <GlassCard variant="interactive" onClick={onClick} className="flex flex-col items-center justify-center p-4 transform hover:-translate-y-1 duration-300 h-full group border-white/10 bg-white/5">
        <div className={`p-3 rounded-xl ${colorClass} mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
            {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white text-center">{title}</span>
    </GlassCard>
)

export const Dashboard: React.FC<DashboardProps> = ({ user, userPets, appointments = [], onReportLost, onMarkFound, onEditPet, onRegisterNew, setView, chatSessions, onOpenChat, onRequestAppointment, onLinkVet, onSharePet, onHealthCheck, onTransferOwnership, onLogout }) => {
  const { t } = useTranslations();
  const [reportingPet, setReportingPet] = useState<PetProfile | null>(null);
  const [sharingPet, setSharingPet] = useState<PetProfile | null>(null);
  const [qrPet, setQrPet] = useState<PetProfile | null>(null);
  const [selectedPetForDetail, setSelectedPetForDetail] = useState<PetProfile | null>(null);
  
  // User Menu State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setShowUserMenu(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmReportLost = (location: Geolocation, radius: number) => {
    if (reportingPet) onReportLost(reportingPet.id, location, radius);
    setReportingPet(null);
  }
  
  const myChats = chatSessions.filter(c => c.ownerEmail === user.email || c.finderEmail === user.email);

  return (
    <>
    {reportingPet && <ReportLostModal pet={reportingPet} onConfirm={handleConfirmReportLost} onClose={() => setReportingPet(null)} />}
    {sharingPet && <SharePetModal pet={sharingPet} friends={user.friends} onClose={() => setSharingPet(null)} onShare={onSharePet} />}
    {qrPet && <QRCodeModal pet={qrPet} onClose={() => setQrPet(null)} />}
    {selectedPetForDetail && (
        <OwnerPetDetailModal 
            pet={selectedPetForDetail} 
            appointments={appointments}
            onClose={() => setSelectedPetForDetail(null)} 
            onEdit={() => { setSelectedPetForDetail(null); onEditPet(selectedPetForDetail); }}
        />
    )}
    
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4">
      {/* 1. Control Center Header */}
      <GlassCard className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        {/* Subtle radial gradient for depth */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-6">
                {/* Avatar with Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg hover:scale-105 transition-transform"
                    >
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden border border-white/10">
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                    </button>
                    
                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                        <GlassCard className="absolute top-full left-0 mt-3 w-56 z-50 overflow-hidden animate-fade-in origin-top-left border-white/20">
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <p className="font-bold text-white truncate">{user.email}</p>
                                <p className="text-xs text-primary/70 capitalize font-mono tracking-wider">{user.activeRole}</p>
                            </div>
                            <div className="p-2">
                                <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Profile Settings
                                </button>
                                <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    Notifications
                                </button>
                                <div className="h-px bg-white/10 my-1"></div>
                                <button 
                                    onClick={onLogout}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 font-bold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    {t('logoutButton')}
                                </button>
                            </div>
                        </GlassCard>
                    )}
                </div>
                
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboardWelcome', { name: user.email.split('@')[0] })}</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#2dd4bf]"></span>
                        <span className="font-mono text-[10px] tracking-widest uppercase">System Active</span> 
                        <span className="text-white/20">•</span>
                        <span>{userPets.length} {t('protectedPets', { count: userPets.length })}</span>
                    </p>
                </div>
            </div>
        </div>
        
        {/* Quick Stats / Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto relative z-10">
             <QuickAction 
                title={t('addNewImprontaButton')} 
                onClick={onRegisterNew} 
                colorClass="bg-primary/10 text-primary dark:bg-primary/20"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
             />
             <QuickAction 
                title={t('communityHubButton')} 
                onClick={() => setView('community')} 
                colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
             />
             <QuickAction 
                title={t('findVetTitle')} 
                onClick={() => setView('findVet')} 
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
             />
             <QuickAction 
                title={t('supportUsTitle')} 
                onClick={() => setView('donors')} 
                colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
             />
        </div>
      </GlassCard>
      
      {/* Messages Section */}
      {myChats.length > 0 && (
          <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#2dd4bf]"></span>
                  {t('messagesTitle')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myChats.map(chat => (
                      <GlassCard key={chat.id} variant="interactive" onClick={() => onOpenChat(chat.id)} className="p-4 flex items-center gap-4 border-white/10 bg-white/5 group">
                          <img src={chat.petPhotoUrl} alt={chat.petName} className="w-12 h-12 rounded-lg object-cover bg-slate-800 border border-white/10"/>
                          <div className="min-w-0">
                              <p className="font-bold text-white truncate group-hover:text-primary transition-colors">{chat.petName}</p>
                              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                                  {chat.ownerEmail === user.email ? 'Finder' : 'Owner'}
                              </p>
                          </div>
                          <div className="ml-auto text-slate-500 group-hover:text-primary transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                          </div>
                      </GlassCard>
                  ))}
              </div>
          </div>
      )}

      {/* My Pets Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {t('dashboardTitle')}
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">{userPets.length}</span>
        </h2>
        
        {userPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userPets.map((pet, index) => (
                <div className="h-full animate-fade-in" style={{animationDelay: `${index * 100}ms`}} key={pet.id}>
                    <PetCard 
                        pet={pet} 
                        onMarkFound={onMarkFound} 
                        onReportLostClick={setReportingPet} 
                        onEditPet={onEditPet} 
                        onRequestAppointment={onRequestAppointment} 
                        onLinkVet={onLinkVet} 
                        onShare={setSharingPet} 
                        onHealthCheck={onHealthCheck} 
                        onTransferOwnership={onTransferOwnership}
                        onGenerateQR={setQrPet}
                        onViewDetail={setSelectedPetForDetail}
                    />
                </div>
              ))}
              
              {/* Add New Pet Card Placeholder */}
               <GlassCard variant="interactive" onClick={onRegisterNew} className="p-6 flex flex-col items-center justify-center min-h-[480px] group border-white/10 bg-white/5 border-2 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-primary/20 text-slate-500 group-hover:text-primary flex items-center justify-center transition-colors mb-4 shadow-sm group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="font-black text-slate-300 group-hover:text-primary transition-colors text-lg uppercase tracking-widest">{t('addNewImprontaButton')}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Register biometrics</p>
               </GlassCard>
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 shadow-md">
                  <span className="text-4xl">🐾</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{t('noImpronte')}</h3>
              <p className="text-muted-foreground mt-2 mb-8 max-w-md">{t('noImpronteDesc')}</p>
              <button onClick={onRegisterNew} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  {t('addNewImprontaButton')}
              </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
