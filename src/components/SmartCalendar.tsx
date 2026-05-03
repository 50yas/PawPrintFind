
import React, { useState } from 'react';
import { PetProfile, Appointment } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { aiBridgeService } from '../services/aiBridgeService';
import { LoadingSpinner } from './LoadingSpinner';

interface SmartCalendarProps {
  vetPatients: PetProfile[];
  appointments: Appointment[];
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'requestedBy'>) => void;
  onStatusChange: (appointmentId: string, status: 'confirmed' | 'cancelled') => void;
}

export const SmartCalendar: React.FC<SmartCalendarProps> = ({ vetPatients, appointments, onAddAppointment, onStatusChange }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const [selectedPetId, setSelectedPetId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPet = vetPatients.find(p => p.id === selectedPetId);
    if (selectedPet && date && time) {
      onAddAppointment({
        vetEmail: selectedPet.vetEmail || '',
        petId: selectedPet.id,
        petName: selectedPet.name,
        date,
        time,
        notes,
      });
      setSelectedPetId('');
      setDate('');
      setTime('');
      setNotes('');
    }
  };

  const handleAiQuery = async () => {
    if(!aiQuery) return;
    setIsQuerying(true);
    setAiResponse('');
    try {
        const response = await aiBridgeService.queryVetPatientData(vetPatients, appointments, aiQuery);
        setAiResponse(response);
    } catch(err) {
        console.error(err);
        addSnackbar(t('genericError'), 'error');
    }
    setIsQuerying(false);
  }

  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments
    .filter(a => a.date >= today && a.status !== 'cancelled')
    .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });
    
  const labelStyles = "block text-sm font-medium text-slate-400";

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
      {/* Left Column: AI and New Appointment */}
      <div className="lg:col-span-4 space-y-8">
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
             <h3 className="text-xl font-bold mb-2">{t('aiScheduleAssistantTitle')}</h3>
             <p className="text-indigo-100 text-sm mb-4">{t('aiScheduleAssistantDesc')}</p>
             <div className="relative">
                <textarea 
                    value={aiQuery} 
                    onChange={e => setAiQuery(e.target.value)} 
                    placeholder={t('aiAssistantPlaceholder')} 
                    rows={3} 
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm text-white placeholder:text-indigo-200 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-colors resize-none"
                ></textarea>
                <button 
                    onClick={handleAiQuery} 
                    disabled={isQuerying} 
                    className="absolute bottom-2 right-2 p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                >
                    {isQuerying ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                </button>
             </div>
             {aiResponse && (
                 <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/10 animate-fade-in text-sm">
                     <p className="whitespace-pre-wrap">{aiResponse}</p>
                 </div>
             )}
         </div>

         <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-md border border-white/10 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-4 flex items-center gap-3">{t('newAppointmentTitle')}<span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span></h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patient" className={labelStyles}>{t('selectPatientLabel')}</label>
              <select id="patient" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} required className="input-base mt-1">
                <option value="">{t('selectPatientPlaceholder')}</option>
                {vetPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className={labelStyles}>{t('dateLabel')}</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="input-base mt-1" />
              </div>
              <div>
                <label htmlFor="time" className={labelStyles}>{t('timeLabel')}</label>
                <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} required className="input-base mt-1" />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelStyles}>{t('notesLabel')}</label>
              <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-base mt-1"></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full !bg-green-600 hover:!bg-green-700 shadow-lg shadow-green-500/20">{t('scheduleAppointmentButton')}</button>
          </form>
        </div>
      </div>

      {/* Right Column: Agenda View */}
      <div className="lg:col-span-8 bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-white/10 h-full flex flex-col relative">
        <div className="flex justify-between items-center mb-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">{t('upcomingAppointments')}<span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span></h3>
            <div className="text-sm text-slate-400 font-mono">
                {upcomingAppointments.length} events
            </div>
        </div>
        
        <div className="flex-grow space-y-1 overflow-y-auto pr-2">
            {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((app, index) => {
                     const appDate = new Date(app.date);
                     const isToday = app.date === today;
                     
                     return (
                        <div key={app.id} className="flex gap-4 py-3 group hover:bg-white/5 rounded-xl p-2 transition-colors scan-hover">
                            <div className="flex flex-col items-center min-w-[60px]">
                                <span className="text-xs font-bold text-slate-400 uppercase font-mono">{appDate.toLocaleDateString(undefined, { month: 'short' })}</span>
                                <span className={`text-2xl font-bold font-mono ${isToday ? 'text-primary' : 'text-white'}`}>{appDate.getDate()}</span>
                            </div>
                            <div className="w-1.5 rounded-full bg-gray-700 relative">
                                {isToday && <div className="absolute top-0 w-full h-full bg-primary rounded-full"></div>}
                            </div>
                            <div className="flex-grow pb-4 border-b border-white/10 group-last:border-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{app.petName}</h4>
                                        <p className="text-sm text-primary font-medium font-mono">{app.time}</p>
                                        <p className="text-sm text-slate-400 mt-1">{app.notes || t('generalCheckup')}</p>
                                    </div>
                                    {app.status === 'pending' ? (
                                        <div className="flex flex-col gap-2">
                                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wide rounded-full self-end">{t('pendingStatusBadge')}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => onStatusChange(app.id, 'confirmed')} className="p-1 bg-green-500/10 text-green-400 rounded-full hover:bg-green-500/20" title={t('confirmAction')}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                                                <button onClick={() => onStatusChange(app.id, 'cancelled')} className="p-1 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20" title={t('declineAction')}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wide rounded-full">{t('confirmedStatus')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                     )
                })
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-60 hud-grid-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-lg font-medium text-white">{t('noAppointments')}</p>
                    <p className="text-sm text-slate-400">Your schedule is clear.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
