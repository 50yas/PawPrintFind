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

  const navItems: { view: View; label: string; icon?: React.ReactNode }[] = [
    { view: 'home', label: t('homeButton') },
    { view: 'lostPetsCenter', label: t('showLostPets') },
    { view: 'adoptionCenter', label: t('adoptionLink') },
    { view: 'findVet', label: t('findVetTitle') },
    { view: 'blog', label: t('blogButton') },
    { view: 'community', label: t('communityHubButton') },
    { view: 'donors', label: t('donorsButton') },
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
        
        <div className="grid grid-cols-2 gap-4">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 flex flex-col items-center justify-center gap-3 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary shadow-[0_0_10px_#22d3ee]"></span>
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
          Close
        </button>
      </div>
    </>
  );
};
