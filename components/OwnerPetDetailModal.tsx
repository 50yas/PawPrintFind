
import React from 'react';
import { PetProfile, Appointment } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';
import { CinematicImage } from './ui/CinematicImage';

interface OwnerPetDetailModalProps {
  pet: PetProfile;
  appointments: Appointment[];
  onClose: () => void;
  onEdit: () => void;
}

export const OwnerPetDetailModal: React.FC<OwnerPetDetailModalProps> = ({ pet, appointments, onClose, onEdit }) => {
  const { t } = useTranslations();
  const petAppointments = appointments.filter(a => a.petId === pet.id && a.status !== 'cancelled');

  return (
    <Modal isOpen={true} onClose={onClose} title={pet.name}>
      <div className="space-y-6">
        {/* Header Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-48 group">
            <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${pet.isLost ? 'bg-red-500' : 'bg-green-500'}`}>
                        {pet.isLost ? t('statusLost') : t('statusSafe')}
                    </span>
                    {pet.aiIdentityCode && <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/20 backdrop-blur-sm border border-white/30">{pet.aiIdentityCode}</span>}
                </div>
                <h2 className="text-3xl font-bold">{pet.name}</h2>
                <p className="text-sm opacity-90">{pet.breed} • {pet.age}</p>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('weightLabel')}</span>
                <span className="text-lg font-bold text-foreground">{pet.weight || 'N/A'}</span>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('vetLinkedBadge')}</span>
                <span className={`text-lg font-bold ${pet.vetLinkStatus === 'linked' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {pet.vetLinkStatus === 'linked' ? 'Yes' : 'No'}
                </span>
            </div>
        </div>

        {/* Medical Summary */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                {t('medicalRecordTitle')}
            </h3>
            <div className="text-sm space-y-1 text-indigo-700 dark:text-indigo-300">
                <p><span className="font-semibold">{t('vaccinationsTitle')}:</span> {pet.medicalRecord?.vaccinations?.length || 0} recorded</p>
                <p><span className="font-semibold">{t('allergiesLabel')}:</span> {pet.medicalRecord?.allergies || 'None'}</p>
                <p><span className="font-semibold">{t('medicationsLabel')}:</span> {pet.medicalRecord?.medications || 'None'}</p>
            </div>
        </div>

        {/* Integrated Calendar / Upcoming Appointments */}
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {t('upcomingAppointments')}
                </h3>
            </div>
            {petAppointments.length > 0 ? (
                <div className="space-y-2">
                    {petAppointments.map(app => (
                        <div key={app.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                            <div className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-xs text-center min-w-[50px]">
                                {new Date(app.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm font-semibold text-foreground">{app.notes || 'Check-up'}</p>
                                <p className="text-xs text-muted-foreground">{app.time}</p>
                            </div>
                            <span className={`w-2 h-2 rounded-full ${app.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4 italic">{t('noAppointments')}</p>
            )}
        </div>

        <div className="flex justify-end pt-2">
            <button onClick={onEdit} className="text-sm text-primary hover:underline font-semibold">{t('editButton')}</button>
        </div>
      </div>
    </Modal>
  );
};
