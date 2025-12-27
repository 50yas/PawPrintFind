
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Donation } from '../types';

interface DonorTickerProps {
    onViewAll: () => void;
    donations: Donation[];
}

export const DonorTicker: React.FC<DonorTickerProps> = ({ onViewAll, donations }) => {
    const { t } = useTranslations();

    if (donations.length === 0) return null;

    return (
        <section className="scroll-animation py-10 border-t border-white/10 bg-black/5 dark:bg-black/20 overflow-hidden">
            <div className="container mx-auto px-4 mb-6 text-center">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('donorsPageTitle')}</h4>
            </div>
            <div className="relative w-full overflow-hidden">
                <div className="flex animate-marquee pause-on-hover gap-8 items-center whitespace-nowrap min-w-full px-4">
                    {/* Tripling the data ensures smooth infinite scroll effect even with few items */}
                    {[...donations, ...donations, ...donations].map((donor, i) => (
                        <div key={`${donor.id}-${i}`} className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-sm hover:bg-card/80 transition-colors cursor-default">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                                {donor.avatarUrl ? (
                                    <img src={donor.avatarUrl} alt={donor.donorName} className="w-full h-full rounded-full object-cover border border-card" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-xs font-bold text-primary">
                                        {donor.donorName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-foreground">{donor.donorName}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{donor.message || t('anonymousDonor')}</span>
                            </div>
                            <span className="ml-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">{donor.amount}</span>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
            </div>
            <div className="text-center mt-6">
                <button onClick={onViewAll} className="text-xs font-semibold text-primary hover:underline">
                    {t('donorsButton')} &rarr;
                </button>
            </div>
        </section>
    );
};
