
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { parseSearchQuery } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface SmartSearchBarProps {
  onSearch: (filters: any) => void;
  className?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ onSearch, className }) => {
  const { t } = useTranslations();
  const [query, setQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsParsing(true);
    try {
      const filters = await parseSearchQuery(query);
      onSearch(filters);
    } catch (error) {
      console.error("Smart search failed:", error);
      // Fallback: just search by keyword if AI fails
      onSearch({ keyword: query });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className || ''}`}>
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('smartSearchPlaceholder') || "Try 'friendly small dog'..."}
          className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 pr-16 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl group-hover:bg-white/15"
          disabled={isParsing}
        />
        <button
          type="submit"
          disabled={isParsing || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg"
          aria-label="Search with AI"
        >
          {isParsing ? (
            <div className="w-5 h-5">
                <LoadingSpinner />
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </form>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-black px-4">
        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {t('poweredByGemini') || "Powered by Gemini AI"}
      </div>
    </div>
  );
};
