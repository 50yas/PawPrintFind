
import React, { useState } from 'react';
import { Modal } from './Modal';
import { GlassButton } from './ui';
import { dbService } from '../services/firebase';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useTranslations } from '../hooks/useTranslations';
import { VetClinic } from '../types';

interface AddClinicModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddClinicModal: React.FC<AddClinicModalProps> = ({ onClose, onSuccess }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!name || !email || !address || !phone) {
            addSnackbar("All fields are required", 'error');
            return;
        }

        setIsUploading(true);
        try {
            const newClinic: VetClinic = {
                name,
                vetEmail: email,
                address,
                phone,
                isVerified: true // Admin added clinics are pre-verified
            };

            await dbService.saveClinic(newClinic);
            
            // Log the action
            await dbService.logAdminAction({
                adminEmail: 'SYSTEM_ADMIN', // Ideally pass from props
                action: 'MANUAL_CLINIC_REG',
                targetId: email,
                details: `Manually registered clinic: ${name}`
            });

            addSnackbar("Clinic registered successfully", 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Clinic Registration Error:", error);
            addSnackbar(error.message || "Registration failed", 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Manual Clinic Registration">
            <form onSubmit={handleSubmit} className="space-y-6 p-2">
                <div className="space-y-4">
                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">Clinic_Name</label>
                        <input 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="Quantum Veterinary Care"
                        />
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">Lead_Vet_Email</label>
                        <input 
                            required
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="lead@clinic.ai"
                        />
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">Geographical_Nexus (Address)</label>
                        <input 
                            required
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="123 Biometric Way, Cyber City"
                        />
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase text-primary mb-2 block tracking-widest">Comms_Frequency (Phone)</label>
                        <input 
                            required
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all font-medium"
                            placeholder="+1 (555) 999-0000"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-6">
                    <GlassButton type="button" onClick={onClose} variant="secondary" className="flex-1 !py-4 font-black tracking-widest">CANCEL</GlassButton>
                    <GlassButton type="submit" variant="primary" className="flex-1 !py-4 font-black tracking-widest" disabled={isUploading}>
                        {isUploading ? 'SYNCHRONIZING...' : 'AUTHORIZE_CLINIC'}
                    </GlassButton>
                </div>
            </form>
        </Modal>
    );
};
