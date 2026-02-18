import React, { useState } from 'react';
import { dbService } from '../services/firebase';
import { useTranslations } from '../hooks/useTranslations';
import { GlassButton } from './ui/GlassButton';

interface VetProUpgradeModalProps {
    onClose: () => void;
    vetUid: string;
    isVerified: boolean;
}

export const VetProUpgradeModal: React.FC<VetProUpgradeModalProps> = ({ onClose, vetUid, isVerified }) => {
    const { t } = useTranslations();
    const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const { url } = await dbService.createVetProCheckout(vetUid, plan);
            window.location.href = url;
        } catch (error) {
            alert('Failed to create checkout session. Please try again.');
            setLoading(false);
        }
    };

    const features = [
        { name: 'Patient Management', free: '5/month', pro: 'Unlimited' },
        { name: 'Basic Appointments', free: true, pro: true },
        { name: 'AI Health Analytics', free: false, pro: true },
        { name: 'Priority Support', free: false, pro: true },
        { name: 'Custom Clinic Branding', free: false, pro: true },
        { name: 'Advanced Scheduling', free: false, pro: true }
    ];

    if (!isVerified) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900/95 border border-yellow-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-yellow-500/20">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-black text-white mb-4">Verification Required</h2>
                    <p className="text-slate-300 mb-6">
                        You must submit your professional verification documents before upgrading to Pro.
                    </p>
                    <GlassButton onClick={onClose} className="w-full">
                        Got it
                    </GlassButton>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900/95 border border-primary/30 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/20">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-black text-white flex items-center gap-2">
                        <span className="text-primary">👑</span>
                        Upgrade to Pro
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Plan Toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button
                        onClick={() => setPlan('monthly')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${plan === 'monthly'
                                ? 'bg-gradient-to-r from-primary to-cyan-500 text-black'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setPlan('yearly')}
                        className={`relative px-6 py-3 rounded-xl font-bold transition-all ${plan === 'yearly'
                                ? 'bg-gradient-to-r from-primary to-cyan-500 text-black'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Yearly
                        <span className="absolute -top-2 -right-2 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                            SAVE 17%
                        </span>
                    </button>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                    <div className="text-6xl font-black text-white mb-2">
                        €{plan === 'monthly' ? '49' : '490'}
                        <span className="text-2xl text-slate-400 font-normal">/{plan === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    {plan === 'yearly' && (
                        <p className="text-sm text-green-400">
                            That's €41/month - Save €98 per year! 🎉
                        </p>
                    )}
                </div>

                {/* Feature Comparison Table */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden mb-8">
                    <div className="grid grid-cols-3 bg-slate-800/50 px-4 py-3 text-xs font-bold text-slate-300 uppercase">
                        <div>Feature</div>
                        <div className="text-center">Free</div>
                        <div className="text-center text-primary">Pro</div>
                    </div>
                    {features.map((feature, i) => (
                        <div key={i} className={`grid grid-cols-3 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                            <div className="text-white font-medium">{feature.name}</div>
                            <div className="text-center">
                                {typeof feature.free === 'boolean' ? (
                                    feature.free ? (
                                        <span className="text-green-400">✓</span>
                                    ) : (
                                        <span className="text-slate-600">✗</span>
                                    )
                                ) : (
                                    <span className="text-slate-300">{feature.free}</span>
                                )}
                            </div>
                            <div className="text-center">
                                {typeof feature.pro === 'boolean' ? (
                                    feature.pro ? (
                                        <span className="text-primary text-lg">✓</span>
                                    ) : (
                                        <span className="text-slate-600">✗</span>
                                    )
                                ) : (
                                    <span className="text-primary font-bold">{feature.pro}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <GlassButton
                    onClick={handleUpgrade}
                    isLoading={loading}
                    className="w-full py-4 text-lg"
                >
                    Upgrade to Pro - €{plan === 'monthly' ? '49/mo' : '490/yr'} 🚀
                </GlassButton>

                <p className="text-xs text-center text-slate-500 mt-4">
                    Secure payment powered by Stripe • Cancel anytime • No hidden fees
                </p>
            </div>
        </div>
    );
};
