
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
        <form onSubmit={handleAnalyze} className="space-y-4">
          <p className="text-slate-400">{t('aiHealthCheckDesc')}</p>
          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-slate-400">{t('symptomsLabel')}</label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className="input-base mt-1"
              placeholder={t('symptomsPlaceholder')}
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full flex justify-center">
            {isLoading ? <LoadingSpinner /> : t('analyzeSymptomsButton')}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <h4 className="font-bold text-lg text-white">{t('analysisResultTitle')}</h4>
          <div className="prose prose-sm prose-invert max-w-none text-slate-400 bg-white/5 p-4 rounded-md max-h-60 overflow-y-auto">
            {renderAnalysis(analysis)}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
             <button onClick={() => onBookAppointment(pet)} className="btn btn-primary flex-grow">{t('bookAppointmentButton')}</button>
             <button onClick={onClose} className="glass-btn flex-grow">{t('closeButton')}</button>
          </div>
        </div>
      )}
    </Modal>
  );
};
