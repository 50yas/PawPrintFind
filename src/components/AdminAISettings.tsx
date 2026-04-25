import React, { useState, useEffect, useRef, useMemo } from 'react';
import { adminService } from '../services/adminService';
import { aiBridgeService } from '../services/aiBridgeService';
import { openRouterService } from '../services/openRouterService';
import { AISettings, AIProvider, AIModelTask } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard, GlassButton } from './ui';
import { LoadingSpinner } from './LoadingSpinner';

const TASK_META: Record<AIModelTask, { icon: string; color: string; borderColor: string }> = {
    vision: { icon: '👁', color: 'text-cyan-400', borderColor: 'border-l-cyan-500' },
    triage: { icon: '💓', color: 'text-rose-400', borderColor: 'border-l-rose-500' },
    chat: { icon: '💬', color: 'text-violet-400', borderColor: 'border-l-violet-500' },
    matching: { icon: '🔗', color: 'text-amber-400', borderColor: 'border-l-amber-500' },
};

const maskKey = (key: string | undefined): string => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
};

const timeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export const AdminAISettings: React.FC = () => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [secrets, setSecrets] = useState<Record<string, string>>({}); // Local state for secrets
    const [originalSettings, setOriginalSettings] = useState<AISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({ google: false, openrouter: false });
    const [testingConnection, setTestingConnection] = useState<AIProvider | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<Record<string, { success: boolean; message: string } | null>>({});
    const [isSystemInit, setIsSystemInit] = useState<boolean>(true);

    const hasUnsavedChanges = useMemo(() => {
        if (!settings || !originalSettings) return false;
        return JSON.stringify(settings) !== JSON.stringify(originalSettings);
    }, [settings, originalSettings]);

    const handleInitializeSystem = async () => {
        setSaving(true);
        try {
            await adminService.initializeSystem();
            setIsSystemInit(true);
            addSnackbar('System Initialized', 'success');
        } catch (e: any) {
            addSnackbar('Failed to init: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [publicData, secretData, initStatus] = await Promise.all([
                    adminService.getAISettings(),
                    adminService.getAISecrets(),
                    adminService.isSystemInitialized()
                ]);
                setSettings(publicData);
                setSecrets(secretData as Record<string, string>);
                setIsSystemInit(initStatus);
                setOriginalSettings(JSON.parse(JSON.stringify(publicData)));
            } catch (e: any) {
                addSnackbar(t('dashboard:admin.connectionFailed') + ': ' + e.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setSaveSuccess(false);
        try {
            await adminService.saveAISettings(settings, secrets);
            // Clear cache in bridge to ensure new settings are used immediately
            await aiBridgeService.getSettings(true);
            setOriginalSettings(JSON.parse(JSON.stringify(settings)));
            setSaveSuccess(true);
            addSnackbar(t('dashboard:admin.configSaved'), 'success');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e: any) {
            addSnackbar(t('dashboard:admin.connectionFailed') + ': ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async (provider: AIProvider) => {
        const apiKey = secrets[provider];
        if (!apiKey) {
            addSnackbar(t('dashboard:admin.keyMissing'), 'error');
            return;
        }
        setTestingConnection(provider);
        setConnectionStatus(prev => ({ ...prev, [provider]: null }));
        try {
            const result = await aiBridgeService.testConnection(provider, apiKey);
            setConnectionStatus(prev => ({ ...prev, [provider]: result }));
            addSnackbar(result.success ? t('dashboard:admin.connectionSuccess') : t('dashboard:admin.connectionFailed'), result.success ? 'success' : 'error');
        } catch (e: any) {
            setConnectionStatus(prev => ({ ...prev, [provider]: { success: false, message: e.message } }));
            addSnackbar(t('dashboard:admin.connectionFailed'), 'error');
        } finally {
            setTestingConnection(null);
        }
    };

    const handleRefreshModels = async () => {
        setFetchingModels(true);
        try {
            const models = await openRouterService.fetchAvailableModels();
            setAvailableModels(models);
            addSnackbar(`Fetched ${models.length} models`, 'info');
        } catch (e: any) {
            addSnackbar(t('dashboard:admin.connectionFailed') + ': ' + e.message, 'error');
        } finally {
            setFetchingModels(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center p-20"><LoadingSpinner /></div>;
    if (!settings) return <div className="text-center p-12 text-red-500 font-mono uppercase text-sm">Critical: System Configuration Data Corrupted</div>;

    const tasks: { id: AIModelTask; label: string }[] = [
        { id: 'vision', label: t('dashboard:admin.visionProtocol') },
        { id: 'triage', label: t('dashboard:admin.triageProtocol') },
        { id: 'chat', label: t('dashboard:admin.neuralChat') },
        { id: 'matching', label: t('dashboard:admin.matchingProtocol') },
    ];

    const activeKey = secrets[settings.provider];
    const modelCount = Object.values(settings.modelMapping).filter(Boolean).length;

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-28">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="text-3xl">🧠</span>
                        <span>{t('dashboard:admin.aiControlCenter')}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                        {t('dashboard:admin.providerStatus')}: <span className={activeKey ? 'text-green-400' : 'text-red-400'}>{activeKey ? t('dashboard:admin.connectionActive') : t('dashboard:admin.connectionInactive')}</span>
                    </p>
                </div>
                {!isSystemInit && (
                    <button
                        onClick={handleInitializeSystem}
                        className="bg-amber-500 text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all"
                    >
                        Initialize System Core
                    </button>
                )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: t('dashboard:admin.activeProvider'), value: settings.provider === 'google' ? 'Gemini' : 'OpenRouter', icon: settings.provider === 'google' ? '💎' : '🚀', glow: 'neon-glow-teal' },
                    { label: t('dashboard:admin.totalModels'), value: `${modelCount}/4`, icon: '🔧', glow: '' },
                    { label: t('dashboard:admin.lastKeyRotation'), value: timeAgo(settings.lastUpdated), icon: '🔑', glow: '' },
                    { label: t('dashboard:admin.providerStatus'), value: activeKey ? t('dashboard:admin.connectionActive') : t('dashboard:admin.keyMissing'), icon: activeKey ? '✅' : '⚠️', glow: activeKey ? 'neon-glow-green' : 'neon-glow-red' },
                ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-2xl bg-white/5 border border-white/10 text-center transition-all duration-300 hover:bg-white/10 ${stat.glow}`}>
                        <span className="text-xl">{stat.icon}</span>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mt-2">{stat.label}</p>
                        <p className="text-sm font-bold text-white mt-1 font-mono">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Provider Selection */}
            <GlassCard className="p-6 md:p-8 border-white/10 bg-black/40 scan-hover">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="status-pulse-green"></span>
                    {t('dashboard:admin.activeProvider')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                        { id: 'google' as AIProvider, name: t('dashboard:admin.providerGoogle'), desc: t('dashboard:admin.providerGoogleDesc'), icon: '💎' },
                        { id: 'openrouter' as AIProvider, name: t('dashboard:admin.providerOpenRouter'), desc: t('dashboard:admin.providerOpenRouterDesc'), icon: '🚀' },
                    ]).map(p => {
                        const isActive = settings.provider === p.id;
                        const hasKey = !!secrets[p.id];
                        const connStatus = connectionStatus[p.id];
                        return (
                            <button
                                key={p.id}
                                onClick={() => setSettings({ ...settings, provider: p.id })}
                                className={`provider-card text-left ${isActive ? 'provider-card-active' : 'provider-card-inactive'}`}
                            >
                                {isActive && <div className="absolute inset-0 neon-border rounded-2xl"></div>}
                                <div className="flex items-start gap-4 relative z-10">
                                    <span className="text-3xl md:text-4xl">{p.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-white uppercase tracking-wider">{p.name}</span>
                                            {isActive && <span className="text-[8px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30 uppercase">Active</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">{p.desc}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`}></span>
                                            <span className="text-[9px] font-mono text-slate-500">{hasKey ? t('dashboard:admin.keyPresent') : t('dashboard:admin.keyMissing')}</span>
                                            {connStatus && (
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${connStatus.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {connStatus.success ? '✓ OK' : '✗ FAIL'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </GlassCard>

            {/* API Credentials */}
            <GlassCard className="p-6 md:p-8 border-white/10 bg-black/40 scan-hover">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        {t('dashboard:admin.apiCredentials')}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[8px] text-amber-400 font-black uppercase bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        MANAGED VIA SECRET MANAGER
                    </div>
                </div>

                <p className="text-[10px] text-slate-500 mb-6 font-mono uppercase tracking-tight leading-relaxed max-w-2xl">
                    For enterprise security, API keys are now stored in <span className="text-white">Google Cloud Secret Manager</span>.
                    The fields below are for <span className="text-primary italic">local identification</span> only.
                    To update actual keys, use: <code className="bg-white/5 px-1 py-0.5 rounded text-cyan-400">firebase functions:secrets:set GEMINI_API_KEY</code>
                </p>

                <div className="space-y-6">
                    {/* Live Assistant Public Key (Required for Browser Realtime API) */}
                    <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-2">
                                <span>🎤</span>
                                LIVE ASSISTANT PUBLIC KEY (CLIENT-SIDE)
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="password"
                                value={settings.publicLiveAssistantKey || ''}
                                onChange={(e) => setSettings({ ...settings, publicLiveAssistantKey: e.target.value })}
                                placeholder="Paste Public Gemini Key for Live Voice/Video..."
                                className="cyber-input"
                            />
                        </div>
                        <p className="text-[8px] text-slate-500 mt-2 font-mono uppercase italic">
                            * This key is exposed to the browser for the Realtime Multimodal API. Use a restricted key.
                        </p>
                    </div>

                    {([
                        { provider: 'google' as AIProvider, label: 'GEMINI_API_KEY', placeholder: 'Enter Gemini API Key...' },
                        { provider: 'openrouter' as AIProvider, label: 'OPENROUTER_API_KEY', placeholder: 'Enter OpenRouter API Key...' },
                    ]).map(field => {
                        const isActiveProvider = settings.provider === field.provider;
                        return (
                            <div key={field.provider} className={`p-4 rounded-xl border transition-all duration-300 ${isActiveProvider ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <span>{field.provider === 'google' ? '💎' : '🚀'}</span>
                                        {field.label}
                                        {isActiveProvider && <span className="text-primary text-[8px]">(Active)</span>}
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="password"
                                            value={secrets[field.provider] || ''}
                                            onChange={(e) => setSecrets(prev => ({ ...prev, [field.provider]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            className="cyber-input"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleTestConnection(field.provider)}
                                        disabled={testingConnection === field.provider}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 border whitespace-nowrap ${testingConnection === field.provider ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse' :
                                                connectionStatus[field.provider]?.success ? 'border-green-500/30 bg-green-500/10 text-green-400 neon-glow-green' :
                                                    'border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-black'
                                            }`}
                                    >
                                        {testingConnection === field.provider ? t('dashboard:admin.testing') :
                                            connectionStatus[field.provider]?.success ? '✓ ALIVE' :
                                                'TEST CONNECTION'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Model Mapping */}
            <GlassCard className="p-6 md:p-8 border-white/10 bg-black/40 scan-hover">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest">{t('dashboard:admin.protocolModelMapping')}</h3>
                        <p className="text-[10px] text-slate-500 mt-1">{t('dashboard:admin.modelAssignment')}</p>
                    </div>
                    {settings.provider === 'openrouter' && (
                        <GlassButton
                            onClick={handleRefreshModels}
                            isLoading={fetchingModels}
                            variant="secondary"
                            className="!py-2 !px-5 !text-[9px]"
                        >
                            {t('dashboard:admin.refreshModels')}
                        </GlassButton>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tasks.map(task => {
                        const meta = TASK_META[task.id];
                        return (
                            <div key={task.id} className={`p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-300 border-l-4 ${meta.borderColor} group`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xl ${meta.color}`}>{meta.icon}</span>
                                        <div>
                                            <label className="text-[11px] font-black text-white uppercase tracking-wider">{task.label}</label>
                                            <p className="text-[8px] font-mono text-slate-600 uppercase">ID: {task.id}</p>
                                        </div>
                                    </div>
                                    {settings.modelMapping[task.id] && (
                                        <span className="text-[8px] font-mono bg-white/5 text-slate-400 px-2 py-1 rounded-lg border border-white/5 max-w-[120px] truncate hidden sm:block">
                                            {settings.modelMapping[task.id]}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        list={`models-${task.id}`}
                                        value={settings.modelMapping[task.id] || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            modelMapping: { ...settings.modelMapping, [task.id]: e.target.value }
                                        })}
                                        placeholder={settings.provider === 'google' ? 'gemini-2.0-flash' : 'openai/gpt-4o'}
                                        className="cyber-input !py-2.5 !text-xs group-hover:border-white/20"
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
                                            <>
                                                {/* Recommended free models */}
                                                <option value="qwen/qwen-2.5-72b-instruct:free">⭐ Qwen 2.5 72B (Free)</option>
                                                <option value="nvidia/nemotron-nano-12b-v2-vl:free">⭐ Nemotron Nano 12B VL (Free - Vision)</option>
                                                <option value="google/gemini-2.0-flash-lite-preview-02-05:free">⭐ Gemini 2.0 Flash Lite (Free)</option>
                                                <option value="deepseek/deepseek-r1:free">⭐ DeepSeek R1 (Free)</option>
                                                <option value="meta-llama/llama-3.3-70b-instruct:free">llama-3.3-70b-instruct</option>
                                                <option value="mistralai/mistral-7b-instruct:free">mistral-7b-instruct</option>
                                                {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </>
                                        )}
                                    </datalist>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Audit Info */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 gap-2 text-[9px] font-mono text-slate-600">
                <span className="uppercase flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t('dashboard:admin.lastSaved')}: {timeAgo(settings.lastUpdated)}
                </span>
                <span className="uppercase">By: {settings.updatedBy}</span>
            </div>

            {/* Floating Save Bar */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-[200] md:left-64 animate-slide-up">
                    <div className="mx-4 mb-4 md:mx-8 md:mb-6 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-primary/30 neon-glow-teal flex items-center justify-between gap-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <span className="status-pulse-amber"></span>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">{t('dashboard:admin.unsavedChanges')}</span>
                        </div>
                        <GlassButton
                            onClick={handleSave}
                            isLoading={saving}
                            variant="primary"
                            className="!px-8 !py-2.5 !text-[10px] !font-black shadow-primary/30"
                        >
                            {saveSuccess ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    Saved
                                </span>
                            ) : (
                                t('dashboard:admin.saveConfiguration')
                            )}
                        </GlassButton>
                    </div>
                </div>
            )}
        </div>
    );
};
