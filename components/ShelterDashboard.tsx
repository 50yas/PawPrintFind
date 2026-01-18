
import React from 'react';
import { PetProfile, ChatSession } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage } from './ui/CinematicImage';

interface ShelterDashboardProps {
  shelterPets: PetProfile[];
  onRegisterNew: () => void;
  onEditPet: (pet: PetProfile) => void;
  chatSessions: ChatSession[];
  onOpenChat: (sessionId: string) => void;
  onTransferOwnership: (pet: PetProfile) => void;
}

const PetCard: React.FC<{ pet: PetProfile; onEdit: (pet: PetProfile) => void; onAdopt: (pet: PetProfile) => void; }> = ({ pet, onEdit, onAdopt }) => {
    const { t } = useTranslations();
    return (
        <div className="bg-card rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-border group">
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
                        <button onClick={() => onEdit(pet)} className="btn btn-secondary text-sm !px-4 !py-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            {t('editButton')}
                        </button>
                        <button onClick={() => onAdopt(pet)} className="btn btn-primary text-sm !px-4 !py-2 shadow-md flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                            {t('markAsAdoptedButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

export const ShelterDashboard: React.FC<ShelterDashboardProps> = ({ shelterPets, onRegisterNew, onEditPet, chatSessions, onOpenChat, onTransferOwnership }) => {
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
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {t('dashboard:shelter.animalsForAdoptionTitle')}
                <span className="bg-muted text-muted-foreground text-sm px-2 py-1 rounded-full font-normal">{shelterPets.length}</span>
            </h2>
            
            {shelterPets.length > 0 ? (
              <div className="space-y-6">
                {shelterPets.map(pet => (
                  <PetCard key={pet.id} pet={pet} onEdit={onEditPet} onAdopt={onTransferOwnership} />
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 p-12 rounded-3xl text-center border-2 border-dashed border-border flex flex-col items-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-xl font-bold text-foreground">{t('dashboard:shelter.noAnimalsRegistered')}</h3>
                <p className="text-muted-foreground mt-2 mb-6 max-w-md">{t('dashboard:shelter.noAnimalsRegisteredDesc')}</p>
                <button onClick={onRegisterNew} className="btn btn-primary">{t('dashboard:shelter.registerFirstAnimalButton')}</button>
              </div>
            )}
          </div>

          {/* Sidebar: Messages */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {t('adoptionInquiriesTitle')}
                  {chatSessions.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </h2>
              
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-[400px] overflow-y-auto">
                  {chatSessions.length > 0 ? (
                      <div className="divide-y divide-border">
                          {chatSessions.map(chat => (
                              <div key={chat.id} onClick={() => onOpenChat(chat.id)} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-start gap-3 group">
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <CinematicImage src={chat.petPhotoUrl} alt={chat.petName} className="w-full h-full object-cover bg-gray-200" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-sm text-foreground truncate">{chat.petName}</p>
                                          <span className="text-[10px] text-muted-foreground">{t('dashboard:shelter.now')}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">{chat.finderEmail}</p>
                                      <p className="text-xs text-primary mt-2 font-medium group-hover:underline">{t('dashboard:shelter.viewConversation')} &rarr;</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                          <p>{t('dashboard:shelter.noInquiries')}</p>
                      </div>
                  )}
              </div>

              {/* Shelter Kit Section */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/20">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-2xl">
                          📦
                      </div>
                      <div>
                          <h3 className="font-bold text-foreground">{t('dashboard:shelter.shelterKitTitle')}</h3>
                          <p className="text-xs text-muted-foreground">{t('dashboard:shelter.shelterKitDesc')}</p>
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

