
import React, { useState, useEffect } from 'react';
import { scraperService, ScrapedSighting, ScraperJob } from '../services/scraperService';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard, GlassButton, CinematicImage } from './ui';
import { LoadingSpinner } from './LoadingSpinner';

export const SocialDiscoveryDashboard: React.FC = () => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [sightings, setSightings] = useState<ScrapedSighting[]>([]);
    const [jobs, setJobs] = useState<ScraperJob[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sightingData, jobData] = await Promise.all([
                scraperService.getScrapedSightings(),
                scraperService.getJobs()
            ]);
            setSightings(sightingData);
            setJobs(jobData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll for job updates if there are pending jobs
        const interval = setInterval(() => {
            if (jobs.some(j => j.status === 'queued' || j.status === 'running')) {
                fetchData();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [jobs.length]);

    const handleLaunchDiscovery = async () => {
        if (!searchQuery) return;
        setIsDiscovering(true);
        try {
            await scraperService.launchDiscovery(searchQuery);
            addSnackbar(t('dashboard:admin.agentDiscoveryLaunched'), 'success');
            setSearchQuery('');
            fetchData();
        } catch (e) {
            addSnackbar("Failed to launch discovery", 'error');
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleImport = async (sighting: ScrapedSighting) => {
        try {
            await scraperService.updateStatus(sighting.id, 'imported');
            addSnackbar(t('dashboard:admin.importSighting'), 'success');
            fetchData();
        } catch (e) {
            addSnackbar("Import failed", 'error');
        }
    };

    const handleIgnore = async (id: string) => {
        try {
            await scraperService.updateStatus(id, 'ignored');
            fetchData();
        } catch (e) {}
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.socialDiscoveryTitle')}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{t('dashboard:admin.socialDiscoveryDesc')}</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t('dashboard:admin.searchSocialPlaceholder')}
                        className="flex-grow md:w-80 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-primary/50 outline-none"
                    />
                    <GlassButton 
                        onClick={handleLaunchDiscovery} 
                        variant="primary" 
                        className="!py-2 !px-6 text-[10px]"
                        disabled={isDiscovering}
                    >
                        {isDiscovering ? <LoadingSpinner /> : t('dashboard:admin.launchAgentButton')}
                    </GlassButton>
                </div>
            </div>

            {/* Active Jobs Monitor */}
            {jobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {jobs.map(job => (
                        <div key={job.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-white truncate uppercase tracking-tight">{job.query}</p>
                                <p className="text-[8px] text-slate-500 font-mono uppercase">{new Date(job.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                job.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                'bg-primary/20 text-primary animate-pulse'
                            }`}>
                                {job.status === 'completed' ? `${t('dashboard:admin.jobStatusDone')} (${job.resultsCount})` : t(`dashboard:admin.jobStatus${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                                        {t('dashboard:admin.importSighting')}
                                    </button>
                                    <button 
                                        onClick={() => handleIgnore(s.id)}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[9px] uppercase tracking-widest border border-white/10"
                                    >
                                        {t('dashboard:admin.ignoreSighting')}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-[3rem] bg-black/20">
                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.5em] opacity-50">{t('dashboard:admin.noSocialSignals')}</p>
                </div>
            )}
        </div>
    );
};
