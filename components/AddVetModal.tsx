
import React, { useState } from 'react';
import { Modal } from './Modal';
import { GlassButton } from './ui';
import { dbService } from '../services/firebase';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useTranslations } from '../hooks/useTranslations';

interface AddVetModalProps {
    onClose: () => void;
    onSuccess: () => void;
    adminEmail: string;
}

export const AddVetModal: React.FC<AddVetModalProps> = ({ onClose, onSuccess, adminEmail }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegistering(true);
        try {
            await dbService.registerUser(email, password, ['vet'], {
                isVerified: true, // Manual admin registration bypasses verification
                activeRole: 'vet'
            });

            await dbService.logAdminAction({
                adminEmail: adminEmail,
                action: 'MANUAL_VET_REG',
                targetId: email,
                details: `Manually registered vet: ${email}`
            });

            addSnackbar("Veterinarian registered and pre-verified", 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addSnackbar(error.message, 'error');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={t('dashboard:admin.manualVetIdentity')}>
            <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <div className="space-y-4">
                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">{t('dashboard:admin.vetEmailLabel')}</label>
                        <input 
                            required
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="doctor@clinic.com"
                        />
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">{t('dashboard:admin.initialPasswordLabel')}</label>
                        <input 
                            required
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="••••••••"
                        />
                        <p className="text-[9px] text-slate-500 mt-2 italic">{t('dashboard:admin.passwordPrompt')}</p>
                    </div>
                </div>

                <div className="flex gap-4 pt-6">
                    <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1">{t('dashboard:admin.cancelButton')}</GlassButton>
                    <GlassButton type="submit" variant="primary" className="flex-1" disabled={isRegistering}>
                        {isRegistering ? t('dashboard:admin.initializing') : t('dashboard:admin.authorizeVet')}
                    </GlassButton>
                </div>
            </form>
        </Modal>
    );
};
