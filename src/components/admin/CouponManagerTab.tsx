import React, { useState, useEffect, useCallback } from 'react';
import { PromoCode } from '../../types';
import { adminService } from '../../services/adminService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { GlassCard } from '../ui';
import { LoadingSpinner } from '../LoadingSpinner';

type CouponType = 'badge' | 'subscription' | 'points';

const TYPE_COLORS: Record<CouponType, string> = {
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    subscription: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    points: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const STATUS_COLORS: Record<'active' | 'revoked' | 'expired', string> = {
    active: 'bg-emerald-500/20 text-emerald-400',
    revoked: 'bg-slate-500/20 text-slate-400',
    expired: 'bg-red-500/20 text-red-400',
};

export const CouponManagerTab: React.FC = () => {
    const { addSnackbar } = useSnackbar();
    const [coupons, setCoupons] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        code: adminService.generateCouponCode(),
        type: 'points' as CouponType,
        value: '100',
        description: '',
        maxUses: 0,
        status: 'active' as 'active' | 'revoked',
        expiresAt: '',
    });

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getCoupons();
            setCoupons(data);
        } catch (e: any) {
            addSnackbar(e.message || 'Failed to load coupons', 'error');
        } finally {
            setLoading(false);
        }
    }, [addSnackbar]);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await adminService.createCoupon({
                code: form.code.toUpperCase().trim(),
                type: form.type,
                value: form.value,
                description: form.description,
                maxUses: Number(form.maxUses),
                status: form.status,
                expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
                createdBy: '',
            });
            addSnackbar(`Coupon "${form.code}" created!`, 'success');
            setShowForm(false);
            setForm(f => ({ ...f, code: adminService.generateCouponCode() }));
            await fetchCoupons();
        } catch (e: any) {
            addSnackbar(e.message || 'Failed to create coupon', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (coupon: PromoCode) => {
        const next: 'active' | 'revoked' = coupon.status === 'active' ? 'revoked' : 'active';
        try {
            await adminService.updateCouponStatus(coupon.id, next);
            setCoupons(cs => cs.map(c => c.id === coupon.id ? { ...c, status: next } : c));
            addSnackbar(`Coupon ${next}`, 'success');
        } catch (e: any) {
            addSnackbar(e.message || 'Update failed', 'error');
        }
    };

    const handleDelete = async (coupon: PromoCode) => {
        if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
        try {
            await adminService.deleteCoupon(coupon.id);
            setCoupons(cs => cs.filter(c => c.id !== coupon.id));
            addSnackbar('Coupon deleted', 'success');
        } catch (e: any) {
            addSnackbar(e.message || 'Delete failed', 'error');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => addSnackbar(`Copied: ${code}`, 'success'));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        🎟️ Coupon Manager
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Generate and manage promotional codes for users</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-black hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    {showForm ? '✕ Cancel' : '+ New Coupon'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <GlassCard className="p-6 border border-primary/20 bg-primary/5">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                        <span className="text-primary">⚡</span> Generate New Coupon
                    </h4>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Code */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Code</label>
                                <div className="flex gap-2">
                                    <input
                                        value={form.code}
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                        className="input-base flex-1 font-mono tracking-widest text-sm"
                                        placeholder="PAW-XXXX-XXXX"
                                        required
                                    />
                                    <button type="button" onClick={() => setForm(f => ({ ...f, code: adminService.generateCouponCode() }))}
                                        className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all" title="Regenerate">
                                        🔄
                                    </button>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CouponType }))}
                                    className="input-base w-full">
                                    <option value="points">🌟 Karma Points</option>
                                    <option value="badge">🏆 Badge Award</option>
                                    <option value="subscription">👑 Pro Subscription (30d)</option>
                                </select>
                            </div>

                            {/* Value */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                    {form.type === 'points' ? 'Points Amount' : form.type === 'badge' ? 'Badge Name' : 'Plan ID'}
                                </label>
                                <input
                                    value={form.value}
                                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                                    className="input-base w-full"
                                    placeholder={form.type === 'points' ? '100' : form.type === 'badge' ? 'Early Adopter' : 'vet_pro_monthly'}
                                    required
                                />
                            </div>

                            {/* Max Uses */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Max Uses (0 = unlimited)</label>
                                <input type="number" min="0" value={form.maxUses}
                                    onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                                    className="input-base w-full" />
                            </div>

                            {/* Expiry */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Expires At (optional)</label>
                                <input type="datetime-local" value={form.expiresAt}
                                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                    className="input-base w-full" />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                                <input value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="input-base w-full"
                                    placeholder="Internal note about this coupon" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={creating}
                                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-primary text-black hover:scale-105 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">
                                {creating ? <LoadingSpinner size="sm" /> : '🎟️'} Create Coupon
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                                Cancel
                            </button>
                        </div>
                    </form>
                </GlassCard>
            )}

            {/* Coupon List */}
            {loading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                    <div className="text-4xl mb-3">🎟️</div>
                    <p className="text-slate-400 font-bold">No coupons yet</p>
                    <p className="text-xs text-slate-600 mt-1">Create your first promotional code above</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {coupons.map(coupon => {
                        const usagePercent = coupon.maxUses > 0 ? Math.round((coupon.currentUses / coupon.maxUses) * 100) : null;
                        const isExpired = coupon.expiresAt && Date.now() > coupon.expiresAt;
                        return (
                            <div key={coupon.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all hover:border-white/20 ${coupon.status === 'active' && !isExpired ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                {/* Code + Type */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button onClick={() => copyCode(coupon.code)}
                                        className="font-mono font-black text-white text-sm tracking-widest hover:text-primary transition-colors flex items-center gap-2 group" title="Click to copy">
                                        {coupon.code}
                                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">📋</span>
                                    </button>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${TYPE_COLORS[coupon.type]}`}>
                                        {coupon.type}
                                    </span>
                                </div>

                                {/* Value */}
                                <div className="text-sm font-bold text-slate-300 min-w-[80px]">
                                    {coupon.type === 'points' ? `${coupon.value} pts` : coupon.value}
                                </div>

                                {/* Usage */}
                                <div className="text-xs text-slate-400 min-w-[80px]">
                                    <span className="font-black text-white">{coupon.currentUses}</span>
                                    <span> / {coupon.maxUses === 0 ? '∞' : coupon.maxUses} uses</span>
                                    {usagePercent !== null && (
                                        <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden w-16">
                                            <div className={`h-full rounded-full transition-all ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 75 ? 'bg-amber-500' : 'bg-primary'}`}
                                                style={{ width: `${Math.min(100, usagePercent)}%` }} />
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[isExpired ? 'expired' : (coupon.status === 'revoked' ? 'revoked' : coupon.status)]}`}>
                                    {isExpired ? 'expired' : coupon.status}
                                </span>

                                {/* Expiry */}
                                {coupon.expiresAt && (
                                    <div className="text-[10px] text-slate-500 min-w-[90px]">
                                        Exp: {new Date(coupon.expiresAt).toLocaleDateString()}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleToggleStatus(coupon)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${coupon.status === 'active' ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                                        {coupon.status === 'active' ? 'Revoke' : 'Activate'}
                                    </button>
                                    <button onClick={() => handleDelete(coupon)}
                                        className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/30 text-red-400 hover:bg-red-500/10">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
