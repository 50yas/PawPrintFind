
import React, { useState } from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { AddPatientModal } from './AddPatientModal';
import { CinematicImage } from './ui/CinematicImage';
import { VetPremiumModal } from './VetPremiumModal';
import { subscriptionService } from '../services/subscriptionService';

interface MyPatientsProps {
  vetPatients: PetProfile[];
  pendingRequests: PetProfile[];
  vetEmail: string;
  currentUser: User; // Added prop
  onAccept: (petId: string) => void;
  onDecline: (petId: string) => void;
  onViewPatient: (pet: PetProfile) => void;
  onAddPatient: (data: { name: string; breed: string; ownerEmail: string; ownerPhone: string }) => void;
}

export const MyPatients: React.FC<MyPatientsProps> = ({ vetPatients, pendingRequests, vetEmail, currentUser, onAccept, onDecline, onViewPatient, onAddPatient }) => {
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const filteredPatients = vetPatients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPro = currentUser.subscription?.status === 'active' || currentUser.subscription?.status === 'trialing';
  const patientLimit = isPro ? Infinity : 5;
  const patientCount = vetPatients.length;
  const isLimitReached = patientCount >= patientLimit;

  const handleAddClick = () => {
      if (isLimitReached) {
          setShowPremiumModal(true);
      } else {
          setIsAddingPatient(true);
      }
  };

  const handleAcceptClick = (petId: string) => {
      if (isLimitReached) {
          setShowPremiumModal(true);
      } else {
          onAccept(petId);
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        <VetPremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
        
        {isAddingPatient && (
            <AddPatientModal 
                onClose={() => setIsAddingPatient(false)} 
                onSuccess={() => {
                    setIsAddingPatient(false);
                }}
                vetEmail={vetEmail}
            />
        )}

        {/* Subscription Banner */}
        {!isPro && (
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 rounded-xl flex items-center justify-between text-white shadow-lg border border-white/10 animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">🦁</div>
                    <div>
                        <p className="font-bold text-sm">Free Plan Limit: {patientCount}/{patientLimit} Patients</p>
                        <p className="text-xs text-indigo-200">Upgrade to Pro for unlimited records & AI analytics.</p>
                    </div>
                </div>
                <button onClick={() => setShowPremiumModal(true)} className="btn bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold px-4 py-2 shadow-md">
                    Upgrade
                </button>
            </div>
        )}

        {/* Pending Requests Banner */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-6 fade-in-down">
            <h3 className="text-xl font-bold text-amber-200 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {t('pendingRequests')} ({pendingRequests.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map(pet => (
                <div key={pet.id} className="bg-white/5 backdrop-blur-xl p-4 rounded-xl shadow-sm flex items-center gap-4 border border-white/10 scan-hover">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    <CinematicImage src={pet.photos[0]?.url} alt={pet.name} />
                  </div>
                  <div className="flex-grow min-w-0">
                      <p className="font-bold text-white truncate">{pet.name}</p>
                      <p className="text-xs text-slate-400 truncate">{pet.ownerEmail}</p>
                      <div className="flex mt-2 gap-2">
                        <button onClick={() => handleAcceptClick(pet.id)} className="flex-1 btn btn-primary !bg-green-600 !text-xs !py-1">{t('acceptButton')}</button>
                        <button onClick={() => onDecline(pet.id)} className="flex-1 glass-btn !text-xs !py-1">{t('declineButton')}</button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-sm relative">
            <div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <h2 className="text-2xl font-bold text-white">{t('myPatientsTitle')}</h2>
                <p className="text-sm text-slate-400">{t('confirmedPatients', { count: vetPatients.length })}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('searchPatients')} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-base pl-10 !rounded-full shadow-sm" 
                    />
                </div>
                <button onClick={handleAddClick} className="btn btn-primary shadow-lg shadow-primary/30 whitespace-nowrap flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    {t('addPatientButton')}
                </button>
            </div>
        </div>
        
        {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((pet, index) => (
                <div key={pet.id} onClick={() => onViewPatient(pet)} className="glass-panel rounded-2xl p-0 overflow-hidden cursor-pointer group hover:border-primary/50 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 fade-in-down" style={{animationDelay: `${index * 50}ms`}}>
                    <div className="relative h-40 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                        <CinematicImage src={pet.photos[0]?.url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'} alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                        <div className="absolute bottom-3 left-4 z-20">
                             <h3 className="text-xl font-bold text-white">{pet.name}</h3>
                             <p className="text-xs text-white/80">{pet.breed}, {pet.age}</p>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-white flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${pet.isLost ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                {pet.isLost ? t('statusLost') : t('statusSafe')}
                            </span>
                            {pet.medicalRecord?.vaccinations?.length ? (
                                <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full font-bold">{t('vaccinatedBadge')}</span>
                            ) : null}
                        </div>
                        
                        <div className="space-y-2 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="truncate">{pet.ownerEmail}</span>
                            </div>
                            {pet.medicalRecord && (
                                <div className="flex items-center gap-2 text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span>{t('medicalRecordActive')}</span>
                                </div>
                            )}
                        </div>

                        <button className="mt-4 w-full glass-btn group-hover:bg-primary group-hover:text-white transition-colors">{t('viewRecordButton')}</button>
                    </div>
                </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 glass-panel rounded-2xl hud-grid-bg">
                <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">{t('noPatientsYet')}</h3>
                <p className="text-slate-400 mt-2 mb-6 max-w-md mx-auto">{t('noPatientsYetDesc')}</p>
                <button onClick={() => setIsAddingPatient(true)} className="btn btn-primary shadow-lg shadow-primary/30">
                    + {t('addPatientButton')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
