
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';

export const RoleExplorer: React.FC = () => {
    const { t } = useTranslations();
    const [activeRole, setActiveRole] = useState<'owner' | 'finder' | 'vet'>('owner');

    const content = {
        owner: [
            { icon: "🛡️", title: t('roleOwnerStep1Title'), desc: t('roleOwnerStep1Desc') },
            { icon: "🔍", title: t('roleOwnerStep2Title'), desc: t('roleOwnerStep2Desc') },
            { icon: "🏠", title: t('roleOwnerStep3Title'), desc: t('roleOwnerStep3Desc') }
        ],
        finder: [
            { icon: "📸", title: t('roleFinderStep1Title'), desc: t('roleFinderStep1Desc') },
            { icon: "🤖", title: t('roleFinderStep2Title'), desc: t('roleFinderStep2Desc') },
            { icon: "🤝", title: t('roleFinderStep3Title'), desc: t('roleFinderStep3Desc') }
        ],
        vet: [
            { icon: "🏥", title: t('roleVetStep1Title'), desc: t('roleVetStep1Desc') },
            { icon: "📂", title: t('roleVetStep2Title'), desc: t('roleVetStep2Desc') },
            { icon: "🧠", title: t('roleVetStep3Title'), desc: t('roleVetStep3Desc') }
        ]
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8 gap-2 p-1 bg-black/60 rounded-full max-w-md mx-auto backdrop-blur-xl border border-white/20 shadow-lg">
                {(['owner', 'finder', 'vet'] as const).map((role) => (
                    <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`flex-1 py-3 px-4 rounded-full text-sm font-bold transition-all duration-300 ${
                            activeRole === role 
                            ? 'bg-card text-primary shadow-md scale-105 border border-primary/20' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {t(`role${role.charAt(0).toUpperCase() + role.slice(1)}`)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent -z-10"></div>

                {content[activeRole].map((step, idx) => (
                    <div key={`${activeRole}-${idx}`} className="animate-fade-in text-center p-8 bg-card/90 rounded-2xl border border-white/10 backdrop-blur-xl hover:bg-card hover:border-primary/30 transition-all duration-300 shadow-xl group hover:-translate-y-1">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-6 transform rotate-3 group-hover:rotate-0 transition-transform">
                            {step.icon}
                        </div>
                        <h4 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
