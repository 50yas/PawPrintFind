import React, { useState, useEffect } from 'react';
import { searchService } from '../services/searchService';
import { SavedSearch } from '../types';
import { GlassCard, GlassButton } from './ui';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedSearchesListProps {
    userEmail: string;
    onApply: (filters: any) => void;
}

export const SavedSearchesList: React.FC<SavedSearchesListProps> = ({ userEmail, onApply }) => {
    const [searches, setSearches] = useState<SavedSearch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const fetchSearches = async () => {
        setIsLoading(true);
        try {
            const data = await searchService.getSavedSearches(userEmail);
            setSearches(data);
        } catch (error) {
            console.error("Failed to fetch saved searches:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSearches();
    }, [userEmail]);

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;
        await searchService.deleteSavedSearch(confirmDeleteId);
        setConfirmDeleteId(null);
        fetchSearches();
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]"></span>
                Saved Search Identikits
            </h2>

            {isLoading ? (
                <div className="flex gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="w-48 h-24 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : searches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {searches.map(search => (
                            <motion.div 
                                key={search.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <GlassCard variant="interactive" className="p-4 border-white/10 bg-white/5 group relative overflow-hidden h-full flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(search.id); }}
                                            className="text-red-400 hover:text-red-500 p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    
                                    <div onClick={() => onApply(search.filters)} className="cursor-pointer space-y-2">
                                        <p className="font-black text-white text-sm uppercase tracking-tighter group-hover:text-primary transition-colors">{search.name}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {search.filters.species && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">{search.filters.species}</span>}
                                            {search.filters.breed && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">{search.filters.breed}</span>}
                                            {search.filters.age && <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold">{search.filters.age}</span>}
                                        </div>
                                        <p className="text-[8px] text-slate-500 font-mono">SAVED: {new Date(search.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <p className="text-slate-500 italic text-sm py-4">No saved searches yet. Try saving one from the Adoption Center.</p>
            )}

            {/* Inline delete confirmation — replaces native window.confirm() */}
            <AnimatePresence>
                {confirmDeleteId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setConfirmDeleteId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-white font-bold text-center mb-4">Delete this saved search?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-bold transition-colors text-sm">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
