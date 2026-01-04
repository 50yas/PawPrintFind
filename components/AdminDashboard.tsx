import React, { useState, useEffect, useMemo } from 'react';
import { User, PetProfile, VetClinic, LogEntry, Donation, BlogPost } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { calculateTotalFromList } from '../services/donationService';
import { logger } from '../services/loggerService';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { BlogPostEditor } from './BlogPostEditor';
import { GlassCard, GlassButton } from './ui';

interface AdminDashboardProps {
    users: User[];
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    onVerifyVet: (email: string) => void;
    onDeleteUser: (uid: string) => void;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, currentUser, allPets, donations, onDeleteUser, onLogout, onRefresh, onVerifyVet }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pets' | 'blog' | 'verification' | 'logs'>('overview');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        return logger.subscribe(setLogs);
    }, []);

    const totalRevenue = useMemo(() => calculateTotalFromList(donations), [donations]);

    const pendingVerifications = useMemo(() => {
        return users.filter(u => (u.roles.includes('vet') || u.roles.includes('shelter')) && !u.isVerified && u.verificationData);
    }, [users]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
            if (activeTab === 'blog') {
                const posts = await dbService.getBlogPosts();
                setBlogPosts(posts);
            }
        } catch (e: any) {
            addSnackbar("Refresh failed: " + e.message, 'error');
        }
        setIsRefreshing(false);
    };

    useEffect(() => {
        if (activeTab === 'blog') {
            dbService.getBlogPosts().then(setBlogPosts).catch(err => {
                console.error("Blog Fetch Error:", err);
                addSnackbar("Access Denied: Blog collection unreachable.", 'error');
            });
        }
    }, [activeTab, isRefreshing]);

    const deleteBlogPost = async (id: string) => {
        if (!confirm('Delete this blog post?')) return;
        setIsRefreshing(true);
        try {
            await dbService.deleteBlogPost(id);
            addSnackbar("Blog post deleted", 'success');
            const updated = await dbService.getBlogPosts();
            setBlogPosts(updated);
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const deletePet = async (petId: string) => {
        if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) return;
        setIsRefreshing(true);
        try {
             await dbService.deletePet(petId);
             await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'DELETE_PET',
                targetId: petId,
                details: `Deleted pet ${petId}`
            });
            addSnackbar("Pet deleted successfully", 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const approveUser = async (user: User) => {
        if (!user.uid) return;
        setIsRefreshing(true);
        try {
            await dbService.saveUser({ uid: user.uid, isVerified: true });

            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'VERIFY_USER',
                targetId: user.uid,
                details: `Verified user ${user.email}`
            });

            addSnackbar(t('userVerifiedSuccess'), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    }

    return (
        <div className="min-h-screen bg-background pb-20 text-foreground transition-colors duration-500">
            {/* HUD HEADER */}
            <div className="sticky top-0 z-[100] w-full px-6 py-4">
                <GlassCard className="flex justify-between items-center px-6 py-3 border-primary/20 shadow-2xl bg-black/40">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse"></div>
                            <span className="relative bg-primary/20 text-primary text-[9px] px-2 py-1 rounded-full font-black border border-primary/30 uppercase tracking-tighter">Admin_Active</span>
                        </div>
                        <h1 className="text-xl font-black tracking-tighter uppercase text-white drop-shadow-md">Command <span className="text-primary">Center</span></h1>
                    </div>
                    <div className="flex gap-3">
                        <GlassButton onClick={handleRefresh} variant="primary" className="!py-2 !px-4 text-[10px]">
                            {isRefreshing ? <LoadingSpinner /> : 'SYNC_NODE'}
                        </GlassButton>
                        <GlassButton onClick={onLogout} variant="danger" className="!py-2 !px-4 text-[10px]">EXIT</GlassButton>
                    </div>
                </GlassCard>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* CYBER TABS */}
                <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'overview', label: t('adminTabOverview'), icon: '📊' },
                        { id: 'users', label: t('adminTabUsers'), icon: '👥' },
                        { id: 'pets', label: t('adminTabPets'), icon: '🐾' },
                        { id: 'blog', label: t('adminTabBlog'), icon: '📰' },
                        { id: 'verification', label: t('pendingVerificationsTitle'), count: pendingVerifications.length, icon: '🛡️' },
                        { id: 'logs', label: t('adminTabLogs') || 'LOGS', icon: '📟' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 rounded-xl border whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(20,184,166,0.4)] scale-105'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse shadow-lg">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <GlassCard className="p-6 border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-colors">
                                <p className="text-[10px] font-bold text-primary uppercase mb-2 tracking-widest opacity-70">Global Revenue</p>
                                <h3 className="text-4xl font-black text-white group-hover:scale-105 transition-transform">{totalRevenue}</h3>
                            </GlassCard>
                            <GlassCard className="p-6 border-white/10 bg-white/5 group hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest opacity-70">Active Identities</p>
                                <h3 className="text-4xl font-black text-white group-hover:scale-105 transition-transform">{users.length}</h3>
                            </GlassCard>
                            <GlassCard className="p-6 border-white/10 bg-white/5 group hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest opacity-70">Secure Profiles</p>
                                <h3 className="text-4xl font-black text-white group-hover:scale-105 transition-transform">{allPets.length}</h3>
                            </GlassCard>
                            <GlassCard className="p-6 border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-colors">
                                <p className="text-[10px] font-bold text-red-500 uppercase mb-2 tracking-widest opacity-70">Active Alerts</p>
                                <h3 className="text-4xl font-black text-red-500 group-hover:scale-105 transition-transform">{allPets.filter(p => p.isLost).length}</h3>
                            </GlassCard>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <GlassCard className="p-8 border-primary/20 bg-black/40">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Security Protocol Status</h4>
                                        <p className="text-xs text-slate-500 font-medium">All systems operational. Biometric encryption active.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Firebase Rules</span>
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-black border border-emerald-500/30">V3_STABLE</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">AI Core (Gemini)</span>
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-black border border-emerald-500/30">2.5_PRO_ONLINE</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Auth Sync</span>
                                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded font-black border border-primary/30 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-8 border-white/10 bg-white/5 flex flex-col justify-center text-center">
                                <div className="max-w-xs mx-auto">
                                    <div className="text-5xl mb-4">🚀</div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Platform Scale</h4>
                                    <p className="text-sm text-slate-400 font-medium mb-6">You are currently managing a network of {users.length} active nodes and {allPets.length} secure profiles.</p>
                                    <GlassButton onClick={handleRefresh} variant="primary" className="w-full">GLOBAL_REFRESH</GlassButton>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                )}

                {/* Data Tables Wrapper */}
                <div className="animate-fade-in">
                    {activeTab === 'users' && (
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
                                        {users.map(u => (
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
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${u.roles.includes('super_admin') ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-primary/20 text-primary border border-primary/30'
                                                            }`}>
                                                            {u.activeRole}
                                                        </span>
                                                        {u.isVerified && <span className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" title="Verified Professional">🛡️</span>}
                                                    </div>
                                                </td>
                                                <td className="p-5 font-mono text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '---'}</td>
                                                <td className="p-5 text-right">
                                                    {!u.roles.includes('super_admin') && (
                                                        <button 
                                                            onClick={() => onDeleteUser(u.uid!)} 
                                                            className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                        >
                                                            PURGE
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}

                    {activeTab === 'pets' && (
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
                                        {allPets.map(p => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors shadow-xl">
                                                            <img src={p.photos[0]?.url} alt={p.name} className="w-full h-full object-cover" />
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
                                                        p.status === 'forAdoption' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
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
                                                        onClick={() => deletePet(p.id)} 
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
                                                <th className="p-5">Timestamp</th>
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
                                                    <td className="p-5 font-mono text-slate-500 tracking-tighter">{new Date(p.publishedAt).toLocaleDateString()}</td>
                                                    <td className="p-5 text-right flex justify-end gap-3 pt-7">
                                                        <button 
                                                            onClick={() => { setEditingPost(p); setShowEditor(true); }}
                                                            className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteBlogPost(p.id)} 
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
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-white/10 shadow-lg">🏥</div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{u.email}</h4>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Clearance: {u.activeRole}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-tighter">SYNCED: {u.verificationData ? new Date(u.verificationData.timestamp).toLocaleString() : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {u.verificationData?.docUrl && (
                                                    <a href={u.verificationData.docUrl} target="_blank" rel="noreferrer" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-white hover:bg-white/10 transition-all uppercase">VIEW_DOCS</a>
                                                )}
                                                <button onClick={() => approveUser(u)} className="px-6 py-2 rounded-xl bg-primary text-black text-[10px] font-black tracking-widest hover:scale-105 transition-all shadow-lg uppercase">APPROVE</button>
                                                <button className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all uppercase">REJECT</button>
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
        </div>
    );
};