
import React from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage, GlassCard, GlassButton } from './ui';
import { CardSkeleton } from './ui/SkeletonLoader';

interface AdoptionCenterProps {
  petsForAdoption: PetProfile[];
  onInquire: (pet: PetProfile) => void;
  goBack: () => void;
  currentUser: User | null;
  isLoading?: boolean;
}

const AdoptionCard: React.FC<{ pet: PetProfile; onInquire: () => void; }> = ({ pet, onInquire }) => {
    const { t } = useTranslations();
    return (
        <GlassCard variant="interactive" className="flex flex-col h-full border-white/10 bg-white/5">
            <CinematicImage className="h-64 w-full" src={pet.photos[0]?.url} alt={pet.name} />
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{pet.name}</h3>
                <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mt-1">{pet.breed}</p>
                <p className="text-sm text-slate-400 mt-4 flex-grow leading-relaxed">{pet.behavior.substring(0, 120)}{pet.behavior.length > 120 ? '...' : ''}</p>
                <div className="mt-6 flex flex-wrap items-center justify-start gap-3">
                    <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{pet.age}</span>
                    <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{pet.weight}</span>
                </div>
                 <GlassButton onClick={onInquire} className="mt-8 w-full text-[10px] uppercase tracking-[0.2em] font-black" variant="primary">
                    {t('inquireToAdoptButton')}
                 </GlassButton>
            </div>
        </GlassCard>
    )
}

export const AdoptionCenter: React.FC<AdoptionCenterProps> = ({ petsForAdoption, onInquire, goBack, currentUser }) => {
  const { t } = useTranslations();
  
  const handleInquire = (pet: PetProfile) => {
    if (!currentUser) {
        alert(t('loginToAdoptWarning'));
        // Optionally, trigger a login flow here
        return;
    }
    onInquire(pet);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <button onClick={goBack} className="text-primary hover:brightness-125 font-semibold">&larr; {t('homeButton')}</button>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">{t('adoptionCenterTitle')}</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">{t('adoptionCenterDescPublic')}</p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : petsForAdoption.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {petsForAdoption.map(pet => (
                <AdoptionCard key={pet.id} pet={pet} onInquire={() => handleInquire(pet)} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted rounded-2xl">
            <p className="text-xl text-muted-foreground">{t('noPetsForAdoption')}</p>
        </div>
      )}
    </div>
  );
};
