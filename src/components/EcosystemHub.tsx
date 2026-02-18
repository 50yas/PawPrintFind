
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './ui/GlassCard';
import { View } from '../types';

interface EcosystemNodeProps {
    title: string;
    description: string;
    icon: string;
    view?: View;
    onNavigate: (view: View) => void;
    status: 'active' | 'beta' | 'planned';
}

const EcosystemNode = memo(({ title, description, icon, view, onNavigate, status }: EcosystemNodeProps) => {
    return (
        <GlassCard 
            variant="interactive" 
            onClick={() => view && onNavigate(view)}
            className="p-6 flex flex-col h-full border-white/10 hover:border-primary/40 group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                    status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    status === 'beta' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                    {status}
                </span>
            </div>
            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed flex-grow">{description}</p>
            
            {/* Nav Link Decoration */}
            {view && (
                <div className="mt-4 flex items-center gap-2 text-primary font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Access Protocol <span className="animate-pulse">→</span>
                </div>
            )}
        </GlassCard>
    );
});

export const EcosystemHub: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { t } = useTranslations();

    const sections = [
        {
            title: "Core Intelligence",
            nodes: [
                { title: "AI Vision", description: "Multi-modal breed and unique marking identification powered by Gemini 2.0 Pro.", icon: "👁️", view: 'home' as View, status: 'active' as const },
                { title: "Health Triage", description: "Proactive AI assessments and symptoms analysis for immediate guidance.", icon: "🩺", view: 'home' as View, status: 'active' as const },
                { title: "Smart Search", description: "Natural language queries to find exact matches across the global database.", icon: "🔍", view: 'adoptionCenter' as View, status: 'active' as const }
            ]
        },
        {
            title: "Safety Grid",
            nodes: [
                { title: "Smart Geofencing", description: "Predictive safe-zone monitoring and automatic alert triggering.", icon: "📍", view: 'dashboard' as View, status: 'active' as const },
                { title: "Global Alerts", description: "Instant community-wide broadcasts for missing pet reports.", icon: "🚨", view: 'lostPetsCenter' as View, status: 'active' as const },
                { title: "Sightings Map", description: "Real-time interactive tracking of verified pet encounters.", icon: "🗺️", view: 'lostPetsCenter' as View, status: 'active' as const }
            ]
        },
        {
            title: "External Intel",
            nodes: [
                { title: "Social Scraper", description: "Autonomous AI agents discovering lost pet reports across social platforms.", icon: "📡", status: 'active' as const },
                { title: "Vet Network", description: "Integrated professional verification and patient management systems.", icon: "🏥", view: 'findVet' as View, status: 'active' as const },
                { title: "Community Hub", description: "Decentralized support network for pet owners and volunteers.", icon: "👥", view: 'community' as View, status: 'active' as const }
            ]
        }
    ];

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 bg-slate-950 relative overflow-hidden">
            {/* Background HUD Decor */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary rounded-full animate-ping"></div>
                <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-secondary rounded-full animate-ping delay-700"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-16">
                    <button 
                        onClick={() => onNavigate('home')}
                        className="text-primary font-black uppercase tracking-widest text-[10px] mb-4 hover:text-white transition-colors"
                    >
                        ← Back to Base
                    </button>
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                        System <span className="text-primary">Ecosystem</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl">
                        A centralized overview of the Paw Print autonomous safety network and its integrated AI protocols.
                    </p>
                </div>

                <div className="space-y-12">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-6">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                                {section.title}
                                <div className="flex-1 h-px bg-white/5"></div>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {section.nodes.map((node, nIdx) => (
                                    <EcosystemNode key={nIdx} {...node} onNavigate={onNavigate} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
