
import React, { useState, useEffect, useMemo } from 'react';
import { User, PetProfile, VetClinic, LogEntry, Donation } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { calculateTotalFromList } from '../services/donationService';
import { logger } from '../services/loggerService';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';

interface AdminDashboardProps {
    users: User[];
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    onVerifyVet: (email: string) => void;
    onDeleteUser: (uid: string) => void;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, allPets, donations, onDeleteUser, onLogout, onRefresh, onVerifyVet }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verification' | 'logs'>('overview');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        return logger.subscribe(setLogs);
    }, []);

    const totalRevenue = useMemo(() => calculateTotalFromList(donations), [donations]);

    const pendingVerifications = useMemo(() => {
        return users.filter(u => (u.roles.includes('vet') || u.roles.includes('shelter')) && !u.isVerified && u.verificationData);
    }, [users]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
    };

    const approveUser = async (user: User) => {
        if (!user.uid) return;
        setIsRefreshing(true);
        try {
            await dbService.saveUser({ uid: user.uid, isVerified: true });

            // Audit Log
            await dbService.logAdminAction({
                adminEmail: 'current_admin_session', // ideally pass active admin email prop
                action: 'VERIFY_USER',
                targetId: user.uid,
                details: `Verified user ${user.email}`
            });

            await onRefresh();
        } catch (e: any) { alert(e.message); }
        setIsRefreshing(false);
    }

    return (
        <div className="min-h-screen bg-[#050508] font-mono-tech pb-20 text-slate-300">
            {/* HUD HEADER */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 sticky top-0 z-[100] border-b border-primary/20 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-4">
                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-1 rounded font-bold border border-primary/30 animate-pulse">ROOT_SESSION_ACTIVE</span>
                    <h1 className="text-lg font-bold tracking-tighter uppercase text-white">PawPrint Command Center</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRefresh} className="btn bg-primary/10 text-primary border border-primary/30 text-xs px-4 hover:bg-primary/20 transition-all">
                        {isRefreshing ? <LoadingSpinner /> : 'SYNC_NODE'}
                    </button>
                    <button onClick={onLogout} className="btn bg-red-500/10 text-red-500 border border-red-500/30 text-xs px-4 hover:bg-red-500/20">EXIT</button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* CYBER TABS */}
                <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'ANALYTICS', icon: '📊' },
                        { id: 'users', label: 'IDENTITY_MGMT', icon: '👥' },
                        { id: 'verification', label: 'VERIFICATION_QUEUE', count: pendingVerifications.length, icon: '🛡️' },
                        { id: 'logs', label: 'SYSTEM_LOGS', icon: '📟' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 rounded-xl border ${activeTab === tab.id
                                ? 'bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                                : 'border-white/5 text-muted-foreground hover:border-white/20'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] animate-pulse">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-4 gap-6 animate-fade-in">
                        <div className="glass-panel border-primary/20 p-6 rounded-2xl bg-slate-900/50">
                            <p className="text-[10px] font-bold text-primary uppercase mb-2 tracking-widest">Global Revenue</p>
                            <h3 className="text-3xl font-extrabold text-white">{totalRevenue}</h3>
                        </div>
                        <div className="glass-panel border-white/10 p-6 rounded-2xl bg-slate-900/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Active Identities</p>
                            <h3 className="text-3xl font-extrabold text-white">{users.length}</h3>
                        </div>
                        <div className="glass-panel border-white/10 p-6 rounded-2xl bg-slate-900/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Secure Profiles</p>
                            <h3 className="text-3xl font-extrabold text-white">{allPets.length}</h3>
                        </div>
                        <div className="glass-panel border-red-500/20 p-6 rounded-2xl bg-red-500/5">
                            <p className="text-[10px] font-bold text-red-500 uppercase mb-2 tracking-widest">Active Alerts</p>
                            <h3 className="text-3xl font-extrabold text-red-500">{allPets.filter(p => p.isLost).length}</h3>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="glass-panel rounded-2xl border-white/10 overflow-hidden animate-fade-in shadow-2xl bg-slate-900/30">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-xs min-w-[700px]">
                                <thead className="bg-slate-800/50 text-slate-400 uppercase font-mono tracking-tighter">
                                    <tr className="border-b border-white/10">
                                        <th className="p-4">Entity</th>
                                        <th className="p-4">Clearance</th>
                                        <th className="p-4">Last Sync</th>
                                        <th className="p-4 text-right">Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(u => (
                                        <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-primary">
                                                        {u.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{u.email}</p>
                                                        <p className="text-[9px] font-mono text-slate-500">{u.uid}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${u.roles.includes('super_admin') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                                                    }`}>
                                                    {u.activeRole}
                                                </span>
                                                {u.isVerified && <span className="ml-2 text-blue-400" title="Verified Professional">✔</span>}
                                            </td>
                                            <td className="p-4 font-mono text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString() : '---'}</td>
                                            <td className="p-4 text-right">
                                                {!u.roles.includes('super_admin') && (
                                                    <button onClick={() => onDeleteUser(u.uid!)} className="text-red-500/50 group-hover:text-red-500 transition-colors font-bold text-[10px] hover:underline">PURGE</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'verification' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-4">
                            <span className="text-2xl">🛡️</span>
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase tracking-widest">Professional Verification Queue</h3>
                                <p className="text-xs text-blue-300/80">Analyze uploaded credentials before granting verified status.</p>
                            </div>
                        </div>

                        {pendingVerifications.length > 0 ? (
                            <div className="grid gap-4">
                                {pendingVerifications.map(u => (
                                    <div key={u.uid} className="glass-panel p-6 rounded-2xl border-white/10 bg-slate-900/40 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl">🏥</div>
                                            <div>
                                                <h4 className="font-bold text-white">{u.email}</h4>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Role: {u.activeRole}</p>
                                                <p className="text-xs text-slate-400 mt-1">Submitted: {u.verificationData ? new Date(u.verificationData.timestamp).toLocaleString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            {u.verificationData?.docUrl && (
                                                <a href={u.verificationData.docUrl} target="_blank" rel="noreferrer" className="btn bg-white/5 border border-white/10 text-xs px-4 py-2 hover:bg-white/10">VIEW_DOCS</a>
                                            )}
                                            <button onClick={() => approveUser(u)} className="btn bg-primary/20 border border-primary/50 text-primary text-xs px-6 py-2 hover:bg-primary/30">APPROVE</button>
                                            <button className="btn bg-red-500/10 border border-red-500/50 text-red-500 text-xs px-4 py-2">REJECT</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">No pending verifications</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="bg-black text-green-500 p-6 rounded-2xl h-[600px] overflow-y-auto font-mono text-[11px] border border-green-500/20 shadow-2xl custom-scrollbar animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-green-500/20 pb-2">
                            <span className="font-bold animate-pulse">TERMINAL_OUTPUT_V3.0.4</span>
                            <button onClick={() => logger.clearLogs()} className="text-green-500/50 hover:text-green-400 underline uppercase text-[9px]">Flush_Buffer</button>
                        </div>
                        {logs.map(log => (
                            <div key={log.id} className="mb-1.5 flex gap-3 opacity-90 hover:opacity-100">
                                <span className="text-slate-600 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={`font-bold uppercase whitespace-nowrap ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-blue-400'
                                    }`}>
                                    {log.level.padEnd(5)}:
                                </span>
                                <span className="break-all text-slate-300">{log.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
