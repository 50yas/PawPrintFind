import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../services/adminService';
import { User, AIUsageStats } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard, GlassButton } from './ui';
import { LoadingSpinner } from './LoadingSpinner';

export const AIUsageTable: React.FC = () => {
    const { t } = useTranslation();
    const { addSnackbar } = useSnackbar();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedRole] = useState<string | null>(null);
    const [usageStats, setUsageStats] = useState<AIUsageStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await adminService.getUsers();
                setUsers(data);
            } catch (e: any) {
                addSnackbar('Failed to fetch users: ' + e.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [addSnackbar]);

    const handleSelectUser = async (userId: string) => {
        setSelectedRole(userId);
        setLoadingStats(true);
        try {
            const stats = await adminService.getUserUsageStats(userId);
            // Sort by date desc
            setUsageStats(stats.sort((a, b) => b.id.localeCompare(a.id)));
        } catch (e: any) {
            addSnackbar('Failed to fetch usage stats: ' + e.message, 'error');
        } finally {
            setLoadingStats(false);
        }
    };

    const handleResetQuota = async () => {
        if (!selectedUserId) return;
        if (!confirm('Reset today\'s AI quota for this user?')) return;
        
        setLoadingStats(true);
        try {
            await adminService.resetUserUsageStats(selectedUserId);
            addSnackbar('Quota reset successfully', 'success');
            await handleSelectUser(selectedUserId);
        } catch (e: any) {
            addSnackbar('Failed to reset quota: ' + e.message, 'error');
        } finally {
            setLoadingStats(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

        return (

            <div className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* User List */}

                    <GlassCard className="p-4 h-[600px] flex flex-col border-white/10 bg-black/20">

                        <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 px-2">{t('dashboard:admin.selectOperative')}</h3>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">

                            {users.map(user => (

                                <button

                                    key={user.uid}

                                    onClick={() => handleSelectUser(user.uid)}

                                    className={`w-full text-left p-3 rounded-xl transition-all border ${

                                        selectedUserId === user.uid 

                                        ? 'bg-primary/20 border-primary text-white' 

                                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'

                                    }`}

                                >

                                    <p className="text-[10px] font-bold truncate">{user.email}</p>

                                    <p className="text-[8px] font-mono opacity-50">{user.uid}</p>

                                </button>

                            ))}

                        </div>

                    </GlassCard>

    

                    {/* Usage Detail */}

                    <GlassCard className="lg:col-span-2 p-6 border-white/10 bg-black/20 min-h-[600px]">

                        {!selectedUserId ? (

                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">

                                <span className="text-4xl">📡</span>

                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Target Selected</p>

                            </div>

                        ) : loadingStats ? (

                            <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>

                        ) : (

                            <div className="space-y-6 animate-fade-in">

                                <div className="flex justify-between items-center pb-4 border-b border-white/10">

                                    <div>

                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">{t('dashboard:admin.aiUsageTelemetry')}</h3>

                                        <p className="text-[10px] text-slate-500 font-mono">{users.find(u => u.uid === selectedUserId)?.email}</p>

                                    </div>

                                    <GlassButton onClick={handleResetQuota} variant="danger" className="!py-2 !px-4 text-[9px]">

                                        {t('dashboard:admin.resetQuota')}

                                    </GlassButton>

                                </div>

    

                                <div className="overflow-x-auto">

                                    <table className="w-full text-left text-[10px]">

                                        <thead className="text-slate-500 uppercase tracking-widest font-black">

                                            <tr className="border-b border-white/5">

                                                <th className="py-3 px-2">{t('dashboard:admin.cycleDate')}</th>

                                                <th className="py-3 px-2">{t('dashboard:admin.usageVision')}</th>

                                                <th className="py-3 px-2">{t('dashboard:admin.usageSearch')}</th>

                                                <th className="py-3 px-2">{t('dashboard:admin.usageHealth')}</th>

                                                <th className="py-3 px-2">{t('dashboard:admin.usageBlog')}</th>

                                                <th className="py-3 px-2">{t('dashboard:admin.usageTotal')}</th>

                                            </tr>

                                        </thead>

                                        <tbody className="text-slate-300 font-mono divide-y divide-white/5">

                                            {usageStats.map(stat => (

                                                <tr key={stat.id} className="hover:bg-white/5 transition-colors">

                                                    <td className="py-4 px-2 font-bold text-primary">{stat.id}</td>

                                                    <td className="py-4 px-2">{stat.visionIdentification || 0}</td>

                                                    <td className="py-4 px-2">{stat.smartSearch || 0}</td>

                                                    <td className="py-4 px-2">{stat.healthAssessment || 0}</td>

                                                    <td className="py-4 px-2">{stat.blogGeneration || 0}</td>

                                                    <td className="py-4 px-2 text-white font-black">{stat.totalAIRequests}</td>

                                                </tr>

                                            ))}

                                            {usageStats.length === 0 && (

                                                <tr>

                                                    <td colSpan={6} className="py-12 text-center text-slate-600 uppercase tracking-[0.2em]">{t('dashboard:admin.noUsageRecords')}</td>

                                                </tr>

                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        )}

                    </GlassCard>

                </div>

            </div>

        );

    
};
