import React, { useState } from 'react';
import { SocialPlatform } from '../../types';
import { User } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { socialPostService } from '../../services/socialPostService';
import { GlassCard, GlassButton } from '../ui';

const PLATFORMS: { id: SocialPlatform; label: string; icon: string; maxChars?: number }[] = [
    { id: 'twitter', label: 'Twitter/X', icon: '𝕏', maxChars: 280 },
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'instagram', label: 'Instagram', icon: '📷' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
];

interface SchedulePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUser: User;
}

export const SchedulePostModal: React.FC<SchedulePostModalProps> = ({ isOpen, onClose, onSuccess, currentUser }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();

    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['twitter']);
    const [captions, setCaptions] = useState<Partial<Record<SocialPlatform, string>>>({});
    const [activeCaptionPlatform, setActiveCaptionPlatform] = useState<SocialPlatform>('twitter');
    const [scheduledAt, setScheduledAt] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const togglePlatform = (platform: SocialPlatform) => {
        setSelectedPlatforms(prev => {
            if (prev.includes(platform)) {
                const next = prev.filter(p => p !== platform);
                if (activeCaptionPlatform === platform && next.length > 0) {
                    setActiveCaptionPlatform(next[0]);
                }
                return next;
            }
            if (activeCaptionPlatform === null || !prev.includes(activeCaptionPlatform)) {
                setActiveCaptionPlatform(platform);
            }
            return [...prev, platform];
        });
    };

    const handleSave = async () => {
        if (selectedPlatforms.length === 0) {
            addSnackbar('Select at least one platform', 'error');
            return;
        }
        if (!scheduledAt) {
            addSnackbar('Please set a scheduled date/time', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await socialPostService.createScheduledPost({
                blogPostId: '',
                platforms: selectedPlatforms,
                scheduledTime: new Date(scheduledAt),
                status: 'draft',
                captions,
                images: {},
                createdBy: currentUser.uid,
                createdAt: new Date(),
            });
            addSnackbar(t('dashboard:admin.social.postScheduled') || 'Post scheduled successfully', 'success');
            onSuccess();
            onClose();
        } catch (e: any) {
            addSnackbar(e.message || 'Failed to schedule post', 'error');
        }
        setIsSaving(false);
    };

    const currentCaption = captions[activeCaptionPlatform] || '';
    const activePlatformMeta = PLATFORMS.find(p => p.id === activeCaptionPlatform);
    const isOverLimit = activePlatformMeta?.maxChars ? currentCaption.length > activePlatformMeta.maxChars : false;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-2xl border-primary/30 bg-slate-950 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <span>📅</span> {t('dashboard:admin.social.createPost')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Platform Selection */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Platforms</label>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                        selectedPlatforms.includes(platform.id)
                                            ? 'bg-primary/20 text-primary border-primary/40'
                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <span>{platform.icon}</span>
                                    <span>{platform.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Per-platform Captions */}
                    {selectedPlatforms.length > 0 && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Caption</label>

                            {/* Platform tabs for caption */}
                            {selectedPlatforms.length > 1 && (
                                <div className="flex gap-1 mb-2 border-b border-white/10 pb-0">
                                    {selectedPlatforms.map(platform => {
                                        const meta = PLATFORMS.find(p => p.id === platform)!;
                                        return (
                                            <button
                                                key={platform}
                                                onClick={() => setActiveCaptionPlatform(platform)}
                                                className={`px-4 py-2 text-[10px] font-black uppercase border-b-2 -mb-px transition-all ${
                                                    activeCaptionPlatform === platform
                                                        ? 'border-primary text-white'
                                                        : 'border-transparent text-slate-500 hover:text-white'
                                                }`}
                                            >
                                                {meta.icon} {meta.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="relative">
                                <textarea
                                    value={currentCaption}
                                    onChange={e => setCaptions(prev => ({ ...prev, [activeCaptionPlatform]: e.target.value }))}
                                    placeholder={`Write your ${activePlatformMeta?.label || 'post'} caption here...`}
                                    rows={5}
                                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors resize-none ${
                                        isOverLimit ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-primary'
                                    }`}
                                />
                                <div className={`absolute bottom-3 right-3 text-[9px] font-mono ${isOverLimit ? 'text-red-500 font-black' : 'text-slate-600'}`}>
                                    {currentCaption.length}{activePlatformMeta?.maxChars ? `/${activePlatformMeta.maxChars}` : ''}
                                </div>
                            </div>
                            {isOverLimit && (
                                <p className="text-[10px] text-red-500 font-black mt-1">
                                    ⚠️ Exceeds {activePlatformMeta?.maxChars} character limit for {activePlatformMeta?.label}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Scheduled Time */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Scheduled Date & Time</label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={e => setScheduledAt(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-white/10">
                    <GlassButton onClick={onClose} variant="secondary" className="flex-1">
                        {t('dashboard:admin.social.close')}
                    </GlassButton>
                    <GlassButton
                        onClick={handleSave}
                        variant="primary"
                        className="flex-1"
                        disabled={isSaving || selectedPlatforms.length === 0 || isOverLimit}
                    >
                        {isSaving ? 'Saving…' : '📅 Save as Draft'}
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};
