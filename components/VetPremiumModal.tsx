
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useTranslations } from '../hooks/useTranslations';
import { subscriptionService } from '../services/subscriptionService';
import { LoadingSpinner } from './LoadingSpinner';

interface VetPremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// TODO: Replace with actual Stripe Price ID from your Dashboard
// e.g. price_12345ABCDE
const VET_PRO_PRICE_ID = 'price_1SqNiAF5MKyyAoN77pmtoP8M'; 

export const VetPremiumModal: React.FC<VetPremiumModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslations();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            await subscriptionService.subscribeToPlan(VET_PRO_PRICE_ID);
            // Redirect happens in service
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            alert("Subscription failed. Please try again.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Vet Pro 🏥">
            <div className="space-y-6">
                <div className="text-center">
                    <div className="text-5xl mb-4">🦁</div>
                    <h3 className="text-2xl font-black text-primary">Unlock Professional Tools</h3>
                    <p className="text-muted-foreground mt-2">Manage your clinic efficiently with AI-powered insights.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 opacity-70">
                        <h4 className="font-bold text-lg mb-2">Free Plan</h4>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                            <li>✓ Basic Patient Records (Max 5)</li>
                            <li>✓ Manual Appointments</li>
                            <li>✓ Community Visibility</li>
                        </ul>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-2 py-1">RECOMMENDED</div>
                        <h4 className="font-bold text-lg mb-2 text-primary">Vet Pro</h4>
                        <ul className="text-sm space-y-2 font-medium">
                            <li>✓ <strong>Unlimited</strong> Patients</li>
                            <li>✓ <strong>AI Health Analytics</strong> & Triage</li>
                            <li>✓ Smart Calendar & Reminders</li>
                            <li>✓ Priority Support</li>
                        </ul>
                        <div className="mt-4 text-xl font-black">€18.00 <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleSubscribe} 
                        disabled={isLoading}
                        className="w-full btn btn-primary py-4 text-lg font-black shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Upgrade Now'}
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground mt-3">Secured by Stripe SSL. Cancel anytime.</p>
                </div>
            </div>
        </Modal>
    );
};
