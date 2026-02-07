
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationConfig } from '../types';
import { GlassButton } from './ui/GlassButton';
import { useSnackbar } from '../contexts/SnackbarContext';

export const AdminNotificationSettings: React.FC = () => {
    const [config, setConfig] = useState<NotificationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addSnackbar } = useSnackbar();

    useEffect(() => {
        const load = async () => {
            const settings = await notificationService.getSettings();
            setConfig(settings);
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await notificationService.saveSettings(config);
            addSnackbar('Notification settings saved', 'success');
        } catch (error) {
            addSnackbar('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !config) return <div className="text-primary animate-pulse p-8">Loading settings...</div>;

    const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-white text-sm">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
    );

    const Input = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-primary tracking-widest">{label}</label>
            <input 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <span className="text-primary">🔔</span>
                    Notification Center
                </h2>
                <GlassButton onClick={handleSave} loading={saving} className="px-8">
                    Save Configuration 💾
                </GlassButton>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Channels */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">📡 Channels</h3>
                    
                    {/* Email */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <Toggle 
                            label="Email Notifications" 
                            checked={config.email.enabled} 
                            onChange={(v) => setConfig({ ...config, email: { ...config.email, enabled: v } })} 
                        />
                        {config.email.enabled && (
                            <Input 
                                label="Recipient Email" 
                                value={config.email.target || ''} 
                                onChange={(v) => setConfig({ ...config, email: { ...config.email, target: v } })} 
                                placeholder="admin@example.com"
                            />
                        )}
                    </div>

                    {/* WhatsApp */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <Toggle 
                            label="WhatsApp Alerts" 
                            checked={config.whatsapp.enabled} 
                            onChange={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, enabled: v } })} 
                        />
                        {config.whatsapp.enabled && (
                            <>
                                <Input 
                                    label="Target Phone Number" 
                                    value={config.whatsapp.target || ''} 
                                    onChange={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, target: v } })} 
                                    placeholder="+1234567890"
                                />
                                <Input 
                                    label="API Key (Stub)" 
                                    value={config.whatsapp.apiKey || ''} 
                                    onChange={(v) => setConfig({ ...config, whatsapp: { ...config.whatsapp, apiKey: v } })} 
                                    placeholder="Enter API Key"
                                />
                            </>
                        )}
                    </div>

                    {/* Telegram */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <Toggle 
                            label="Telegram Bot" 
                            checked={config.telegram.enabled} 
                            onChange={(v) => setConfig({ ...config, telegram: { ...config.telegram, enabled: v } })} 
                        />
                        {config.telegram.enabled && (
                            <>
                                <Input 
                                    label="Bot Token" 
                                    value={config.telegram.apiKey || ''} 
                                    onChange={(v) => setConfig({ ...config, telegram: { ...config.telegram, apiKey: v } })} 
                                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                />
                                <Input 
                                    label="Chat ID" 
                                    value={config.telegram.chatId || ''} 
                                    onChange={(v) => setConfig({ ...config, telegram: { ...config.telegram, chatId: v } })} 
                                    placeholder="-100123456789"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Events */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">⚡ Event Triggers</h3>
                    
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <p className="text-xs text-slate-400 mb-4">Select which system events should trigger a notification to the enabled channels above.</p>
                        
                        <Toggle 
                            label="New User Registration" 
                            checked={config.events.newUser} 
                            onChange={(v) => setConfig({ ...config, events: { ...config.events, newUser: v } })} 
                        />
                        
                        <Toggle 
                            label="Vet Verification Request" 
                            checked={config.events.vetVerification} 
                            onChange={(v) => setConfig({ ...config, events: { ...config.events, vetVerification: v } })} 
                        />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-2xl">
                        <h4 className="font-bold text-blue-400 mb-2">ℹ️ System Note</h4>
                        <p className="text-xs text-blue-200">
                            Currently, notifications are logged to the <strong>System Console</strong> and <strong>Admin Logs</strong> for security. 
                            <br/><br/>
                            To enable real-world delivery (Email/SMS), the <strong>Secure Backend Proxy</strong> (Cloud Functions) module must be reactivated and configured with provider secrets (SendGrid, Twilio, etc.).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
