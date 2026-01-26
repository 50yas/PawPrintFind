import React, { useState, useEffect, useMemo } from 'react';
import { User, PetProfile, VetClinic, LogEntry, Donation, BlogPost, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { logger } from '../services/loggerService';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { GlassCard, GlassButton } from './ui';
import { UserManagementTable } from './UserManagementTable';
import { SearchOptimizationDashboard } from './SearchOptimizationDashboard';

// Lazy load complex sub-components
const BlogPostEditor = React.lazy(() => import('./BlogPostEditor').then(m => ({ default: m.BlogPostEditor })));
const SystemHealth = React.lazy(() => import('./SystemHealth').then(m => ({ default: m.SystemHealth })));
const AddPatientModal = React.lazy(() => import('./AddPatientModal').then(m => ({ default: m.AddPatientModal })));
const AddClinicModal = React.lazy(() => import('./AddClinicModal').then(m => ({ default: m.AddClinicModal })));
const AddVetModal = React.lazy(() => import('./AddVetModal').then(m => ({ default: m.AddVetModal })));

interface AdminDashboardProps {
    users: User[];
    currentUser: User;
    allPets: PetProfile[];
    vetClinics: VetClinic[];
    donations: Donation[];
    onDeleteUser: (uid: string) => Promise<void>;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
    onViewPost?: (post: BlogPost) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, currentUser, allPets, vetClinics, donations, onDeleteUser, onLogout, onRefresh, onViewPost }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'clinics' | 'pets' | 'blog' | 'verification' | 'logs' | 'optimization'>('overview');
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
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [petStatusFilter, setPetStatusFilter] = useState<'all' | 'lost' | 'forAdoption' | 'owned'>('all');

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

    const pendingVerifications = useMemo(() => {
        return users.filter(u => ((u.roles || []).includes('vet') || (u.roles || []).includes('shelter')) && !u.isVerified && u.verificationData);
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = 
                u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.activeRole?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.uid.toLowerCase().includes(userSearch.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || (u.roles || []).includes(roleFilter as any);
            const matchesVerification = verificationFilter === 'all' || 
                (verificationFilter === 'verified' && u.isVerified) || 
                (verificationFilter === 'unverified' && !u.isVerified);
            
            return matchesSearch && matchesRole && matchesVerification;
        });
    }, [users, userSearch, roleFilter, verificationFilter]);

    const filteredPets = useMemo(() => {
        return allPets.filter(p => {
            const matchesSearch = 
                p.name.toLowerCase().includes(petSearch.toLowerCase()) ||
                p.breed.toLowerCase().includes(petSearch.toLowerCase()) ||
                p.id.toLowerCase().includes(petSearch.toLowerCase());
            
            const matchesStatus = petStatusFilter === 'all' || p.status === petStatusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [allPets, petSearch, petStatusFilter]);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const posts = await dbService.getBlogPosts();
                setBlogPosts(posts);
            } catch (err) {
                console.error("Blog Fetch Error:", err);
                addSnackbar(t('dashboard:admin.blogAccessDenied'), 'error');
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
            addSnackbar(t('dashboard:admin.nodeSynchronized'), 'success');
        } catch (e: any) {
            addSnackbar(t('dashboard:admin.refreshFailed') + e.message, 'error');
        }
        setIsRefreshing(false);
    };

    const handleDeleteUser = async (uid: string) => {
        if (!confirm(t('dashboard:admin.confirmTerminateIdentity'))) return;
        setIsRefreshing(true);
        try {
            await onDeleteUser(uid);
            addSnackbar(t('dashboard:admin.identityPurged'), 'success');
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

            addSnackbar(t('dashboard:admin.clearanceUpdated'), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const deleteClinic = async (id: string) => {
        if (!confirm(t('dashboard:admin.confirmDismantleClinic'))) return;
        setIsRefreshing(true);
        try {
            await dbService.deleteClinic(id);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'DELETE_CLINIC',
                targetId: id,
                details: `Deleted clinic ${id}`
            });
            addSnackbar(t('dashboard:admin.clinicDismantled'), 'success');
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
            addSnackbar(t('dashboard:admin.approvedCredentials', { email: user.email }), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    }

    const rejectUser = async (user: User) => {
        if (!user.uid) return;
        if (!confirm(t('dashboard:admin.rejectVerificationPrompt', { email: user.email }))) return;
        setIsRefreshing(true);
        try {
            const { verificationData, ...userWithoutVerification } = user;
            await dbService.saveUser({ ...userWithoutVerification, isVerified: false });
            
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'REJECT_VERIFICATION',
                targetId: user.uid,
                details: `Rejected credentials for ${user.email}`
            });
            
            addSnackbar(t('dashboard:admin.verificationRejected'), 'info');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-32 text-foreground transition-colors duration-500 relative">
            {/* Cyber HUD Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden text-primary/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)]"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scanline"></div>
            </div>

            {/* HUD HEADER */}
            <div className="sticky top-0 z-[100] w-full px-4 md:px-6 py-4">
                <GlassCard className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-3 border-primary/30 shadow-[0_0_30px_rgba(20,184,166,0.2)] bg-black/60 backdrop-blur-2xl">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse group-hover:bg-primary/40 transition-all"></div>
                            <div className="relative bg-slate-900 border border-primary/50 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping mr-2"></span>
                                {t('dashboard:admin.systemRootActive')}
                            </div>
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            {t('dashboard:admin.commandCore').split('_')[0]}_<span className="text-primary">{t('dashboard:admin.commandCore').split('_')[1]}</span>
                        </h1>
                    </div>
                    
                    {/* Persistent Alert Feed */}
                    {pendingVerifications.length > 0 && (
                        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('dashboard:admin.urgentProtocol')}:</span>
                            <span className="text-[10px] font-bold text-white uppercase">{pendingVerifications.length} {t('dashboard:admin.pendingVerificationsTitle')}</span>
                            <button 
                                onClick={() => setActiveTab('verification')}
                                className="ml-2 text-[10px] font-black text-primary hover:underline uppercase"
                            >
                                {t('dashboard:admin.resolveNow')}
                            </button>
                        </div>
                    )}
                    
                    {/* System Status Bar - Mini HUD */}
                    <div className="hidden lg:flex items-center gap-8 px-8 py-1 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('dashboard:admin.loadFactor')}</span>
                            <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4,5,6].map(i => <div key={i} className={`w-1.5 h-3 rounded-sm ${i < 5 ? 'bg-primary shadow-[0_0_5px_#14b8a6]' : 'bg-white/10'}`}></div>)}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('statTotalUsers')}</span>
                            <span className="text-xs font-mono text-white font-bold">{users.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('dashboard:admin.uptime')}</span>
                            <span className="text-xs font-mono text-white font-bold tracking-tighter">99.998%</span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto justify-center">
                        <GlassButton onClick={handleRefresh} variant="primary" className="flex-1 md:flex-none !py-2 !px-5 text-[10px] shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                            {isRefreshing ? <LoadingSpinner /> : t('dashboard:admin.syncNode')}
                        </GlassButton>
                        <GlassButton onClick={onLogout} variant="danger" className="flex-1 md:flex-none !py-2 !px-5 text-[10px]">{t('dashboard:admin.exitSession')}</GlassButton>
                    </div>
                </GlassCard>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 relative z-10">
                {/* CYBER TABS */}
                <div className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'overview', label: t('dashboard:admin.adminTabOverview'), icon: '📊' },
                        { id: 'users', label: t('dashboard:admin.adminTabUsers'), icon: '👥' },
                        { id: 'clinics', label: t('dashboard:admin.adminTabClinics'), icon: '🏥' },
                        { id: 'pets', label: t('dashboard:admin.adminTabPets'), icon: '🐾' },
                        { id: 'blog', label: t('dashboard:admin.adminTabBlog'), icon: '📰' },
                        { id: 'optimization', label: t('dashboard:admin.optimizeTab'), icon: '🧠' },
                        { id: 'verification', label: t('dashboard:admin.pendingVerificationsTitle'), count: pendingVerifications.length, icon: '🛡️' },
                        { id: 'logs', label: t('dashboard:admin.adminTabLogs'), icon: '📟' }
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
                        <React.Suspense fallback={<LoadingSpinner />}>
                            <SystemHealth />
                        </React.Suspense>

                        {/* Trending Blog Intelligence */}
                        <GlassCard className="p-8 border-primary/20 bg-black/40 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <span className="text-xl">📈</span>
                                    {t('dashboard:admin.contentIntelligence')}
                                </h4>
                                <div className="flex gap-4 items-center">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] text-slate-500 uppercase font-black">{t('dashboard:admin.totalEngagement')}</span>
                                        <span className="text-xs font-mono text-primary font-bold">{blogPosts.reduce((acc, p) => acc + (p.views || 0), 0)} {t('dashboard:admin.viewsLabel')}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('dashboard:admin.trendingArticles')}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {blogPosts.sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0,3).map((post, i) => (
                                    <div key={post.id} className="relative group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                                        <div className="absolute top-0 right-0 p-3 text-[20px] opacity-10 font-black italic">0{i+1}</div>
                                        <h5 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{post.title}</h5>
                                        <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest">{post.author}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="text-[10px] font-black text-primary">{post.views || 0} {t('dashboard:admin.viewsLabel')}</span>
                                            <span className="text-[8px] font-mono text-slate-600 uppercase">
                                                {i === 0 ? t('dashboard:admin.rankAlpha') : i === 1 ? t('dashboard:admin.rankBeta') : t('dashboard:admin.rankGamma')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {blogPosts.length === 0 && (
                                    <div className="col-span-3 text-center py-10 text-slate-600 font-mono text-xs uppercase tracking-[0.3em]">{t('dashboard:admin.noEngagementData')}</div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* Data Tables Wrapper */}
                <div className="animate-fade-in">
                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-fade-in">
                            <UserManagementTable />
                        </div>
                    )}

                    {activeTab === 'clinics' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col xl:flex-row justify-between items-center px-2 gap-6">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.adminTabClinics')}</h3>
                                <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
                                    <GlassButton onClick={() => setShowAddVet(true)} variant="secondary" className="!py-2 !px-4 text-[10px] border-primary/20 flex-grow md:flex-grow-0">
                                        + {t('dashboard:admin.newVetButton')}
                                    </GlassButton>
                                    <GlassButton onClick={() => setShowAddClinic(true)} variant="primary" className="!py-2 !px-4 text-[10px] flex-grow md:flex-grow-0">
                                        + {t('dashboard:admin.newClinicButton')}
                                    </GlassButton>
                                </div>
                            </div>

                            {/* CLINICS TABLE */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">{t('dashboard:admin.authorizedFacilities')}</p>
                                <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs min-w-[800px]">
                                            <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                                <tr className="border-b border-white/10">
                                                    <th className="p-5">{t('dashboard:admin.clinicNameLabel')}</th>
                                                    <th className="p-5">{t('dashboard:admin.contactTitle')}</th>
                                                    <th className="p-5">{t('dashboard:admin.addressLabel')}</th>
                                                    <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
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
                                                                        <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-tighter">{t('dashboard:admin.verifiedStatus')}</p>
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
                                                                {t('dashboard:admin.dismantleButton')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {vetClinics.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-10">
                                                            <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.3em] opacity-50">{t('dashboard:admin.noVetsFound')}</p>
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
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">{t('dashboard:admin.pendingInfrastructure')}</p>
                                <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs min-w-[800px]">
                                            <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                                <tr className="border-b border-white/10">
                                                    <th className="p-5">{t('dashboard:admin.tableRole')}</th>
                                                    <th className="p-5">{t('dashboard:admin.status')}</th>
                                                    <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
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
                                                                        {v.isVerified ? t('dashboard:admin.verifiedPro') : t('dashboard:admin.pendingVerification')}
                                                                    </span>
                                                                    {hasClinic ? (
                                                                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-bold">{t('dashboard:admin.linkedStatus')}</span>
                                                                    ) : (
                                                                        <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold">{t('dashboard:admin.unlinkedStatus')}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-right space-x-2">
                                                                {!hasClinic && (
                                                                    <button 
                                                                        onClick={() => { setShowAddClinic(true); /* Ideally pre-fill email */ }}
                                                                        className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                                    >
                                                                        {t('dashboard:admin.createClinicAction')}
                                                                    </button>
                                                                )}
                                                                {!v.isVerified && v.verificationData && (
                                                                    <button 
                                                                        onClick={() => setActiveTab('verification')}
                                                                        className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                                    >
                                                                        {t('dashboard:admin.verifyNowAction')}
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
                            <div className="flex flex-col xl:flex-row justify-between items-center px-2 gap-6">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.adminTabPets')}</h3>
                                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full xl:w-auto">
                                    <select 
                                        value={petStatusFilter}
                                        onChange={(e) => setPetStatusFilter(e.target.value as any)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none uppercase tracking-wider flex-grow md:flex-grow-0"
                                    >
                                        <option value="all">{t('dashboard:admin.allStatus')}</option>
                                        <option value="lost">{t('dashboard:admin.statusLost')}</option>
                                        <option value="forAdoption">{t('dashboard:admin.statusAdoption')}</option>
                                        <option value="owned">{t('dashboard:admin.statusOwned')}</option>
                                    </select>
                                    <div className="relative flex-grow md:w-64 min-w-[200px]">
                                        <input 
                                            value={petSearch}
                                            onChange={e => setPetSearch(e.target.value)}
                                            placeholder={t('dashboard:admin.searchPetPlaceholder')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-[10px] font-mono text-white focus:border-primary/50 outline-none transition-all"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-sm">🔍</span>
                                    </div>
                                </div>
                            </div>
                            <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs min-w-[800px]">
                                        <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                            <tr className="border-b border-white/10">
                                                <th className="p-5">{t('dashboard:admin.petNameLabel')}</th>
                                                <th className="p-5">{t('dashboard:admin.status')}</th>
                                                <th className="p-5">{t('dashboard:admin.location')}</th>
                                                <th className="p-5 text-right">{t('dashboard:admin.tableActions')}</th>
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
                                                        p.isLost ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 
                                                        p.status === 'forAdoption' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                    }`}>
                                                        {p.isLost ? t('dashboard:admin.statusLost') : 
                                                         p.status === 'forAdoption' ? t('dashboard:admin.statusAdoption') : 
                                                         t('dashboard:admin.statusOwned')}
                                                    </span>
                                                </td>
                                                <td className="p-5 font-mono text-slate-500 tracking-tighter">
                                                    {p.lastSeenLocation ? `${p.lastSeenLocation.latitude.toFixed(4)}, ${p.lastSeenLocation.longitude.toFixed(4)}` : t('dashboard:admin.orbitalUnknown')}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <button 
                                                        onClick={async () => { 
                                                            if(confirm(t('dashboard:admin.confirmTerminateProfile'))) {
                                                                await dbService.deletePet(p.id);
                                                                await dbService.logAdminAction({
                                                                    adminEmail: currentUser.email,
                                                                    action: 'DELETE_PET',
                                                                    targetId: p.id,
                                                                    details: `Terminated pet profile: ${p.name}`
                                                                });
                                                                await onRefresh(); 
                                                            }
                                                        }}
                                                        className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                    >
                                                        {t('dashboard:admin.terminateButton')}
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
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter drop-shadow-md">{t('dashboard:admin.blogRepository').split(' ')[0]} <span className="text-primary">{t('dashboard:admin.blogRepository').split(' ')[1]}</span></h3>
                                <GlassButton 
                                    onClick={() => { setEditingPost(null); setShowEditor(true); }}
                                    variant="primary"
                                    className="scale-110 shadow-primary/20"
                                >
                                    {t('dashboard:admin.newEntry')}
                                </GlassButton>
                            </div>

                            <GlassCard className="overflow-hidden border-white/10 bg-black/20 rounded-[2rem]">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs min-w-[800px]">
                                        <thead className="bg-white/5 text-slate-400 uppercase font-mono tracking-tighter">
                                            <tr className="border-b border-white/10">
                                                <th className="p-5">{t('dashboard:admin.contentHeader')}</th>
                                                <th className="p-5">{t('dashboard:admin.author')}</th>
                                                <th className="p-5">{t('dashboard:admin.analytics')}</th>
                                                <th className="p-5 text-right">{t('dashboard:admin.actionPool')}</th>
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
                                                            {p.views || 0} {t('dashboard:admin.views')}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right flex justify-end gap-3 pt-7">
                                                        {onViewPost && (
                                                            <button 
                                                                onClick={() => onViewPost(p)}
                                                                className="px-3 py-1 rounded-md bg-white/5 text-white hover:bg-white/10 transition-all font-black text-[9px] tracking-widest border border-white/10"
                                                            >
                                                                {t('dashboard:admin.viewButton')}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => { setEditingPost(p); setShowEditor(true); }}
                                                            className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                        >
                                                            {t('dashboard:admin.editButton')}
                                                        </button>
                                                        <button 
                                                            onClick={async () => { 
                                                                if(confirm(t('dashboard:admin.confirmPurgeContent'))) { 
                                                                    await dbService.deleteBlogPost(p.id); 
                                                                    await dbService.logAdminAction({
                                                                        adminEmail: currentUser.email,
                                                                        action: 'DELETE_BLOG_POST',
                                                                        targetId: p.id,
                                                                        details: `Purged blog post: ${p.title}`
                                                                    });
                                                                    onRefresh(); 
                                                                } 
                                                            }} 
                                                            className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                                                        >
                                                            {t('dashboard:admin.deleteUserButton')}
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

                    {activeTab === 'optimization' && (
                        <div className="animate-fade-in">
                            <SearchOptimizationDashboard />
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="space-y-6">
                            <GlassCard className="bg-primary/10 border-primary/30 p-6 flex items-center gap-6 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl shadow-inner border border-primary/20">🛡️</div>
                                <div>
                                    <h3 className="font-black text-white text-lg uppercase tracking-tighter">{t('dashboard:admin.pendingVerificationsTitle')}</h3>
                                    <p className="text-sm text-primary/80 font-medium">{t('dashboard:admin.pendingVerificationsDesc')}</p>
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
                                                    <a href={u.verificationData.docUrl} target="_blank" rel="noreferrer" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-white hover:bg-white/10 transition-all uppercase">{t('dashboard:admin.viewDocs')}</a>
                                                )}
                                                <button onClick={() => approveUser(u)} className="px-6 py-2 rounded-xl bg-primary text-black text-[10px] font-black tracking-widest hover:scale-105 transition-all shadow-lg uppercase">{t('dashboard:admin.acceptButton')}</button>
                                                <button onClick={() => rejectUser(u)} className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all uppercase">{t('dashboard:admin.declineButton')}</button>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-[3rem] bg-black/20">
                                    <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.5em] opacity-50">{t('dashboard:admin.noPendingSequences')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <GlassCard className="bg-black/60 border-primary/20 shadow-2xl overflow-hidden rounded-[2rem]">
                            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                    <span className="font-mono text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('dashboard:admin.adminTabLogs')}</span>
                                </div>
                                <button onClick={() => logger.clearLogs()} className="text-primary/50 hover:text-primary transition-colors font-mono text-[9px] uppercase tracking-widest">{t('dashboard:admin.flushMemory')}</button>
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
                    adminEmail={currentUser.email}
                />
            )}

            {showAddVet && (
                <AddVetModal 
                    onClose={() => setShowAddVet(false)}
                    onSuccess={handleRefresh}
                    adminEmail={currentUser.email}
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