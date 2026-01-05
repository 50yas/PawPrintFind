import React, { useState } from 'react';
import { Modal } from './Modal';
import { GlassButton } from './ui';
import { dbService } from '../services/firebase';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useTranslations } from '../hooks/useTranslations';

interface AddPatientModalProps {
    onClose: () => void;
    onSuccess: () => void;
    vetEmail: string;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ onClose, onSuccess, vetEmail }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [sendInvite, setSendInvite] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const petId = `pet_${Date.now()}`;
            const newPet: any = {
                id: petId,
                name,
                breed,
                ownerEmail: email || null,
                vetEmail: vetEmail,
                vetLinkStatus: 'linked',
                status: 'owned',
                isLost: false,
                photos: [],
                guardianEmails: [],
                healthChecks: [],
                sightings: [],
                homeLocations: [],
                createdAt: Date.now()
            };

            await dbService.savePet(newPet);

            if (sendInvite && email) {
                // Trigger an invitation email via Firebase function or similar
                // For now, we log the intent
                await dbService.logAdminAction({
                    adminEmail: vetEmail,
                    action: 'INVITE_OWNER',
                    targetId: email,
                    details: `Invited ${email} for pet ${name}`
                });
                addSnackbar(t('inviteOwnerAlert', { email }), 'success');
            } else {
                addSnackbar(t('patientAddedLocallyAlert'), 'success');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            addSnackbar(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={t('addPatientTitle')}>
            <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase text-primary mb-2 block">{t('petNameLabel')}</label>
                        <input 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="input-base w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white"
                            placeholder="es. Max"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-primary mb-2 block">{t('breedLabel')}</label>
                        <input 
                            required
                            value={breed}
                            onChange={e => setBreed(e.target.value)}
                            className="input-base w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white"
                            placeholder="es. Labrador"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-primary mb-2 block">
                            {t('ownerEmailLabel')} <span className="opacity-50 lowercase italic">{t('optionalLabel')}</span>
                        </label>
                        <input 
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input-base w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white"
                            placeholder="owner@example.com"
                        />
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={sendInvite} 
                                onChange={e => setSendInvite(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-primary/30 bg-black/20 text-primary focus:ring-primary/20"
                            />
                            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{t('sendInviteCheckbox')}</span>
                        </label>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            {t('inviteOwnerExplanation')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1">
                        {t('cancelButton')}
                    </GlassButton>
                    <GlassButton type="submit" variant="primary" className="flex-1" disabled={isLoading}>
                        {isLoading ? '...' : t('addPatientOnlyButton')}
                    </GlassButton>
                </div>
            </form>
        </Modal>
    );
};