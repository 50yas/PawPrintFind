import React, { useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { View } from '../types';

interface NavigationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: View) => void;
}

export const NavigationBottomSheet: React.FC<NavigationBottomSheetProps> = ({ isOpen, onClose, setView }) => {
  const { t } = useTranslations();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNav = (view: View) => {
    setView(view);
    onClose();
  };

  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: t('homeButton'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )},
    { view: 'lostPetsCenter', label: t('showLostPets'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    )},
    { view: 'adoptionCenter', label: t('adoptionLink'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    )},
    { view: 'findVet', label: t('findVetTitle'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
        <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
        <circle cx="20" cy="10" r="2" />
      </svg>
    )},
    { view: 'blog', label: t('blogButton'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8V6Z" />
      </svg>
    )},
    { view: 'community', label: t('communityHubButton'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )},
    { view: 'donors', label: t('donorsButton'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    )},
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[2rem] p-6 z-[1002] animate-slide-up-mobile max-h-[85vh] overflow-y-auto pb-safe shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
        data-testid="navigation-bottom-sheet"
      >
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
        
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-4 text-center">{t('navigation')}</h3>

        <div className="grid grid-cols-2 gap-4">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className="scan-hover p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 flex flex-col items-center justify-center gap-3 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform text-primary/50 group-hover:text-primary drop-shadow-[0_0_6px_#22d3ee]">
                {item.icon}
              </div>
              <span className="text-white font-black uppercase tracking-widest text-[10px] group-hover:text-primary transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 rounded-xl border border-white/10 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:text-white transition-all"
        >
          {t('closeButton')}
        </button>
      </div>
    </>
  );
};
