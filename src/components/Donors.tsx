
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Donation } from '../types';
import { DonationModal } from './DonationModal';

interface DonorsProps {
    goBack: () => void;
    donations: Donation[];
}

export const Donors: React.FC<DonorsProps> = ({ goBack, donations }) => {
    const { t } = useTranslations();
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    // Filter only confirmed and public donations
    const displayDonations = (donations || []).filter(d => d.isConfirmed && d.isPublic);

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
            <button onClick={goBack} className="text-primary hover:brightness-125 font-semibold mb-6">&larr; {t('homeButton')}</button>
            
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">{t('donorsPageTitle')}</h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('donorsPageDesc')}</p>
            </div>

            {displayDonations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayDonations.map((donation, index) => (
                        <div 
                            key={donation.id} 
                            className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl fade-in-down scan-hover relative"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                                    {donation.avatarUrl ? (
                                        <img src={donation.avatarUrl} alt={donation.donorName} className="w-full h-full rounded-full object-cover border-2 border-white/10" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-xl font-bold text-primary">
                                            {donation.donorName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{donation.donorName}</h3>
                                    <p className="text-xs text-slate-400 font-mono">{new Date(donation.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="ml-auto bg-green-500/10 text-green-300 px-3 py-1 rounded-full text-sm font-bold font-mono shadow-sm">
                                    {donation.amount}
                                </div>
                            </div>
                            {donation.message ? (
                                <p className="text-sm text-slate-400 italic">"{donation.message}"</p>
                            ) : (
                                <p className="text-sm text-slate-400 opacity-50 italic">{t('anonymousDonor')}</p>
                            )}
                        </div>
                    ))}
                    
                    {/* CTA Card */}
                    <div className="glass-panel p-6 rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-center fade-in-down" style={{ animationDelay: '600ms' }}>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-3xl">🚀</div>
                        <h3 className="font-bold text-white mb-2">{t('supportUsTitle')}</h3>
                        <p className="text-sm text-slate-400 mb-4">{t('supportUsDesc')}</p>
                        <button onClick={() => setIsDonationModalOpen(true)} className="btn btn-primary text-sm">
                            {t('donateWithBitcoin')} / Card
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center hud-grid-bg">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-4xl">💎</div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('beTheFirstToDonate')}</h3>
                    <p className="text-slate-400 mb-6 max-w-md">{t('supportUsDesc')}</p>
                    <button onClick={() => setIsDonationModalOpen(true)} className="btn btn-primary px-8 py-3 text-lg shadow-lg">
                        {t('donateWithBitcoin')}
                    </button>
                </div>
            )}
        </div>
    );
};
