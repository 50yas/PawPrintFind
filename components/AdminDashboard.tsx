import React, { useState, useEffect, useMemo } from 'react';
import { User, PetProfile, VetClinic, LogEntry, Donation, BlogPost, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { calculateTotalFromList } from '../services/donationService';
import { logger } from '../services/loggerService';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { BlogPostEditor } from './BlogPostEditor';
import { GlassCard, GlassButton } from './ui';
import { AddPatientModal } from './AddPatientModal';
import { AddClinicModal } from './AddClinicModal';
import { AddVetModal } from './AddVetModal';
import { calculateGrowth } from '../src/utils/adminUtils';

interface AdminDashboardProps {
    users: User[];
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    onDeleteUser: (uid: string) => Promise<void>;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, currentUser, allPets, vetClinics, donations, onDeleteUser, onLogout, onRefresh }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'clinics' | 'pets' | 'blog' | 'verification' | 'logs'>('overview');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [showAddVetPet, setShowAddVetPet] = useState<{show: boolean, email: string}>({ show: false, email: '' });
    const [showAddClinic, setShowAddClinic] = useState(false);
    const [showAddVet, setShowAddVet] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [petSearch, setPetSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    useEffect(() => {
        dbService.logAdminAction({
            adminEmail: currentUser.email,
            action: 'SESSION_START',
            targetId: currentUser.uid,
            details: 'Admin Command Center initialized'
        });
        dbService.getBlogPosts().then(setBlogPosts).catch(err => {
            console.error("Initial Blog Fetch Error:", err);
        });
        return logger.subscribe(setLogs);
    }, []);

    const totalRevenue = useMemo(() => calculateTotalFromList(donations), [donations]);

    const pendingVerifications = useMemo(() => {
        return users.filter(u => ((u.roles || []).includes('vet') || (u.roles || []).includes('shelter')) && !u.isVerified && u.verificationData);
    }, [users]);

    const userStats = useMemo(() => calculateGrowth(users), [users]);
    const petStats = useMemo(() => calculateGrowth(allPets), [allPets]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = 
                u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.activeRole?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.uid.toLowerCase().includes(userSearch.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || (u.roles || []).includes(roleFilter as any);
            
            return matchesSearch && matchesRole;
        });
    }, [users, userSearch, roleFilter]);

    const filteredPets = useMemo(() => {
        return allPets.filter(p => 
            p.name.toLowerCase().includes(petSearch.toLowerCase()) ||
            p.breed.toLowerCase().includes(petSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(petSearch.toLowerCase())
        );
    }, [allPets, petSearch]);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const posts = await dbService.getBlogPosts();
                setBlogPosts(posts);
            } catch (err) {
                console.error("Blog Fetch Error:", err);
                addSnackbar("Access Denied: Blog collection unreachable.", 'error');
            }
        };
        fetchBlog();
    }, [activeTab]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
            const posts = await dbService.getBlogPosts();
            setBlogPosts(posts);
            addSnackbar("System Node Synchronized", 'success');
        } catch (e: any) {
            addSnackbar("Refresh failed: " + e.message, 'error');
        }
        setIsRefreshing(false);
    };

    const handleDeleteUser = async (uid: string) => {
        if (!confirm('TERMINATE IDENTITY? This will permanently delete the user document and cannot be undone.')) return;
        setIsRefreshing(true);
        try {
            await onDeleteUser(uid);
            addSnackbar("Identity Purged", 'success');
            // onDeleteUser in App.tsx already calls refresh
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const toggleUserRole = async (user: User, newRole: string) => {
        setIsRefreshing(true);
        try {
            const updatedRoles = [...(user.roles || [])];
            if (!updatedRoles.includes(newRole as any)) updatedRoles.push(newRole as any);
            
            await dbService.saveUser({ 
                ...user, 
                activeRole: newRole as any,
                roles: updatedRoles as any
            });

            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'UPDATE_USER_ROLE',
                targetId: user.uid,
                details: `Changed role for ${user.email} to ${newRole}`
            });

            addSnackbar("Clearance Updated", 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const deleteClinic = async (id: string) => {
        if (!confirm('DISMANTLE CLINIC NODE? This action is irreversible.')) return;
        setIsRefreshing(true);
        try {
            await dbService.deleteClinic(id);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'DELETE_CLINIC',
                targetId: id,
                details: `Deleted clinic ${id}`
            });
            addSnackbar("Clinic Node Dismantled", 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const approveUser = async (user: User) => {
        if (!user.uid) return;
        setIsRefreshing(true);
        try {
            await dbService.saveUser({ ...user, isVerified: true });
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'VERIFY_USER',
                targetId: user.uid,
                details: `Approved credentials for ${user.email}`
            });
            addSnackbar(t('vetRegisteredAlert', { clinicName: user.email }), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    }

    const rejectUser = async (user: User) => {
        if (!user.uid) return;
        if (!confirm(`Reject verification for ${user.email}?`)) return;
        setIsRefreshing(true);
        try {
            // Remove verification data but keep the user
            const { verificationData, ...userWithoutVerification } = user;
            await dbService.saveUser({ ...userWithoutVerification, isVerified: false });
            
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'REJECT_VERIFICATION',
                targetId: user.uid,
                details: `Rejected credentials for ${user.email}`
            });
            
            addSnackbar("Verification Rejected", 'info');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-20 text-foreground transition-colors duration-500 relative">
            {/* Cyber HUD Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden text-primary/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)]"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scanline"></div>
            </div>

            {/* HUD HEADER */}
            <div className="sticky top-0 z-[100] w-full px-6 py-4">
                <GlassCard className="flex justify-between items-center px-6 py-3 border-primary/30 shadow-[0_0_30px_rgba(20,184,166,0.2)] bg-black/60 backdrop-blur-2xl">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse group-hover:bg-primary/40 transition-all"></div>
                            <div className="relative bg-slate-900 border border-primary/50 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping mr-2"></span>
                                SYSTEM_ROOT_ACTIVE
                            </div>
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            COMMAND_<span className="text-primary">CORE</span>
                        </h1>
                    </div>
                    
                    {/* Persistent Alert Feed */}
                    {pendingVerifications.length > 0 && (
                        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Urgent_Protocol:</span>
                            <span className="text-[10px] font-bold text-white uppercase">{pendingVerifications.length} Verification Requests Pending</span>
                            <button 
                                onClick={() => setActiveTab('verification')}
                                className="ml-2 text-[10px] font-black text-primary hover:underline uppercase"
                            >
                                Resolve_Now
                            </button>
                        </div>
                    )}
                    
                    {/* System Status Bar - Mini HUD */}
                    <div className="hidden lg:flex items-center gap-8 px-8 py-1 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Load_Factor</span>
                            <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4,5,6].map(i => <div key={i} className={`w-1.5 h-3 rounded-sm ${i < 5 ? 'bg-primary shadow-[0_0_5px_#14b8a6]' : 'bg-white/10'}`}></div>)}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nodes_Online</span>
                            <span className="text-xs font-mono text-white font-bold">{users.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Uptime</span>
                            <span className="text-xs font-mono text-white font-bold tracking-tighter">99.998%</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <GlassButton onClick={handleRefresh} variant="primary" className="!py-2 !px-5 text-[10px] shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                            {isRefreshing ? <LoadingSpinner /> : 'SYNC_NODE'}
                        </GlassButton>
                        <GlassButton onClick={onLogout} variant="danger" className="!py-2 !px-5 text-[10px]">EXIT_SESSION</GlassButton>
                    </div>
                </GlassCard>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
                {/* CYBER TABS */}
                <div className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'overview', label: t('adminTabOverview'), icon: '📊' },
                        { id: 'users', label: t('adminTabUsers'), icon: '👥' },
                        { id: 'clinics', label: 'CLINICS', icon: '🏥' },
                        { id: 'pets', label: t('adminTabPets'), icon: '🐾' },
                        { id: 'blog', label: t('adminTabBlog'), icon: '📰' },
                        { id: 'verification', label: t('pendingVerificationsTitle'), count: pendingVerifications.length, icon: '🛡️' },
                        { id: 'logs', label: 'SYSTEM_LOGS', icon: '📟' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 rounded-2xl border-2 whitespace-nowrap relative overflow-hidden group ${activeTab === tab.id
                                ? 'bg-primary/10 text-white border-primary shadow-[0_0_25px_rgba(20,184,166,0.3)] scale-105'
                                : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                                }`}
                        >
                            {activeTab === tab.id && <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none"></div>}
                            <span className="relative z-10">{tab.icon}</span>
                            <span className="relative z-10">{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="relative z-10 bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <GlassCard className="p-6 border-primary/20 bg-primary/5 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-[0.2em] opacity-70">Global_Revenue</p>
                                <h3 className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{totalRevenue}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase">Status: Nominal</span>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 border-white/10 bg-white/5 group relative overflow-hidden text-cyan-400">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em] opacity-70">Identities</p>
                                <h3 className="text-4xl font-black text-white">{userStats.total}</h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-primary">+{userStats.newLastWeek} NEW_7D</span>
                                    <span className="text-[9px] font-mono text-slate-500">{userStats.velocity}/DAY</span>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 border-white/10 bg-white/5 group relative overflow-hidden text-cyan-400">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em] opacity-70">Secure_Profiles</p>
                                <h3 className="text-4xl font-black text-white">{petStats.total}</h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-primary">+{petStats.newLastWeek} NEW_7D</span>
                                    <span className="text-[9px] font-mono text-slate-500">{petStats.velocity}/DAY</span>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 border-red-500/20 bg-red-500/5 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
                                <p className="text-[10px] font-black text-red-500 uppercase mb-2 tracking-[0.2em] opacity-70">Active_Alerts</p>
                                <h3 className="text-4xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">{allPets.filter(p => p.isLost).length}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    <span className="text-[8px] font-black text-red-400 uppercase">Urgent_Response_Required</span>
                                </div>
                            </GlassCard>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <GlassCard className="p-8 border-primary/20 bg-black/40 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                                    Security Protocol Status
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Database_Sync', status: 'Optimal', val: '12ms' },
                                        { label: 'Encryption_Layer', status: 'Active', val: 'AES-256' },
                                        { label: 'AI_Model_Flash', status: 'Ready', val: 'v2.5-PRO' }
                                    ].map(layer => (
                                        <div key={layer.label} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-emerald-400">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{layer.label}</span>
                                                <span className="text-[8px] font-mono text-slate-600 mt-1">{layer.val}</span>
                                            </div>
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-black border border-emerald-500/30 uppercase tracking-tighter shadow-[0_0_10px_rgba(16,185,129,0.2)]">{layer.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>

                            <GlassCard className="p-8 border-white/10 bg-white/5 flex flex-col justify-center text-center relative group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <div className="max-w-xs mx-auto relative z-10">
                                    <div className="text-6xl mb-6 drop-shadow-[0_0_20px_rgba(20,184,166,0.4)]">🚀</div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Platform Scale</h4>
                                    <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed">System is currently orchestrating {users.length} active neural nodes across {allPets.length} biometric profiles. Efficiency is at maximal levels.</p>
                                    <GlassButton onClick={handleRefresh} variant="primary" className="w-full !py-4 shadow-xl">FORCE_RE-INITIALIZATION</GlassButton>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Trending Blog Intelligence */}
                        <GlassCard className="p-8 border-primary/20 bg-black/40 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <span className="text-xl">📈</span>
                                    Content_Intelligence
                                </h4>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Trending_Articles</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {blogPosts.sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0,3).map((post, i) => (
                                    <div key={post.id} className="relative group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                                        <div className="absolute top-0 right-0 p-3 text-[20px] opacity-10 font-black italic">0{i+1}</div>
                                        <h5 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{post.title}</h5>
                                        <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest">{post.author}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="text-[10px] font-black text-primary">{post.views || 0} VIEWS</span>
                                            <span className="text-[8px] font-mono text-slate-600 uppercase">Rank: {i === 0 ? 'ALPHA' : i === 1 ? 'BETA' : 'GAMMA'}</span>
                                        </div>
                                    </div>
                                ))}
                                {blogPosts.length === 0 && (
                                    <div className="col-span-3 text-center py-10 text-slate-600 font-mono text-xs uppercase tracking-[0.3em]">No_Engagement_Data_Available</div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* Data Tables Wrapper */}
                <div className="animate-fade-in">
                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center px-2 gap-4">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Identity_Registry</h3>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <select 
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none uppercase tracking-wider"
                                    >
                                        <option value="all">ALL_ROLES</option>
                                        <option value="owner">OWNER</option>
                                        <option value="vet">VET</option>
                                        <option value="shelter">SHELTER</option>
                                        <option value="admin">ADMIN</option>
                                    </select>
                                    <div className="relative flex-grow md:w-64">
                                        <input 
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                            placeholder="SEARCH_BY_UID_OR_EMAIL..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none transition-all"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-sm">🔍</span>
                                    </div>
                                </div>
                            </div>
                            <GlassCard className="overflow-hidden border-white/10 bg-black/20">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs min-w-[700px]">
                                        <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                            <tr className="border-b border-white/10">
                                                <th className="p-5">Entity</th>
                                                <th className="p-5">Clearance</th>
                                                <th className="p-5">Last Sync</th>
                                                <th className="p-5 text-right">Protocol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map(u => (
                                                <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-primary border border-white/10 group-hover:border-primary/50 transition-colors shadow-lg">
                                                                {u.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-sm">{u.email}</p>
                                                                <p className="text-[9px] font-mono text-slate-500 tracking-tighter">{u.uid}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${(u.roles || []).includes('super_admin') ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-primary/20 text-primary border border-primary/30'
                                                                    }`}>
                                                                    {u.activeRole || 'User'}
                                                                </span>
                                                                {u.isVerified && <span className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" title="Verified Professional">🛡️</span>}
                                                            </div>
                                                            <div className="flex gap-1 flex-wrap">
                                                                {(u.roles || []).map(r => (
                                                                    <span key={r} className="text-[7px] text-slate-500 font-mono uppercase bg-white/5 px-1 rounded">{r}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 font-mono text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '---'}</td>
                                                    <td className="p-5 text-right">
                                                        <div className="flex flex-col gap-2 items-end">
                                                            <div className="flex gap-2">
                                                                {(u.activeRole === 'vet' || (u.roles || []).includes('vet')) && (
                                                                    <button 
                                                                        onClick={() => setShowAddVetPet({ show: true, email: u.email })}
                                                                        className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                                    >
                                                                        +PATIENT
                                                                    </button>
                                                                )}
                                                                {!(u.roles || []).includes('super_admin') && (
                                                                    <button 
                                                                        onClick={() => handleDeleteUser(u.uid!)} 
                                                                        className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                                    >
                                                                        PURGE
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {!(u.roles || []).includes('super_admin') && (
                                                                <div className="flex gap-1">
                                                                    <select 
                                                                        value={u.activeRole}
                                                                        onChange={(e) => toggleUserRole(u, e.target.value)}
                                                                        className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[8px] font-mono text-slate-400 outline-none"
                                                                    >
                                                                        <option value="owner">Role: OWNER</option>
                                                                        <option value="vet">Role: VET</option>
                                                                        <option value="shelter">Role: SHELTER</option>
                                                                        <option value="admin">Role: ADMIN</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'clinics' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center px-2 gap-4">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Veterinary_Infrastructure</h3>
                                <div className="flex gap-3">
                                    <GlassButton onClick={() => setShowAddVet(true)} variant="secondary" className="!py-2 !px-4 text-[10px] border-primary/20">
                                        + NEW_VET_IDENTITY
                                    </GlassButton>
                                    <GlassButton onClick={() => setShowAddClinic(true)} variant="primary" className="!py-2 !px-4 text-[10px]">
                                        + NEW_CLINIC_NODE
                                    </GlassButton>
                                </div>
                            </div>

                            {/* CLINICS TABLE */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Authorized_Facilities</p>
                                <GlassCard className="overflow-hidden border-white/10 bg-black/20">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs min-w-[700px]">
                                            <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                                <tr className="border-b border-white/10">
                                                    <th className="p-5">Facility_Name</th>
                                                    <th className="p-5">Contact_Vector</th>
                                                    <th className="p-5">Coordinates</th>
                                                    <th className="p-5 text-right">Override</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {vetClinics.map(c => (
                                                    <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors shadow-lg">
                                                                    🏥
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-white text-sm">{c.name}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-tighter">Verified_Link</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-slate-400">
                                                                    <span className="text-[10px]">📧</span>
                                                                    <span className="text-[10px] font-mono">{c.vetEmail}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-400">
                                                                    <span className="text-[10px]">📞</span>
                                                                    <span className="text-[10px] font-mono">{c.phone}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 font-mono text-slate-500 text-[10px]">{c.address}</td>
                                                        <td className="p-5 text-right">
                                                            <button 
                                                                onClick={() => deleteClinic(c.id!)} 
                                                                className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                            >
                                                                DISMANTLE
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {vetClinics.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-10">
                                                            <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">No_Facilities_Online</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* VETS PENDING INFRASTRUCTURE */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Vets_Pending_Infrastructure_Link</p>
                                <GlassCard className="overflow-hidden border-white/10 bg-black/20">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs min-w-[700px]">
                                            <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                                <tr className="border-b border-white/10">
                                                    <th className="p-5">Professional_Identity</th>
                                                    <th className="p-5">Clearance_Level</th>
                                                    <th className="p-5 text-right">Protocol</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {users.filter(u => (u.roles || []).includes('vet')).map(v => {
                                                    const hasClinic = vetClinics.some(c => c.vetEmail === v.email);
                                                    return (
                                                        <tr key={v.uid} className="hover:bg-white/5 transition-colors group">
                                                            <td className="p-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-primary border border-white/10 group-hover:border-primary/50 transition-colors shadow-lg">
                                                                        {v.email.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-white text-sm">{v.email}</p>
                                                                        <p className="text-[9px] font-mono text-slate-500 tracking-tighter">{v.uid}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${v.isVerified ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>
                                                                        {v.isVerified ? 'VERIFIED_PRO' : 'PENDING_VERIFICATION'}
                                                                    </span>
                                                                    {hasClinic ? (
                                                                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-bold">Linked</span>
                                                                    ) : (
                                                                        <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold">Unlinked</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-right space-x-2">
                                                                {!hasClinic && (
                                                                    <button 
                                                                        onClick={() => { setShowAddClinic(true); /* Ideally pre-fill email */ }}
                                                                        className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                                    >
                                                                        CREATE_CLINIC
                                                                    </button>
                                                                )}
                                                                {!v.isVerified && v.verificationData && (
                                                                    <button 
                                                                        onClick={() => setActiveTab('verification')}
                                                                        className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black text-[9px] tracking-widest border border-emerald-500/20"
                                                                    >
                                                                        VERIFY_NOW
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pets' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center px-2 gap-4">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Biometric_Database</h3>
                                <div className="relative w-full md:w-64">
                                    <input 
                                        value={petSearch}
                                        onChange={e => setPetSearch(e.target.value)}
                                        placeholder="SEARCH_BY_NAME_OR_BREED..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-sm">🔍</span>
                                </div>
                            </div>
                            <GlassCard className="overflow-hidden border-white/10 bg-black/20">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs min-w-[700px]">
                                        <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                            <tr className="border-b border-white/10">
                                                <th className="p-5">Pet Identity</th>
                                                <th className="p-5">Status</th>
                                                <th className="p-5">Location</th>
                                                <th className="p-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredPets.map(p => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors shadow-xl text-primary/20">
                                                            {p.photos[0]?.url ? (
                                                                <img src={p.photos[0].url} alt={p.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xl font-black">?</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{p.name}</p>
                                                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{p.breed} • {p.age}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm ${
                                                        p.status === 'lost' || p.isLost ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 
                                                        p.status === 'forAdoption' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                    }`}>
                                                        {p.isLost ? 'LOST' : p.status}
                                                    </span>
                                                </td>
                                                <td className="p-5 font-mono text-slate-500 tracking-tighter">
                                                    {p.lastSeenLocation ? `${p.lastSeenLocation.latitude.toFixed(4)}, ${p.lastSeenLocation.longitude.toFixed(4)}` : 'ORBITAL_UNKNOWN'}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <button 
                                                        onClick={() => { if(confirm('TERMINATE PROFILE?')) dbService.deletePet(p.id).then(() => onRefresh()); }}
                                                        className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                    >
                                                        TERMINATE
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                )}

                    {activeTab === 'blog' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter drop-shadow-md">Blog <span className="text-primary">Repository</span></h3>
                                <GlassButton 
                                    onClick={() => { setEditingPost(null); setShowEditor(true); }}
                                    variant="primary"
                                    className="scale-110 shadow-primary/20"
                                >
                                    + NEW_ENTRY
                                </GlassButton>
                            </div>

                            <GlassCard className="overflow-hidden border-white/10 bg-black/20">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs min-w-[700px]">
                                        <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                            <tr className="border-b border-white/10">
                                                <th className="p-5">Content Header</th>
                                                <th className="p-5">Author</th>
                                                <th className="p-5">Analytics</th>
                                                <th className="p-5 text-right">Action_Pool</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {blogPosts.map(p => (
                                                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="max-w-xs md:max-w-md">
                                                            <p className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.title}</p>
                                                            <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{p.summary}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-slate-400 font-bold">{p.author}</td>
                                                    <td className="p-5">
                                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black border border-primary/20 text-[9px] uppercase tracking-widest">
                                                            {p.views || 0} VIEWS
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right flex justify-end gap-3 pt-7">
                                                        <button 
                                                            onClick={() => { setEditingPost(p); setShowEditor(true); }}
                                                            className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button 
                                                            onClick={async () => { if(confirm('PURGE CONTENT?')) { await dbService.deleteBlogPost(p.id); onRefresh(); } }} 
                                                            className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                        >
                                                            DELETE
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="space-y-6">
                            <GlassCard className="bg-primary/10 border-primary/30 p-6 flex items-center gap-6 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl shadow-inner border border-primary/20">🛡️</div>
                                <div>
                                    <h3 className="font-black text-white text-lg uppercase tracking-tighter">Verification Subsystem</h3>
                                    <p className="text-sm text-primary/80 font-medium">Verify credentials for clinical and shelter clearance.</p>
                                </div>
                            </GlassCard>

                            {pendingVerifications.length > 0 ? (
                                <div className="grid gap-4">
                                    {pendingVerifications.map(u => (
                                        <GlassCard key={u.uid} className="p-6 border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-5 text-emerald-400">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-white/10 shadow-lg">🏥</div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{u.email}</h4>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Clearance: {u.activeRole || 'User'}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-tighter">SYNCED: {u.verificationData ? new Date(u.verificationData.timestamp).toLocaleString() : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {u.verificationData?.docUrl && (
                                                    <a href={u.verificationData.docUrl} target="_blank" rel="noreferrer" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-white hover:bg-white/10 transition-all uppercase">VIEW_DOCS</a>
                                                )}
                                                <button onClick={() => approveUser(u)} className="px-6 py-2 rounded-xl bg-primary text-black text-[10px] font-black tracking-widest hover:scale-105 transition-all shadow-lg uppercase">APPROVE</button>
                                                <button onClick={() => rejectUser(u)} className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all uppercase">REJECT</button>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-[3rem] bg-black/20">
                                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.5em] opacity-50">No_Pending_Sequences</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <GlassCard className="bg-black/60 border-primary/20 shadow-2xl overflow-hidden rounded-[2rem]">
                            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                    <span className="font-mono text-[10px] font-black text-primary uppercase tracking-[0.3em]">System_Buffer_Live</span>
                                </div>
                                <button onClick={() => logger.clearLogs()} className="text-primary/50 hover:text-primary transition-colors font-mono text-[9px] uppercase tracking-widest">Flush_Memory</button>
                            </div>
                            <div className="p-6 h-[600px] overflow-y-auto font-mono text-[11px] custom-scrollbar">
                                {logs.map(log => (
                                    <div key={log.id} className="mb-2 flex gap-4 opacity-80 hover:opacity-100 transition-opacity border-l-2 border-white/5 pl-4 py-1">
                                        <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`font-black uppercase shrink-0 w-12 ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-primary'
                                            }`}>
                                            {log.level}:
                                        </span>
                                        <span className="text-slate-300 break-all">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>

            {showEditor && (
                <BlogPostEditor 
                    post={editingPost}
                    currentUser={currentUser}
                    onSave={() => { setShowEditor(false); handleRefresh(); }}
                    onCancel={() => setShowEditor(false)}
                />
            )}

            {showAddVetPet.show && (
                <AddPatientModal 
                    onClose={() => setShowAddVetPet({ show: false, email: '' })}
                    onSuccess={handleRefresh}
                    vetEmail={showAddVetPet.email}
                />
            )}

            {showAddClinic && (
                <AddClinicModal 
                    onClose={() => setShowAddClinic(false)}
                    onSuccess={handleRefresh}
                />
            )}

            {showAddVet && (
                <AddVetModal 
                    onClose={() => setShowAddVet(false)}
                    onSuccess={handleRefresh}
                />
            )}

            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                .animate-scanline {
                    animation: scanline 8s linear infinite;
                }
            `}</style>
        </div>
    );
};