
import React, { useState, useEffect, useRef } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import { useTranslations } from '../hooks/useTranslations';
import { User, View, AppNotification } from '../types';
import { RoleSwitcher } from './RoleSwitcher';
import { GlassButton } from './ui/GlassButton';
import { NavigationBottomSheet } from './NavigationBottomSheet';
import { RedeemCodeModal } from './RedeemCodeModal';
import { userNotificationService } from '../services/userNotificationService';

const TIER_META: Record<string, { label: string; color: string; icon: string }> = {
  scout:    { label: 'Scout',    color: '#64748b', icon: '🔍' },
  tracker:  { label: 'Tracker',  color: '#10b981', icon: '🌿' },
  ranger:   { label: 'Ranger',   color: '#3b82f6', icon: '🌀' },
  guardian: { label: 'Guardian', color: '#8b5cf6', icon: '🛡️' },
  legend:   { label: 'Legend',   color: '#f59e0b', icon: '⭐' },
};

function getTierKey(user: User): string {
  if (user.karmaTier && TIER_META[user.karmaTier]) return user.karmaTier;
  const pts = (user as any).karmaBalance ?? user.points ?? 0;
  if (pts >= 15000) return 'legend';
  if (pts >= 5000)  return 'guardian';
  if (pts >= 2000)  return 'ranger';
  if (pts >= 500)   return 'tracker';
  return 'scout';
}

interface NavbarProps {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  setView?: (view: View) => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, setCurrentUser, onLoginClick, onLogoutClick, setView, className = "" }) => {
  const { t } = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUser?.uid) { setNotifications([]); return; }
    const unsub = userNotificationService.subscribe(currentUser.uid, setNotifications);
    return unsub;
  }, [currentUser?.uid]);

  // Close notif panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (view: View, elementId?: string) => {
    if (setView) setView(view);
    setShowProfileMenu(false);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navContainerClass = scrolled
    ? 'bg-slate-950/40 backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-3 lg:py-2'
    : 'bg-transparent py-3 lg:py-6';

  return (
    <nav
      className={`fixed top-0 inset-x-0 w-full z-[1000] transition-all duration-500 border-b pt-safe-top will-change-transform ${navContainerClass} ${className}`}
    >
      <RedeemCodeModal isOpen={showRedeemModal} onClose={() => setShowRedeemModal(false)} />

      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Branding */}
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => handleNavClick('home')}
        >
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative w-full h-full bg-slate-900/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden p-2">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white transform group-hover:scale-110 transition-transform duration-500">
                <g fill="currentColor" transform="translate(28, 20) scale(0.9)">
                  <path d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z" />
                  <path d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z" />
                  <path d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z" />
                  <path d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z" />
                  <path d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z" />
                </g>
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-black tracking-tighter text-white">PAW PRINT <span className="logo-print-text">FIND</span></span>
            <span className="hidden sm:block text-[8px] font-mono-tech text-primary/60 tracking-[0.3em] uppercase">{t('visualBiometrics')}</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center bg-white/5 border border-white/10 px-8 py-2 rounded-full backdrop-blur-md neon-border">
          <div className="flex items-center gap-10">
            <button
              id="home-nav"
              onClick={() => handleNavClick('home')}
              aria-label={t('homeButton')}
              className="text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:scale-105"
            >
              {t('homeButton')}
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  const role = currentUser.activeRole;
                  if (role === 'vet') handleNavClick('vetDashboard');
                  else if (role === 'shelter') handleNavClick('shelterDashboard');
                  else if (role === 'super_admin') handleNavClick('adminDashboard');
                  else handleNavClick('dashboard');
                }}
                aria-label={t('dashboardButton')}
                className="text-[11px] font-black uppercase tracking-widest transition-all text-primary hover:text-white hover:scale-105"
              >
                {t('dashboardButton')}
              </button>
            )}

            <button
              onClick={() => handleNavClick('blog')}
              aria-label={t('blogButton')}
              className="text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:scale-105"
            >
              {t('blogButton')}
            </button>
            <button
              onClick={() => handleNavClick('lostPetsCenter')}
              aria-label={t('showLostPets')}
              className="text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:scale-105"
            >
              {t('showLostPets')}
            </button>
            <button
              onClick={() => handleNavClick('adoptionCenter')}
              aria-label={t('adoptionLink')}
              className="text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:scale-105"
            >
              {t('adoptionLink')}
            </button>
            <button
              id="community-nav"
              onClick={() => handleNavClick('ecosystemHub')}
              aria-label={t('ecosystemButton')}
              className="text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:scale-105"
            >
              {t('ecosystemButton')}
            </button>
            <button
              onClick={() => handleNavClick('home', 'support-us')}
              aria-label={t('supportButton')}
              className="text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:scale-105"
            >
              {t('supportButton')}
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger - HIDDEN as we use Bottom Nav now */}
          <div className="hidden">
            <button
              data-testid="mobile-menu-trigger"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle mobile menu"
              className="relative w-11 h-11 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary shadow-lg overflow-hidden group"
            >
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pe-4 border-e border-white/10">
            <LanguageSwitcher className="text-white !text-[10px]" />
            <DarkModeToggle />
          </div>

          {!currentUser ? (
            <GlassButton
              onClick={onLoginClick}
              variant="primary"
              className="!py-2.5 !px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl"
            >
              {t('loginButton')}
            </GlassButton>
          ) : (
            <div className="flex items-center gap-4 relative">
              {currentUser && <RoleSwitcher currentUser={currentUser} setCurrentUser={setCurrentUser} />}

              {/* Notification Bell */}
              {currentUser && (() => {
                const unread = notifications.filter(n => !n.read).length;
                return (
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => {
                        setShowNotifPanel(v => !v);
                        if (!showNotifPanel && unread > 0) {
                          userNotificationService.markAllAsRead(currentUser.uid);
                        }
                      }}
                      className="relative w-10 h-10 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary/40 transition-all active:scale-95"
                      aria-label="Notifications"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {showNotifPanel && (
                      <div className="absolute right-0 top-14 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[5000]">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</span>
                          {notifications.length > 0 && (
                            <button
                              onClick={() => userNotificationService.markAllAsRead(currentUser.uid)}
                              className="text-[10px] text-primary hover:text-white transition-colors font-bold"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500 text-xs">No notifications yet</div>
                          ) : notifications.slice(0, 10).map(n => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (n.petId && setView) setView('lostPetsCenter');
                                setShowNotifPanel(false);
                                if (!n.read) userNotificationService.markAsRead(currentUser.uid, n.id);
                              }}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${n.read ? 'opacity-50' : ''}`}
                            >
                              {n.petPhotoUrl
                                ? <img src={n.petPhotoUrl} alt={n.petName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 mt-0.5" />
                                : <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-base">🐾</div>
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{n.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-[9px] text-slate-600 mt-1">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="relative">
                {/* Avatar Button */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="relative group/avatar focus:outline-none"
                >
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur group-hover/avatar:bg-primary/40 transition-all"></div>
                  <div className={`relative w-11 h-11 rounded-xl bg-slate-900 border ${showProfileMenu ? 'border-primary' : 'border-white/20'} flex items-center justify-center text-sm font-black text-primary shadow-xl transition-all active:scale-95 overflow-hidden`}>
                    {currentUser.photoURL
                      ? <img src={currentUser.photoURL} alt="avatar" className="w-full h-full object-cover" />
                      : (currentUser.displayName || currentUser.email).charAt(0).toUpperCase()
                    }
                  </div>
                </button>

                {/* Profile Popover */}
                {showProfileMenu && (() => {
                  const tierKey = getTierKey(currentUser);
                  const tier = TIER_META[tierKey];
                  const karmaPoints = (currentUser as any).karmaBalance ?? currentUser.points ?? 0;
                  const displayName = currentUser.displayName || currentUser.email.split('@')[0];
                  const activeBadges = currentUser.badges || [];
                  return (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setShowProfileMenu(false)}></div>
                      <div className="absolute top-14 end-0 w-72 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-slide-up-mobile overflow-hidden" style={{ borderColor: `${tier.color}30` }}>

                        {/* Identity — clickable → View Profile */}
                        <button
                          onClick={() => { handleNavClick('userProfile'); }}
                          className="w-full flex items-center gap-3 p-5 pb-4 border-b border-white/10 hover:bg-white/5 transition-colors text-left group"
                        >
                          <div className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden border-2" style={{ borderColor: `${tier.color}50`, boxShadow: `0 0 14px ${tier.color}30` }}>
                            {currentUser.photoURL
                              ? <img src={currentUser.photoURL} alt="avatar" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xl font-black text-white" style={{ background: `${tier.color}25` }}>
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                            }
                          </div>
                          <div className="overflow-hidden flex-1 min-w-0">
                            <p className="text-white font-black text-sm truncate group-hover:text-primary transition-colors">{displayName}</p>
                            <p className="text-[10px] text-slate-400 truncate font-mono">{currentUser.email}</p>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                              {currentUser.activeRole}
                            </span>
                          </div>
                          <svg className="h-4 w-4 text-slate-600 group-hover:text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <div className="p-5 flex flex-col gap-4">
                          {/* Karma & Rank */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">{t('karma')}</p>
                              <p className="text-lg font-black text-white">{karmaPoints.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">{t('rank', 'Rank')}</p>
                              <p className="text-sm font-black flex items-center gap-1" style={{ color: tier.color }}>
                                <span>{tier.icon}</span>
                                <span>{tier.label}</span>
                              </p>
                            </div>
                          </div>

                          {/* Active Badges */}
                          <div className="space-y-2">
                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest px-1">{t('activeBadges')}</p>
                            {activeBadges.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activeBadges.slice(0, 5).map(badge => (
                                  <span key={badge} className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-400 uppercase tracking-tighter">
                                    {badge.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {activeBadges.length > 5 && (
                                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black text-slate-400">
                                    +{activeBadges.length - 5}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-600 italic px-1">{t('noBadgesYet', 'No badges yet — start exploring!')}</p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-1 border-t border-white/10">
                            <button
                              onClick={() => handleNavClick('userProfile')}
                              className="w-full py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-[10px] font-black text-primary uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {t('myProfileAndBadges', 'My Profile & Badges')}
                            </button>

                            <button
                              onClick={() => { setShowRedeemModal(true); setShowProfileMenu(false); }}
                              className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                              <span>🎁</span> {t('redeemCodeButton')}
                            </button>

                            <GlassButton
                              onClick={onLogoutClick}
                              variant="danger"
                              className="w-full !py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl"
                            >
                              {t('logoutButton')}
                            </GlassButton>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {scrolled && (
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      )}

      <NavigationBottomSheet
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        setView={(view) => handleNavClick(view)}
      />
    </nav>
  );
};
