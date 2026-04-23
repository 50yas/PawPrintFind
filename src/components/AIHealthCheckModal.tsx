
import React, { useState } from 'react';
import { PetProfile, HealthCheck } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { Modal } from './Modal';
import { aiBridgeService } from '../services/aiBridgeService';
import { LoadingSpinner } from './LoadingSpinner';

interface AIHealthCheckModalProps {
  pet: PetProfile;
  onClose: () => void;
  onComplete: (petId: string, healthCheck: HealthCheck) => void;
  onBookAppointment: (pet: PetProfile) => void;
}

export const AIHealthCheckModal: React.FC<AIHealthCheckModalProps> = ({ pet, onClose, onComplete, onBookAppointment }) => {
  const { t, locale } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setIsLoading(true);
    setAnalysis('');
    try {
      const result = await aiBridgeService.performAIHealthCheck(pet, symptoms, locale);
      setAnalysis(result);
      const newHealthCheck: HealthCheck = {
        timestamp: Date.now(),
        symptoms,
        advice: result,
      };
      onComplete(pet.id, newHealthCheck);
    } catch (error) {
      console.error("Health check failed:", error);
      addSnackbar(t('genericError'), 'error');
    }
    setIsLoading(false);
  };
  
  const renderAnalysis = (text: string) => {
      const parts = text.split('\n');
      return parts.map((part, index) => {
        if(part.startsWith('***')) {
            // Robust replacement for bold markers
            return <p key={index} className="font-bold text-amber-400 my-2">{part.replace(/\*/g, '')}</p>
        }
        return <p key={index} className="mb-2">{part}</p>
      })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={t('aiHealthCheckTitle', { petName: pet.name })}>
      {!analysis ? (
        <form onSubmit={handleAnalyze} className="space-y-4 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl animate-pulse">🩺</span>
                </div>
              </div>
              <p className="mt-4 text-primary font-black uppercase tracking-[0.2em] text-xs animate-pulse">
                {t('dashboard:admin.analyzing')}...
              </p>
            </div>
          )}
          <p className="text-slate-400">{t('aiHealthCheckDesc')}</p>
          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-slate-400">{t('symptomsLabel')}</label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className="input-base mt-1 focus:ring-primary/20"
              placeholder={t('symptomsPlaceholder')}
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full flex justify-center py-3 shadow-lg shadow-primary/20">
            {t('analyzeSymptomsButton')}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <h4 className="font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            {t('analysisResultTitle')}
          </h4>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
            {renderAnalysis(analysis)}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
             <button onClick={() => onBookAppointment(pet)} className="btn btn-primary flex-grow font-black uppercase tracking-widest text-xs py-3">{t('bookAppointmentButton')}</button>
             <button onClick={onClose} className="glass-btn flex-grow font-black uppercase tracking-widest text-xs py-3">{t('closeButton')}</button>
          </div>
        </div>
      )}
    </Modal>
  );
};
