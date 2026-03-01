import React, { useState, useEffect, Suspense } from 'react';
import { LogEntry, AdminAuditLog } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { GlassCard, GlassButton } from '../ui';
import { logger } from '../../services/loggerService';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../LoadingSpinner';
import { AdminNotificationSettings } from '../AdminNotificationSettings';
import { TranslationHealthDashboard } from '../TranslationHealthDashboard';
import { SearchOptimizationDashboard } from '../SearchOptimizationDashboard';

const TestSuiteTab = React.lazy(() => import('./TestSuiteTab').then(m => ({ default: m.TestSuiteTab })));

type SettingsSubTab = 'config' | 'audit_logs' | 'notifications' | 'i18n' | 'optimization' | 'testsuite';

interface SettingsTabProps {
  logs: LogEntry[];
  systemConfig: {
    maintenanceMode: boolean;
    primaryAIModel: string;
  };
  onUpdateConfig: (config: any) => void;
}

const AUDIT_ACTION_COLORS: Record<string, string> = {
  SESSION_START: 'bg-blue-500/20 text-blue-400',
  UPDATE_PET: 'bg-primary/20 text-primary',
  DELETE_PET: 'bg-red-500/20 text-red-400',
  DELETE_CLINIC: 'bg-red-500/20 text-red-400',
  VERIFY_USER: 'bg-emerald-500/20 text-emerald-400',
  REJECT_VERIFICATION: 'bg-orange-500/20 text-orange-400',
  UPDATE_ROLE: 'bg-purple-500/20 text-purple-400',
  UPDATE_STATUS: 'bg-yellow-500/20 text-yellow-400',
  DELETE_DONATION: 'bg-red-500/20 text-red-400',
  AWARD_KARMA: 'bg-emerald-500/20 text-emerald-400',
  DEDUCT_KARMA: 'bg-orange-500/20 text-orange-400',
  AWARD_BADGE: 'bg-primary/20 text-primary',
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  logs,
  systemConfig,
  onUpdateConfig
}) => {
  const { t } = useTranslations();
  const [subTab, setSubTab] = useState<SettingsSubTab>('config');
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (subTab === 'audit_logs') {
      setLoadingAudit(true);
      adminService.getAuditLogs(50)
        .then(setAuditLogs)
        .catch(err => console.error('[SettingsTab] audit logs error:', err))
        .finally(() => setLoadingAudit(false));
    }
  }, [subTab]);

  const subTabs: { id: SettingsSubTab; label: string; icon: string }[] = [
    { id: 'config', label: 'Config', icon: '⚙️' },
    { id: 'audit_logs', label: 'Audit Logs', icon: '📟' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'i18n', label: 'i18n', icon: '🌍' },
    { id: 'optimization', label: 'Optimization', icon: '🎯' },
    { id: 'testsuite', label: 'Test Suite', icon: '🛠️' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          {t('dashboard:admin.settings.title')}
        </h2>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-0">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 -mb-px ${
              subTab === tab.id
                ? 'border-primary text-white'
                : 'border-transparent text-slate-500 hover:text-white hover:border-white/20'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Config Sub-tab */}
      {subTab === 'config' && (
        <div className="space-y-6">
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

          <GlassCard className="p-8 border-primary/20 bg-black/40">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              {t('dashboard:admin.settings.features')}
            </h3>
            <div className="space-y-4">
              {[
                { label: 'AI-Powered Matching', desc: 'Enable advanced AI pet matching algorithm.' },
                { label: 'Real-time Notifications', desc: 'Push notifications for sightings and alerts.' },
                { label: 'Gamification System', desc: 'Points and badges for user engagement.' },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="font-bold text-white">{f.label}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                  <input type="checkbox" checked readOnly className="w-6 h-6 accent-primary" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Audit Logs Sub-tab */}
      {subTab === 'audit_logs' && (
        <div className="space-y-6">
          {/* In-memory logger */}
          <GlassCard className="bg-black/60 border-primary/20 shadow-2xl overflow-hidden rounded-[2rem]">
            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="font-mono text-[10px] font-black text-primary uppercase tracking-[0.3em]">Live Session Log</span>
              </div>
              <button onClick={() => logger.clearLogs()} className="text-primary/50 hover:text-primary transition-colors font-mono text-[9px] uppercase tracking-widest">{t('dashboard:admin.flushMemory')}</button>
            </div>
            <div className="p-6 h-48 overflow-y-auto font-mono text-[11px] custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-slate-600 text-center pt-4 uppercase tracking-widest text-xs">{t('dashboard:admin.noPendingSequences')}</p>
              ) : logs.map(log => (
                <div key={log.id} className="mb-2 flex gap-4 opacity-80 hover:opacity-100 transition-opacity border-l-2 border-white/5 pl-4 py-1">
                  <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-black uppercase shrink-0 w-12 ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-primary'}`}>
                    {log.level}:
                  </span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Firestore Audit Logs */}
          <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
            <div className="flex items-center gap-3 p-5 border-b border-white/10 bg-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-mono text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Firestore Audit Trail (Last 50)</span>
            </div>
            {loadingAudit ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                    <tr className="border-b border-white/10">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Admin</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hud-table-row">
                        <td className="p-4 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-300 text-[10px] font-mono truncate max-w-[150px]">{log.adminEmail}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${AUDIT_ACTION_COLORS[log.action] || 'bg-white/10 text-white'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[9px] truncate max-w-[100px]">{log.targetId || '—'}</td>
                        <td className="p-4 text-slate-400 text-[10px] truncate max-w-[200px]">{log.details || '—'}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10">
                          <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">No audit logs found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Notifications Sub-tab */}
      {subTab === 'notifications' && (
        <AdminNotificationSettings />
      )}

      {/* i18n Sub-tab */}
      {subTab === 'i18n' && (
        <TranslationHealthDashboard />
      )}

      {/* Optimization Sub-tab */}
      {subTab === 'optimization' && (
        <SearchOptimizationDashboard />
      )}

      {/* Test Suite Sub-tab */}
      {subTab === 'testsuite' && (
        <Suspense fallback={<div className="flex items-center justify-center py-16"><LoadingSpinner /></div>}>
          <TestSuiteTab />
        </Suspense>
      )}
    </div>
  );
};
