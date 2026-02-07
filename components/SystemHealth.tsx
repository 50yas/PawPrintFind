
import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard, CinematicLoader } from './ui';

export const SystemHealth: React.FC = () => {
    const { t } = useTranslations();
    const [stats, setStats] = useState<{
        totalUsers: number;
        totalPets: number;
        totalClinics: number;
        totalDonations: number;
        activeAlerts: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        adminService.getSystemStats()
            .then(data => {
                if (mounted) setStats(data);
            })
            .catch(err => {
                if (mounted) setError(err.message);
            });
        return () => { mounted = false; };
    }, []);

    if (error) return <div className="text-red-500 p-4 bg-red-500/10 rounded-xl border border-red-500/30">{error}</div>;
    if (!stats) return <div className="flex justify-center p-10" data-testid="loading-spinner"><CinematicLoader /></div>;

    const metrics = [
        { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
        { label: 'Active Pets', value: stats.totalPets, color: 'text-green-400' },
        { label: 'Vet Clinics', value: stats.totalClinics, color: 'text-purple-400' },
        { label: 'Donations', value: stats.totalDonations, color: 'text-yellow-400', format: (v: number) => `€${v.toLocaleString()}` },
        { label: 'Active Alerts', value: stats.activeAlerts, color: 'text-red-500', alert: true }
    ];

    // Simple bar chart visualization
    // We normalize to the max value to set relative heights
    const maxVal = Math.max(stats.totalUsers, stats.totalPets, 100);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                System Diagnostics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {metrics.map((m, i) => (
                    <GlassCard key={i} className={`p-4 border-white/5 bg-white/5 hover:bg-white/10 transition-colors ${m.alert ? 'border-red-500/30 bg-red-500/10' : ''}`}>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className={`text-2xl font-black ${m.color}`}>
                            {m.format ? m.format(m.value) : m.value.toLocaleString()}
                        </p>
                    </GlassCard>
                ))}
            </div>

            {/* Custom Chart Section */}
            <GlassCard className="p-6 border-white/10 bg-black/40">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Resource Allocation Visualization</h3>
                <div className="flex items-end gap-4 h-48 w-full px-4 border-b border-white/10 pb-2">
                    <div className="w-full flex flex-col justify-end gap-2 group">
                        <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-blue-500/40 relative"
                            style={{ height: `${Math.max(5, (stats.totalUsers / maxVal) * 100)}%` }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{stats.totalUsers}</div>
                        </div>
                        <span className="text-[9px] text-slate-500 text-center uppercase font-black">Users</span>
                    </div>
                    <div className="w-full flex flex-col justify-end gap-2 group">
                        <div className="w-full bg-green-500/20 border border-green-500/50 rounded-t-lg transition-all duration-1000 ease-out delay-100 group-hover:bg-green-500/40 relative"
                            style={{ height: `${Math.max(5, (stats.totalPets / maxVal) * 100)}%` }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-green-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{stats.totalPets}</div>
                        </div>
                        <span className="text-[9px] text-slate-500 text-center uppercase font-black">Pets</span>
                    </div>


                </div>
            </GlassCard>
        </div>
    );
};
