
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface PrioritySupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
}

export const PrioritySupportModal: React.FC<PrioritySupportModalProps> = ({ isOpen, onClose, userEmail }) => {
    const { t } = useTranslations();
    const [isConnecting, setIsConnecting] = useState(false);

    const handleStartChat = () => {
        setIsConnecting(true);
        // Mock connection delay
        setTimeout(() => {
            alert("This would connect to Intercom/Zendesk in a production app.");
            setIsConnecting(false);
            onClose();
        }, 1500);
    };

    const handleEmailSupport = () => {
        window.location.href = `mailto:support@pawprint.app?subject=Priority Support Request: ${userEmail}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('prioritySupportTitle')}>
            <div className="space-y-6">
                <div className="text-center">
                    <div className="text-5xl mb-4">🚀</div>
                    <h3 className="text-xl font-bold text-foreground">{t('prioritySupportDesc')}</h3>
                    <p className="text-muted-foreground text-sm mt-2">{t('prioritySupportSubtext')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={handleStartChat} 
                        disabled={isConnecting}
                        className="btn btn-primary w-full py-4 flex items-center justify-center gap-3 shadow-lg"
                    >
                        {isConnecting ? (
                            <span>{t('chatConnecting')}</span>
                        ) : (
                            <>
                                <span className="text-xl">💬</span>
                                <span className="font-bold">{t('startLiveChatButton')}</span>
                            </>
                        )}
                    </button>

                    <button 
                        onClick={handleEmailSupport} 
                        className="btn bg-card border border-border w-full py-4 flex items-center justify-center gap-3 hover:bg-muted"
                    >
                        <span className="text-xl">✉️</span>
                        <span className="font-bold text-foreground">{t('sendEmailButton')}</span>
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {t('avgResponseTime')}: &lt; 5 min
                    </p>
                </div>
            </div>
        </Modal>
    );
};
