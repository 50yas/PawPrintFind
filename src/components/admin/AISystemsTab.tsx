import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { AdminAISettings } from '../AdminAISettings';
import { AIUsageTable } from '../AIUsageTable';
import { GlassCard } from '../ui';

export const AISystemsTab: React.FC = () => {
  const { t } = useTranslations();

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          {t('dashboard:admin.ai.title')}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{t('dashboard:admin.aiControlCenter')}</p>
      </div>

      {/* AI Configuration */}
      <GlassCard className="p-6 border-primary/20 bg-black/40">
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {t('dashboard:admin.ai.modelConfig')}
        </h3>
        <AdminAISettings />
      </GlassCard>

      {/* AI Usage & Telemetry */}
      <GlassCard className="p-6 border-primary/20 bg-black/40">
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {t('dashboard:admin.ai.telemetry')}
        </h3>
        <AIUsageTable />
      </GlassCard>
    </div>
  );
};
