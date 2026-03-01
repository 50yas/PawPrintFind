import React, { useState, useMemo } from 'react';
import { Donation, User } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { dbService } from '../../services/firebase';
import { GlassCard } from '../ui';
import { MetricCard } from '../analytics/MetricCard';
import { ResponsiveLineChart } from '../analytics/ResponsiveLineChart';
import { ResponsivePieChart } from '../analytics/ResponsivePieChart';
import { CouponManagerTab } from './CouponManagerTab';

type FinanceSubTab = 'analytics' | 'transactions' | 'coupons';

interface FinanceTabProps {
    donations: Donation[];
    currentUser: User;
    onRefresh?: () => Promise<void>;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ donations, currentUser, onRefresh }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [subTab, setSubTab] = useState<FinanceSubTab>('analytics');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Revenue metrics
    const totalRevenue = useMemo(() =>
        donations.filter(d => d.status === 'paid').reduce((acc, d) => acc + (d.numericValue || 0), 0),
    [donations]);

    const confirmedRevenue = useMemo(() =>
        donations.filter(d => d.status === 'paid' && d.isConfirmed).reduce((acc, d) => acc + (d.numericValue || 0), 0),
    [donations]);

    const pendingRevenue = useMemo(() =>
        donations.filter(d => d.status === 'paid' && !d.isConfirmed).reduce((acc, d) => acc + (d.numericValue || 0), 0),
    [donations]);

    const failedCount = useMemo(() =>
        donations.filter(d => d.status !== 'paid').length,
    [donations]);

    // Revenue by day (last 7 days)
    const revenueByDay = useMemo(() => {
        const days: { day: string; revenue: number; date: string }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = d.toDateString();
            const revenue = donations
                .filter(don => don.status === 'paid' && new Date(don.timestamp).toDateString() === dateStr)
                .reduce((acc, don) => acc + (don.numericValue || 0), 0);
            days.push({ day: dayStr, revenue, date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
        }
        return days;
    }, [donations]);

    // Payment breakdown (Stripe vs. Other)
    const paymentBreakdown = useMemo(() => {
        const stripe = donations.filter(d => d.stripeSessionId).length;
        const other = donations.length - stripe;
        return [
            { name: 'Stripe', value: stripe },
            { name: 'Other', value: other },
        ].filter(d => d.value > 0);
    }, [donations]);

    // Top 5 donors
    const topDonors = useMemo(() => {
        const map = new Map<string, { name: string; email: string; total: number }>();
        donations.filter(d => d.status === 'paid').forEach(d => {
            const key = d.email || d.donorName;
            const existing = map.get(key);
            if (existing) {
                existing.total += d.numericValue || 0;
            } else {
                map.set(key, { name: d.donorName, email: d.email || '', total: d.numericValue || 0 });
            }
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [donations]);

    const handleDeleteDonation = async (id: string) => {
        if (!confirm(t('dashboard:admin.confirmPurgeDonation'))) return;
        setIsRefreshing(true);
        try {
            await dbService.deleteDonation(id);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'DELETE_DONATION',
                targetId: id,
                details: `Purged donation record: ${id}`,
            });
            addSnackbar(t('dashboard:admin.donationPurged'), 'success');
            if (onRefresh) await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const subTabs = [
        { id: 'analytics' as FinanceSubTab, label: 'Analytics', icon: '📈' },
        { id: 'transactions' as FinanceSubTab, label: 'Transactions', icon: '💸' },
        { id: 'coupons' as FinanceSubTab, label: 'Coupons', icon: '🎟️' },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    Finance
                </h2>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-white/10 pb-0">
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

            {/* Analytics Sub-tab */}
            {subTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Total Revenue"
                            value={totalRevenue}
                            prefix="€"
                            decimals={2}
                            icon="💰"
                            trend="up"
                            colorClass="bg-amber-500/10 text-amber-400"
                        />
                        <MetricCard
                            title="Confirmed"
                            value={confirmedRevenue}
                            prefix="€"
                            decimals={2}
                            icon="✅"
                            trend="up"
                            colorClass="bg-emerald-500/10 text-emerald-400"
                        />
                        <MetricCard
                            title="Pending Confirmation"
                            value={pendingRevenue}
                            prefix="€"
                            decimals={2}
                            icon="⏳"
                            trend="neutral"
                            colorClass="bg-yellow-500/10 text-yellow-400"
                        />
                        <MetricCard
                            title="Failed / Non-Paid"
                            value={failedCount}
                            icon="❌"
                            trend={failedCount > 0 ? 'down' : 'up'}
                            colorClass={failedCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-6 border-white/10 bg-black/40">
                            <ResponsiveLineChart
                                data={revenueByDay}
                                lines={[{ dataKey: 'revenue', stroke: '#F59E0B', name: 'Revenue (€)', strokeWidth: 2 }]}
                                xAxisKey="day"
                                title="Revenue (Last 7 Days)"
                                height={250}
                                showArea={true}
                            />
                        </GlassCard>

                        <GlassCard className="p-6 border-white/10 bg-black/40">
                            <ResponsivePieChart
                                data={paymentBreakdown}
                                title="Payment Breakdown"
                                height={250}
                                colors={['#14B8A6', '#8B5CF6']}
                                innerRadius={40}
                                outerRadius={80}
                            />
                        </GlassCard>
                    </div>

                    {/* Top Donors */}
                    <GlassCard className="p-6 border-white/10 bg-black/40">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span>🏆</span> Top 5 Donors
                        </h3>
                        <div className="space-y-3">
                            {topDonors.map((donor, idx) => (
                                <div key={donor.email || donor.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center font-black text-amber-400 text-sm border border-amber-500/30">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{donor.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono truncate">{donor.email || 'Anonymous'}</p>
                                    </div>
                                    <span className="font-black text-primary text-sm">€{donor.total.toFixed(2)}</span>
                                </div>
                            ))}
                            {topDonors.length === 0 && (
                                <p className="text-center text-slate-600 font-mono text-xs uppercase tracking-[0.3em] py-6">No paid donations yet</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Transactions Sub-tab */}
            {subTab === 'transactions' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.adminTabDonations')}</h3>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-black">{t('dashboard:admin.totalRevenue')}</p>
                            <p className="text-xl font-black text-primary">€{totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                    <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-xs min-w-[800px]">
                                <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                    <tr className="border-b border-white/10">
                                        <th className="p-5">{t('dashboard:admin.donor')}</th>
                                        <th className="p-5">{t('dashboard:admin.amount')}</th>
                                        <th className="p-5">{t('dashboard:admin.status')}</th>
                                        <th className="p-5">{t('dashboard:admin.date')}</th>
                                        <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {donations.map(d => (
                                        <tr key={d.id} className="hud-table-row group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                        {d.avatarUrl ? <img src={d.avatarUrl} alt="" className="w-full h-full object-cover" /> : d.donorName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{d.donorName}</p>
                                                        <p className="text-[9px] text-slate-500 font-mono">{d.email || t('dashboard:admin.anonymousDonor')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 font-black text-primary">{d.amount}</td>
                                            <td className="p-5">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${d.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                                                    {t(`dashboard:admin.status_${d.status}`)}
                                                </span>
                                                {d.isConfirmed ? (
                                                    <span className="ml-2 text-[8px] text-primary font-black uppercase border border-primary/30 px-1.5 py-0.5 rounded">{t('dashboard:admin.confirmedDonationBadge')}</span>
                                                ) : (
                                                    <span className="ml-2 text-[8px] text-amber-500 font-black uppercase border border-amber-500/30 px-1.5 py-0.5 rounded">{t('dashboard:admin.unconfirmedDonationBadge')}</span>
                                                )}
                                            </td>
                                            <td className="p-5 text-slate-500 font-mono text-[10px]">
                                                {new Date(d.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                {!d.isConfirmed && d.status === 'paid' && (
                                                    <button
                                                        onClick={async () => {
                                                            await dbService.confirmDonation(d.id);
                                                            addSnackbar(t('dashboard:admin.donationConfirmed'), 'success');
                                                        }}
                                                        className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                    >
                                                        {t('dashboard:admin.confirmDonationButton')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteDonation(d.id)}
                                                    className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                >
                                                    {t('dashboard:admin.terminateButton')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {donations.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10">
                                                <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">No donations found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Coupons Sub-tab */}
            {subTab === 'coupons' && <CouponManagerTab />}
        </div>
    );
};
