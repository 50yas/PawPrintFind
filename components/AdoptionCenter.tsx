
import React from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AdoptionCenterProps {
  petsForAdoption: PetProfile[];
  onInquire: (pet: PetProfile) => void;
  goBack: () => void;
  currentUser: User | null;
}

const AdoptionCard: React.FC<{ pet: PetProfile; onInquire: () => void; }> = ({ pet, onInquire }) => {
    const { t } = useTranslations();
    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
            <img className="h-56 w-full object-cover" src={pet.photos[0]?.url} alt={pet.name} />
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold text-card-foreground">{pet.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{pet.breed}</p>
                <p className="text-sm text-muted-foreground mt-2 flex-grow">{pet.behavior.substring(0, 100)}{pet.behavior.length > 100 ? '...' : ''}</p>
                <div className="mt-4 flex flex-wrap items-center justify-start gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded-full">{pet.age}</span>
                    <span className="bg-muted px-2 py-1 rounded-full">{pet.weight}</span>
                </div>
                 <button onClick={onInquire} className="mt-6 w-full btn btn-primary">{t('inquireToAdoptButton')}</button>
            </div>
        </div>
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
      
      {petsForAdoption.length > 0 ? (
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
