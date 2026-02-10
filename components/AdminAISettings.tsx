import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { openRouterService } from '../services/openRouterService';
import { AISettings, AIProvider, AIModelTask } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard, GlassButton } from './ui';
import { LoadingSpinner } from './LoadingSpinner';

export const AdminAISettings: React.FC = () => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminService.getAISettings();
                setSettings(data);
            } catch (e: any) {
                addSnackbar('Failed to fetch AI settings: ' + e.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [addSnackbar]);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await adminService.saveAISettings(settings);
            addSnackbar('AI Settings updated successfully', 'success');
        } catch (e: any) {
            addSnackbar('Failed to save settings: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRefreshModels = async () => {
        setFetchingModels(true);
        try {
            const models = await openRouterService.fetchAvailableModels();
            setAvailableModels(models);
            addSnackbar(`Fetched ${models.length} models from OpenRouter`, 'info');
        } catch (e: any) {
            addSnackbar('Failed to fetch models: ' + e.message, 'error');
        } finally {
            setFetchingModels(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
    if (!settings) return <div className="text-center p-12 text-red-500 font-mono uppercase">Critical: System Configuration Data Corrupted</div>;

    const tasks: { id: AIModelTask, label: string }[] = [
        { id: 'vision', label: 'Vision Protocol' },
        { id: 'triage', label: 'Triage Protocol' },
        { id: 'chat', label: 'Neural Chat' },
        { id: 'matching', label: 'Matching Protocol' },
    ];

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <span className="text-primary">🧠</span> AI Control Center
                </h2>
                <GlassButton 
                    onClick={handleSave} 
                    isLoading={saving}
                    variant="primary"
                    className="!px-8 shadow-primary/20"
                >
                    Save configuration
                </GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Provider Selection */}
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6">Active Provider</h3>
                    <div className="flex gap-4">
                        {(['google', 'openrouter'] as AIProvider[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setSettings({ ...settings, provider: p })}
                                className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                                    settings.provider === p 
                                    ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(20,184,166,0.2)]' 
                                    : 'bg-white/5 border-white/5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                                }`}
                            >
                                <span className="text-2xl">{p === 'google' ? '💎' : '🚀'}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">{p}</span>
                            </button>
                        ))}
                    </div>
                </GlassCard>

                {/* API Credentials */}
                <GlassCard className="p-6 border-white/10 bg-black/40">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6">API Credentials</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Google Gemini Key</label>
                            <input
                                type="password"
                                value={settings.apiKeys.google || ''}
                                onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, google: e.target.value } })}
                                placeholder="sk-..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-primary outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">OpenRouter Key</label>
                            <input
                                type="password"
                                value={settings.apiKeys.openrouter || ''}
                                onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, openrouter: e.target.value } })}
                                placeholder="sk-or-v1-..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Model Mapping */}
            <GlassCard className="p-8 border-white/10 bg-black/40">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest">Protocol Model Mapping</h3>
                        <p className="text-[10px] text-slate-500 mt-1">Define specific models for each system capability.</p>
                    </div>
                    {settings.provider === 'openrouter' && (
                        <GlassButton 
                            onClick={handleRefreshModels} 
                            isLoading={fetchingModels}
                            variant="secondary" 
                            className="!py-1.5 !px-4 !text-[9px]"
                        >
                            Refresh models
                        </GlassButton>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tasks.map(task => (
                        <div key={task.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-white uppercase tracking-wider">{task.label}</label>
                                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">Task ID: {task.id}</span>
                            </div>
                            <div className="relative group">
                                <input
                                    list={`models-${task.id}`}
                                    value={settings.modelMapping[task.id] || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        modelMapping: { ...settings.modelMapping, [task.id]: e.target.value }
                                    })}
                                    placeholder={settings.provider === 'google' ? 'gemini-2.0-flash' : 'openai/gpt-4o'}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-primary font-mono focus:border-primary outline-none group-hover:border-white/20 transition-all"
                                />
                                <datalist id={`models-${task.id}`}>
                                    {settings.provider === 'google' ? (
                                        <>
                                            <option value="gemini-2.0-flash" />
                                            <option value="gemini-2.0-pro" />
                                            <option value="gemini-1.5-flash" />
                                            <option value="gemini-1.5-pro" />
                                        </>
                                    ) : (
                                        availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                                    )}
                                </datalist>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Audit Info */}
            <div className="flex justify-between items-center px-4 text-[9px] font-mono text-slate-600">
                <span className="uppercase">Last Protocol Update: {new Date(settings.lastUpdated).toLocaleString()}</span>
                <span className="uppercase">Authored By: {settings.updatedBy}</span>
            </div>
        </div>
    );
};
