import React from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { CinematicImage } from './ui/CinematicImage';

interface AIIdentikitCardProps {
  pet: PetProfile;
  id?: string; // Allow passing an ID for the container (useful for capture)
}

export const AIIdentikitCard: React.FC<AIIdentikitCardProps> = ({ pet, id }) => {
  const { t } = useTranslations();
  const photoUrl = pet.photos.length > 0 ? pet.photos[0].url : '/default-pet.png';

  const displayGender = (gender: string | undefined) => {
      if (!gender) return t('genderUnknown');
      const lower = gender.toLowerCase();
      if (lower === 'male') return t('genderMale');
      if (lower === 'female') return t('genderFemale');
      if (lower === 'unknown') return t('genderUnknown');
      return gender;
  };

  return (
    <div id={id} className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm flex justify-between items-center">
        <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.2em] text-cyan-400 font-bold uppercase">{t('aiCore')}</span>
            <span className="text-xs text-cyan-200/70">{t('biometricVerified')}</span>
        </div>
        <div className="flex items-center gap-3">
             <ShareButton pet={pet} />
             <FavoriteButton petId={pet.id} className="text-cyan-400 hover:text-cyan-200" />
             <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 space-y-6">
        
        {/* Photo Frame */}
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-lg opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 ring-1 ring-white/10">
                <CinematicImage src={photoUrl} alt={pet.name} className="w-full h-full" />
                
                {/* Overlay UI elements */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-cyan-400 border border-cyan-500/30 z-10">
                    {t('scanning')}
                </div>
                
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-sm"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-sm"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-sm"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-sm"></div>
            </div>
        </div>

        {/* Data Matrix */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">{t('subjectName')}</label>
                <div className="text-xl font-bold text-white tracking-wide">{pet.name}</div>
            </div>
            <div className="space-y-1 text-right">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">{t('identityCode')}</label>
                <div className="text-sm font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-500/30 inline-block">
                    {pet.aiIdentityCode || t('pendingGen')}
                </div>
            </div>
            
            <div className="col-span-2 grid grid-cols-3 gap-2 py-4 border-t border-dashed border-gray-800">
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase">{t('breedLabel')}</div>
                    <div className="text-sm text-gray-300 truncate">{pet.breed}</div>
                 </div>
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase">{t('ageLabel')}</div>
                    <div className="text-sm text-gray-300">{pet.age}</div>
                 </div>
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase">{t('genderLabel')}</div>
                    <div className="text-sm text-gray-300">{displayGender(pet.gender)}</div>
                 </div>
            </div>
        </div>

        {/* AI Analysis Snippet */}
        {pet.aiPhysicalDescription && (
            <div className="p-3 rounded bg-gray-900/80 border-l-2 border-fuchsia-500">
                <div className="text-[10px] text-fuchsia-400 mb-1 uppercase tracking-widest">{t('visualAnalysis')}</div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                    {pet.aiPhysicalDescription}
                </p>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-3 bg-black border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-600">
        <span>{t('generatedByGemini')}</span>
        <span className="font-mono">{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};
