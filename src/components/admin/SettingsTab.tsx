import React from 'react';
import { LogEntry } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { GlassCard } from '../ui';
import { logger } from '../../services/loggerService';

interface SettingsTabProps {
  logs: LogEntry[];
  systemConfig: {
    maintenanceMode: boolean;
    primaryAIModel: string;
  };
  onUpdateConfig: (config: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  logs,
  systemConfig,
  onUpdateConfig
}) => {
  const { t } = useTranslations();

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          {t('dashboard:admin.settings.title')}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{t('dashboard:admin.adminTabConfig')}</p>
      </div>

      {/* App Settings */}
      <GlassCard className="p-8 border-primary/20 bg-black/40">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {t('dashboard:admin.settings.app')}
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-bold text-white">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Lock the platform for updates.</p>
            </div>
            <input
              type="checkbox"
              checked={systemConfig.maintenanceMode}
              onChange={(e) => onUpdateConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
              className="w-6 h-6 accent-primary"
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Primary AI Model</p>
            <select
              value={systemConfig.primaryAIModel}
              onChange={(e) => onUpdateConfig({ ...systemConfig, primaryAIModel: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary"
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
              <option value="gemini-2.0-pro">Gemini 2.0 Pro (Intelligent)</option>
              <option value="gemini-exp-1206">Gemini Experimental</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Feature Flags */}
      <GlassCard className="p-8 border-primary/20 bg-black/40">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {t('dashboard:admin.settings.features')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-bold text-white">AI-Powered Matching</p>
              <p className="text-xs text-slate-500">Enable advanced AI pet matching algorithm.</p>
            </div>
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="w-6 h-6 accent-primary"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-bold text-white">Real-time Notifications</p>
              <p className="text-xs text-slate-500">Push notifications for sightings and alerts.</p>
            </div>
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="w-6 h-6 accent-primary"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-bold text-white">Gamification System</p>
              <p className="text-xs text-slate-500">Points and badges for user engagement.</p>
            </div>
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="w-6 h-6 accent-primary"
            />
          </div>
        </div>
      </GlassCard>

      {/* Audit Logs */}
      <GlassCard className="bg-black/60 border-primary/20 shadow-2xl overflow-hidden rounded-[2rem]">
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span className="font-mono text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('dashboard:admin.settings.audit')}</span>
          </div>
          <button onClick={() => logger.clearLogs()} className="text-primary/50 hover:text-primary transition-colors font-mono text-[9px] uppercase tracking-widest">{t('dashboard:admin.flushMemory')}</button>
        </div>
        <div className="p-6 h-[600px] overflow-y-auto font-mono text-[11px] custom-scrollbar">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-16 h-16 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.2em]">{t('dashboard:admin.noPendingSequences')}</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-2 flex gap-4 opacity-80 hover:opacity-100 transition-opacity border-l-2 border-white/5 pl-4 py-1">
                <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`font-black uppercase shrink-0 w-12 ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-primary'
                  }`}>
                  {log.level}:
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};
