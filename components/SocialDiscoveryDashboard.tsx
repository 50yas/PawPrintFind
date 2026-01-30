
import React, { useState, useEffect } from 'react';
import { scraperService, ScrapedSighting } from '../services/scraperService';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard, GlassButton, CinematicImage } from './ui';
import { LoadingSpinner } from './LoadingSpinner';

export const SocialDiscoveryDashboard: React.FC = () => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [sightings, setSightings] = useState<ScrapedSighting[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSightings = async () => {
        setIsLoading(true);
        try {
            const data = await scraperService.getScrapedSightings();
            setSightings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSightings();
    }, []);

    const handleLaunchDiscovery = async () => {
        if (!searchQuery) return;
        setIsDiscovering(true);
        try {
            await scraperService.launchDiscovery(searchQuery);
            addSnackbar("Discovery job queued. Agent initialized.", 'success');
            setSearchQuery('');
        } catch (e) {
            addSnackbar("Failed to launch discovery.", 'error');
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleImport = async (sighting: ScrapedSighting) => {
        try {
            // In a real app, this would open a modal to confirm details
            // For now, we simulate success
            await scraperService.updateStatus(sighting.id, 'imported');
            addSnackbar("Sighting imported to registry.", 'success');
            fetchSightings();
        } catch (e) {
            addSnackbar("Import failed.", 'error');
        }
    };

    const handleIgnore = async (id: string) => {
        try {
            await scraperService.updateStatus(id, 'ignored');
            fetchSightings();
        } catch (e) {}
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Social_Discovery</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Cross-Platform Intelligence Feed</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Social (e.g. 'Lost Husky Brooklyn')"
                        className="flex-grow md:w-80 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-primary/50 outline-none"
                    />
                    <GlassButton 
                        onClick={handleLaunchDiscovery} 
                        variant="primary" 
                        className="!py-2 !px-6 text-[10px]"
                        disabled={isDiscovering}
                    >
                        {isDiscovering ? <LoadingSpinner /> : "Launch Scraper"}
                    </GlassButton>
                </div>
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : sightings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sightings.map(s => (
                        <GlassCard key={s.id} className="overflow-hidden border-white/10 bg-black/40 flex h-48 group">
                            <div className="w-48 h-full relative overflow-hidden shrink-0">
                                {s.imageUrl ? (
                                    <CinematicImage src={s.imageUrl} alt="Scraped" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700 font-black">NO_IMG</div>
                                )}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 text-[8px] font-black uppercase backdrop-blur-md">
                                    {s.source}
                                </div>
                            </div>
                            <div className="p-5 flex flex-col justify-between flex-grow">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] text-slate-500 font-mono">{new Date(s.timestamp).toLocaleDateString()}</p>
                                        <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-black uppercase tracking-widest">View Source ↗</a>
                                    </div>
                                    <p className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">{s.description}</p>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <span className="opacity-50">📍</span> {s.location}
                                    </p>
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-white/5">
                                    <button 
                                        onClick={() => handleImport(s)}
                                        className="flex-grow px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black text-[9px] uppercase tracking-widest border border-emerald-500/20"
                                    >
                                        Import Sighting
                                    </button>
                                    <button 
                                        onClick={() => handleIgnore(s.id)}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[9px] uppercase tracking-widest border border-white/10"
                                    >
                                        Ignore
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-[3rem] bg-black/20">
                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.5em] opacity-50">No unreviewed social signals.</p>
                    <p className="text-[10px] text-slate-700 mt-2 uppercase font-black">Launch a discovery job to scan external networks.</p>
                </div>
            )}
        </div>
    );
};
