
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';

interface AddPatientModalProps {
  onClose: () => void;
  onConfirm: (data: { name: string; breed: string; ownerEmail: string; ownerPhone: string; sendInvite: boolean }) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ onClose, onConfirm }) => {
  const { t } = useTranslations();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [sendInvite, setSendInvite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Name is required, Breed is now optional
    if (name) {
        setIsSubmitting(true);
        // Simulate API delay
        setTimeout(() => {
            onConfirm({ name, breed, ownerEmail, ownerPhone, sendInvite });
            setIsSubmitting(false);
        }, 800);
    }
  };

  const labelStyles = "block text-sm font-medium text-muted-foreground";

  return (
    <Modal isOpen={true} onClose={onClose} title={t('addPatientTitle')}>
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl mb-3">
            🐾
        </div>
        <p className="text-muted-foreground text-center text-sm">{t('addPatientDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label htmlFor="petName" className={labelStyles}>{t('petNameLabel')}</label>
            <input
                id="petName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-base mt-1"
                placeholder="Buddy"
            />
            </div>
            <div>
            <label htmlFor="breed" className={labelStyles}>{t('breedLabel')} {t('optionalLabel')}</label>
            <input
                id="breed"
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="input-base mt-1"
                placeholder="Golden Retriever"
            />
            </div>
        </div>
        
        <div className="border-t border-border pt-4 mt-2">
            <h4 className="text-sm font-bold text-card-foreground mb-3 uppercase tracking-wide text-xs">Owner Details (Optional)</h4>
            
            {/* Logic Explanation for Vets */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                <div className="flex gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        {t('inviteOwnerExplanation')}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                <label htmlFor="ownerEmail" className={labelStyles}>{t('ownerEmailLabel')} {t('optionalLabel')}</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    </div>
                    <input
                        id="ownerEmail"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="input-base pl-9"
                        placeholder="owner@example.com"
                    />
                </div>
                </div>
                <div>
                <label htmlFor="ownerPhone" className={labelStyles}>{t('ownerPhoneLabel')}</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    </div>
                    <input
                        id="ownerPhone"
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="input-base pl-9"
                        placeholder="+1 234 567 890"
                    />
                </div>
                </div>
                
                {ownerEmail && (
                    <label className="flex items-center space-x-2 mt-2 cursor-pointer bg-muted p-2 rounded-lg transition-colors hover:bg-muted/80">
                        <input 
                            type="checkbox" 
                            checked={sendInvite} 
                            onChange={(e) => setSendInvite(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm font-medium text-foreground">{t('sendInviteCheckbox')}</span>
                    </label>
                )}
            </div>
        </div>

        <div className="pt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary">{t('cancelButton')}</button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary min-w-[140px] flex justify-center">
            {isSubmitting ? <LoadingSpinner /> : (sendInvite ? t('sendInviteButton') : t('addPatientOnlyButton'))}
          </button>
        </div>
      </form>
    </Modal>
  );
};
