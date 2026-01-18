
import React, { useMemo } from 'react';
import { PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { AIInsightCard } from './AIInsightCard';

interface AIAnalyticsViewProps {
    patients: PetProfile[];
    onClose: () => void;
}

export const AIAnalyticsView: React.FC<AIAnalyticsViewProps> = ({ patients, onClose }) => {
    const { t } = useTranslations();

    const stats = useMemo(() => {
        if (!patients.length) return null;

        const patientsWithRecords = patients.filter(p => p.medicalRecord?.healthScore);
        if (!patientsWithRecords.length) return null;

        const totalScore = patientsWithRecords.reduce((acc, curr) => acc + (curr.medicalRecord?.healthScore || 0), 0);
        const averageScore = totalScore / patientsWithRecords.length;

        return {
            averageScore,
            count: patients.length,
            analyzedCount: patientsWithRecords.length
        };
    }, [patients]);

    if (!stats) {
        return (
            <div className="p-8 text-center bg-card rounded-2xl border border-border">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-foreground">{t('noAnalyticsData')}</h3>
                <p className="text-muted-foreground mt-2">{t('noAnalyticsDataDesc')}</p>
                <button onClick={onClose} className="mt-6 btn btn-secondary">{t('closeButton')}</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-primary">🧠</span> {t('aiAnalyticsDashboardTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t('aiAnalyticsSubtitle')}</p>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/20">
                    <p className="text-xs font-bold uppercase text-indigo-500 tracking-wider mb-1">{t('averageHealthScore')}</p>
                    <h3 className="text-4xl font-black text-foreground">{stats.averageScore.toFixed(1)}</h3>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">{t('totalPatientsAnalyzed')}</p>
                    <h3 className="text-4xl font-black text-foreground">{stats.analyzedCount} <span className="text-lg text-muted-foreground font-normal">/ {stats.count}</span></h3>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-center">
                    <button className="btn btn-primary w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1">
                        <span>📄</span>
                        {t('generateReportButton')}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">{t('recentInsightsTitle')}</h3>
                <div className="grid grid-cols-1 gap-4">
                    {patients
                        .filter(p => p.medicalRecord?.healthScore)
                        .slice(0, 5)
                        .map(patient => (
                            <AIInsightCard 
                                key={patient.id} 
                                insight={{
                                    id: patient.id,
                                    title: `${patient.name} (${patient.breed})`,
                                    content: `Health Score: ${patient.medicalRecord?.healthScore} - ${patient.medicalRecord?.notes || 'Routine checkup recommended based on age and breed trends.'}`,
                                    type: "health",
                                    timestamp: Date.now()
                                }}
                            />
                        ))
                    }
                </div>
            </div>
        </div>
    );
};
