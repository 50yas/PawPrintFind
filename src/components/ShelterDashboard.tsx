
import React from 'react';
import { PetProfile, ChatSession } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage } from './ui/CinematicImage';
import { PetCard } from './PetCard';

interface ShelterDashboardProps {
  shelterPets: PetProfile[];
  onRegisterNew: () => void;
  onEditPet: (pet: PetProfile) => void;
  onViewPet: (pet: PetProfile) => void;
  chatSessions: ChatSession[];
  onOpenChat: (sessionId: string) => void;
  onTransferOwnership: (pet: PetProfile) => void;
}

export const ShelterDashboard: React.FC<ShelterDashboardProps> = ({ shelterPets, onRegisterNew, onEditPet, onViewPet, chatSessions, onOpenChat, onTransferOwnership }) => {
  const { t } = useTranslations();

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-[60px]"></div>
          <div className="relative z-10">
             <h1 className="text-3xl font-bold">{t('dashboard:shelter.shelterDashboardTitle')}</h1>
             <p className="text-purple-100 mt-1">{t('dashboard:shelter.manageAdoptions')}</p>
          </div>
          <button onClick={onRegisterNew} className="relative z-10 btn bg-white text-purple-900 hover:bg-purple-50 font-bold shadow-lg flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
             {t('dashboard:shelter.registerNewAnimalButton')}
          </button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content: Animals List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {t('dashboard:shelter.animalsForAdoptionTitle')}
                <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-mono font-bold border border-primary/20">{shelterPets.length}</span>
            </h2>
            
            {shelterPets.length > 0 ? (
              <div className="space-y-6">
                {shelterPets.map(pet => (
                  <PetCard variant="shelter" key={pet.id} pet={pet} onEdit={onEditPet} onAdopt={onTransferOwnership} onViewDetail={onViewPet} />
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl p-12 rounded-3xl text-center border-2 border-dashed border-white/10 flex flex-col items-center hud-grid-bg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/10 neon-glow-teal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('dashboard:shelter.noAnimalsRegistered')}</h3>
                    <p className="text-slate-400 mt-2 mb-6 max-w-md">{t('dashboard:shelter.noAnimalsRegisteredDesc')}</p>
                    <button onClick={onRegisterNew} className="btn btn-primary rounded-xl neon-glow-teal">{t('dashboard:shelter.registerFirstAnimalButton')}</button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Messages */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {t('adoptionInquiriesTitle')}
                  {chatSessions.length > 0 && <span className="status-pulse-red"></span>}
              </h2>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden h-[400px] overflow-y-auto custom-scrollbar">
                  {chatSessions.length > 0 ? (
                      <div className="divide-y divide-white/5">
                          {chatSessions.map(chat => (
                              <div key={chat.id} onClick={() => onOpenChat(chat.id)} className="p-4 hover:bg-primary/5 cursor-pointer transition-colors flex items-start gap-3 group">
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                    <CinematicImage src={chat.petPhotoUrl} alt={chat.petName} className="w-full h-full object-cover" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-slate-900 rounded-full"></div>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-sm text-white truncate">{chat.petName}</p>
                                          <span className="text-[10px] text-slate-500 font-mono">{t('dashboard:shelter.now')}</span>
                                      </div>
                                      <p className="text-xs text-slate-400 truncate">{chat.finderEmail}</p>
                                      <p className="text-xs text-primary mt-2 font-bold group-hover:underline">{t('dashboard:shelter.viewConversation')} &rarr;</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                          <p>{t('dashboard:shelter.noInquiries')}</p>
                      </div>
                  )}
              </div>

              {/* Shelter Kit Section */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/20">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/20">
                          📦
                      </div>
                      <div>
                          <h3 className="font-bold text-white">{t('dashboard:shelter.shelterKitTitle')}</h3>
                          <p className="text-xs text-slate-400">{t('dashboard:shelter.shelterKitDesc')}</p>
                      </div>
                  </div>
                  <button className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t('dashboard:shelter.downloadKitButton')}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

