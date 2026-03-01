
import React, { useState, memo, useRef, useEffect, useCallback, useMemo } from 'react';
import { PetProfile, User, Geolocation, ChatSession, Appointment, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { dbService } from '../services/firebase';
import { useSnackbar } from '../contexts/SnackbarContext';
import { SightingsMap } from './SightingsMap';
import { ReportLostModal } from './ReportLostModal';
import { SharePetModal } from './SharePetModal';
import { Modal } from './Modal';
import { OwnerPetDetailModal } from './OwnerPetDetailModal';
import { GlassCard } from './ui/GlassCard';
import { CinematicImage } from './ui/CinematicImage';
import { BadgeDisplay } from './BadgeDisplay';
import { SavedSearchesList } from './SavedSearchesList';
import { PetCard } from './PetCard';

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
  onViewPet: (pet: PetProfile) => void;
  onTransferOwnership: (pet: PetProfile) => void;
  onLogout?: () => void;
  onApplySearch: (filters: any) => void;
}

const QRCodeModal: React.FC<{ pet: PetProfile; onClose: () => void }> = ({ pet, onClose }) => {
    const { t } = useTranslations();
    const appBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || 'https://pawprint-50.web.app';
    const qrData = `${appBaseUrl}/p/${pet.id}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=14b8a6`;

    return (
        <Modal isOpen={true} onClose={onClose} title={t('petTagTitle')}>
            <div className="flex flex-col items-center">
                <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center mb-4 relative overflow-hidden neon-border">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-3 overflow-hidden border-2 border-primary/50 neon-glow-teal">
                        <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover"/>
                    </div>
                    <h3 className="text-xl font-bold text-white">{pet.name}</h3>
                    <p className="text-xs text-slate-400 mb-4 font-mono uppercase tracking-wider">{t('scanToViewProfile')}</p>
                    <div className="bg-white p-3 rounded-xl mx-auto w-fit">
                        <img src={qrImageUrl} alt="QR Code" className="w-40 h-40" loading="lazy" decoding="async" />
                    </div>
                    <p className="text-[10px] text-primary/60 mt-3 font-mono tracking-widest">ID: {pet.aiIdentityCode || pet.id.substring(0, 8)}</p>
                </div>
                <div className="flex gap-3 w-full">
                    <button onClick={onClose} className="flex-1 glass-btn text-sm">{t('closeButton')}</button>
                    <button className="flex-1 btn btn-primary rounded-xl" onClick={() => window.print()}>{t('printButton')}</button>
                </div>
                <button
                    onClick={() => window.open('https://pawprint-50.web.app', '_blank')}
                    className="mt-4 w-full text-xs font-bold text-primary hover:text-white transition-colors flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                    {t('orderSafePawTag')}
                </button>
            </div>
        </Modal>
    );
};

const QuickAction: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; colorClass: string }> = memo(({ title, icon, onClick, colorClass }) => (
    <GlassCard variant="interactive" onClick={onClick} className="flex flex-col items-center justify-center p-4 transform hover:-translate-y-1.5 duration-300 h-full group border-white/10 bg-white/10 backdrop-blur-xl hover:border-primary/30 scan-hover">
        <div className={`p-3 rounded-xl ${colorClass} mb-2 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-primary/20`}>
            {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 drop-shadow-sm group-hover:text-white text-center">{title}</span>
    </GlassCard>
));

const TIER_META: Record<string, { label: string; color: string; icon: string }> = {
  scout:    { label: 'Scout',    color: '#64748b', icon: '🔍' },
  tracker:  { label: 'Tracker',  color: '#10b981', icon: '🌿' },
  ranger:   { label: 'Ranger',   color: '#3b82f6', icon: '🌀' },
  guardian: { label: 'Guardian', color: '#8b5cf6', icon: '🛡️' },
  legend:   { label: 'Legend',   color: '#f59e0b', icon: '⭐' },
};

function getTierFromPoints(points: number) {
  if (points >= 15000) return 'legend';
  if (points >= 5000)  return 'guardian';
  if (points >= 2000)  return 'ranger';
  if (points >= 500)   return 'tracker';
  return 'scout';
}

export const Dashboard: React.FC<DashboardProps> = ({ user, userPets, appointments = [], onReportLost, onMarkFound, onEditPet, onRegisterNew, setView, chatSessions, onOpenChat, onRequestAppointment, onLinkVet, onSharePet, onHealthCheck, onViewPet, onTransferOwnership, onLogout, onApplySearch }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const [reportingPet, setReportingPet] = useState<PetProfile | null>(null);
  const [sharingPet, setSharingPet] = useState<PetProfile | null>(null);
  const [qrPet, setQrPet] = useState<PetProfile | null>(null);
  const [selectedPetForDetail, setSelectedPetForDetail] = useState<PetProfile | null>(null);

  // User Menu State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Redeem Code State
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const karmaPoints = user.karmaBalance ?? user.points ?? 0;
  const tierKey = user.karmaTier || getTierFromPoints(karmaPoints);
  const tierMeta = TIER_META[tierKey] || TIER_META.scout;
  const isAlphaTester = user.badges?.includes('alpha_tester');

  const handleRedeem = useCallback(async () => {
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    try {
      const result = await dbService.redeemCode(redeemCode.trim().toUpperCase());
      if (result.success) {
        addSnackbar(t('congratulations') + ' — ' + result.reward, 'success');
        setRedeemCode('');
        setShowRedeemInput(false);
      } else {
        addSnackbar(t('invalidCode', 'Code not found or already used.'), 'error');
      }
    } catch {
      addSnackbar(t('errorOccurred', 'An error occurred. Please try again.'), 'error');
    } finally {
      setRedeemLoading(false);
    }
  }, [redeemCode, addSnackbar, t]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setShowUserMenu(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmReportLost = useCallback((location: Geolocation, radius: number) => {
    if (reportingPet) onReportLost(reportingPet.id, location, radius);
    setReportingPet(null);
  }, [reportingPet, onReportLost]);
  
  const myChats = useMemo(() => 
    chatSessions.filter(c => c.ownerEmail === user.email || c.finderEmail === user.email),
    [chatSessions, user.email]
  );

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
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg hover:scale-105 transition-transform neon-glow-teal"
                    >
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden border border-white/10">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                (user.displayName || user.email).charAt(0).toUpperCase()
                            )}
                        </div>
                    </button>
                    
                    {/* Rich Mini-Profile Card */}
                    {showUserMenu && (
                        <GlassCard className="absolute top-full left-0 mt-3 w-72 z-50 overflow-hidden animate-fade-in origin-top-left border-white/20">
                            {/* Identity Block */}
                            <div
                                onClick={() => { setView('userProfile'); setShowUserMenu(false); }}
                                className="p-4 border-b border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/10" style={{ boxShadow: `0 0 12px ${tierMeta.color}40` }}>
                                        {user.photoURL
                                            ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white" style={{ background: `${tierMeta.color}30` }}>
                                                {(user.displayName || user.email).charAt(0).toUpperCase()}
                                              </div>
                                        }
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-white truncate text-sm group-hover:text-primary transition-colors">
                                            {user.displayName || user.email.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
                                        <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                            {user.activeRole}
                                        </span>
                                    </div>
                                    <svg className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>

                            {/* Karma & Rank Stats */}
                            <div className="px-4 py-3 border-b border-white/10 bg-white/3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Karma</p>
                                        <p className="text-xl font-black text-white">{karmaPoints.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{t('rank', 'Rank')}</p>
                                        <p className="text-sm font-black flex items-center justify-center gap-1" style={{ color: tierMeta.color }}>
                                            <span>{tierMeta.icon}</span>
                                            <span>{isAlphaTester ? t('rankAlpha', 'Alpha') : tierMeta.label}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Active Badges */}
                            {user.badges && user.badges.length > 0 && (
                                <div className="px-4 py-3 border-b border-white/10">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-2">{t('activeBadges', 'Active Badges')}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.badges.slice(0, 4).map(badge => (
                                            <span key={badge} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                                                {badge.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                        {user.badges.length > 4 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
                                                +{user.badges.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Redeem Code */}
                            <div className="px-4 py-2 border-b border-white/10">
                                {showRedeemInput ? (
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={redeemCode}
                                            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                                            onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); if (e.key === 'Escape') setShowRedeemInput(false); }}
                                            placeholder="PAW-XXXX-XXXX"
                                            className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-primary/50"
                                            autoFocus
                                        />
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={handleRedeem}
                                                disabled={redeemLoading || !redeemCode.trim()}
                                                className="flex-1 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors disabled:opacity-50"
                                            >
                                                {redeemLoading ? '...' : t('redeemCodeButton', 'Redeem')}
                                            </button>
                                            <button onClick={() => setShowRedeemInput(false)} className="px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-colors">
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowRedeemInput(true)}
                                        className="w-full text-left px-1 py-1.5 text-sm text-slate-300 hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                        <span>🎁</span>
                                        <span className="text-xs font-bold">{t('redeemCodeButton', 'Riscatta Codice')}</span>
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="p-2 space-y-0.5">
                                <button
                                    onClick={() => { setView('userProfile'); setShowUserMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {t('myProfileAndBadges', 'My Profile & Badges')}
                                </button>
                                <button
                                    onClick={() => { setView('userProfile'); setShowUserMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    {t('notifications')}
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
                    <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboardWelcome', { name: user.displayName || user.email.split('@')[0] })}</h1>
                    <p className="text-slate-300 mt-1 flex items-center gap-2 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--md-sys-color-primary)]"></span>
                        <span className="font-mono text-[10px] tracking-widest uppercase">{t('dashboard:common.systemActive')}</span> 
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

      {/* Cyber Divider */}
      <div className="cyber-divider"></div>

      {/* My Achievements */}
      <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="status-pulse-amber"></span>
            <span className="tracking-tight">{t('myAchievements')}</span>
            <span className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent"></span>
          </h2>
          <BadgeDisplay badges={user.badges} />
      </div>

      {/* Saved Searches */}
      <div className="animate-fade-in">
          <SavedSearchesList userEmail={user.email} onApply={onApplySearch} />
      </div>
      
      {/* Messages Section */}

      {myChats.length > 0 && (
          <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="status-pulse-green"></span>
                  <span className="tracking-tight">{t('messagesTitle')}</span>
                  <span className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myChats.map(chat => (
                      <GlassCard key={chat.id} variant="interactive" onClick={() => onOpenChat(chat.id)} className="p-4 flex items-center gap-4 border-white/10 bg-white/5 group">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <CinematicImage src={chat.petPhotoUrl} alt={chat.petName} className="w-full h-full object-cover bg-slate-800 border border-white/10"/>
                          </div>
                          <div className="min-w-0">
                              <p className="font-bold text-white truncate group-hover:text-primary transition-colors">{chat.petName}</p>
                              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                                  {chat.ownerEmail === user.email ? t('finder') : t('owner')}
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
        <h2 className="text-2xl font-bold text-white drop-shadow-md flex items-center gap-3">
            <span className="status-pulse-green"></span>
            <span className="tracking-tight">{t('dashboardTitle')}</span>
            <span className="text-sm font-normal text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 font-mono">{userPets.length}</span>
            <span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span>
        </h2>
        
        {userPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useMemo(() => userPets.map((pet, index) => (
                <div className="h-full" key={pet.id}>
                    <PetCard 
                        variant="owner"
                        pet={pet} 
                        onMarkFound={onMarkFound} 
                        onReportLost={setReportingPet} 
                        onEdit={onEditPet} 
                        onShare={setSharingPet} 
                        onHealthCheck={onHealthCheck} 
                        onTransfer={onTransferOwnership}
                        onGenerateQR={setQrPet}
                        onViewDetail={(p) => {
                            if (p.isLost || p.status === 'forAdoption') {
                                onViewPet(p);
                            } else {
                                setSelectedPetForDetail(p);
                            }
                        }}
                    />
                </div>
              )), [userPets, onMarkFound, onEditPet, onHealthCheck, onTransferOwnership, onViewPet])}
              
              {/* Add New Pet Card Placeholder */}
               <GlassCard variant="interactive" onClick={onRegisterNew} className="p-6 flex flex-col items-center justify-center min-h-[480px] group border-white/10 bg-white/10 backdrop-blur-xl border-2 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-primary/20 text-slate-300 group-hover:text-primary flex items-center justify-center transition-colors mb-4 shadow-sm group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="font-black text-white group-hover:text-primary transition-colors text-lg uppercase tracking-widest drop-shadow-md">{t('addNewImprontaButton')}</p>
                    <p className="text-[10px] font-mono text-slate-300 mt-1 uppercase tracking-widest">{t('dashboard:common.registerBiometrics')}</p>
               </GlassCard>
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center hud-grid-bg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-white/10 neon-glow-teal">
                      <span className="text-4xl">🐾</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{t('noImpronte')}</h3>
                  <p className="text-slate-400 mt-2 mb-8 max-w-md">{t('noImpronteDesc')}</p>
                  <button onClick={onRegisterNew} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform rounded-xl neon-glow-teal-strong">
                      {t('addNewImprontaButton')}
                  </button>
              </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
