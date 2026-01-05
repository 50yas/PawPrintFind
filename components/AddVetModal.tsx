
import React, { useState } from 'react';
import { Modal } from './Modal';
import { GlassButton } from './ui';
import { dbService } from '../services/firebase';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useTranslations } from '../hooks/useTranslations';

interface AddVetModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddVetModal: React.FC<AddVetModalProps> = ({ onClose, onSuccess }) => {
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
                adminEmail: 'SYSTEM_ADMIN',
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
        <Modal isOpen={true} onClose={onClose} title="Manual Vet Registration">
            <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <div className="space-y-4">
                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">Vet_Email</label>
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
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">Initial_Password</label>
                        <input 
                            required
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="••••••••"
                        />
                        <p className="text-[9px] text-slate-500 mt-2 italic">User will be prompted to change this upon first login protocol.</p>
                    </div>
                </div>

                <div className="flex gap-4 pt-6">
                    <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1">CANCEL</GlassButton>
                    <GlassButton type="submit" variant="primary" className="flex-1" disabled={isRegistering}>
                        {isRegistering ? 'INITIALIZING...' : 'AUTHORIZE_VET'}
                    </GlassButton>
                </div>
            </form>
        </Modal>
    );
};
