import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PetProfile, VetClinic, LogEntry, Donation, BlogPost, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { logger } from '../services/loggerService';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { GlassCard, GlassButton } from './ui';
import { SearchOptimizationDashboard } from './SearchOptimizationDashboard';
import { TranslationHealthDashboard } from './TranslationHealthDashboard';
import { SocialDiscoveryDashboard } from './SocialDiscoveryDashboard';
import { AdminPetEditorModal } from './AdminPetEditorModal';
import { AIUsageTable } from './AIUsageTable';
import { AdminVetVerificationHUD } from './AdminVetVerificationHUD';
import { AdminNotificationSettings } from './AdminNotificationSettings';

// Lazy load complex sub-components
const BlogPostEditor = React.lazy(() => import('./BlogPostEditor').then(m => ({ default: m.BlogPostEditor })));
const AddPatientModal = React.lazy(() => import('./AddPatientModal').then(m => ({ default: m.AddPatientModal })));
const AddClinicModal = React.lazy(() => import('./AddClinicModal').then(m => ({ default: m.AddClinicModal })));
const AddVetModal = React.lazy(() => import('./AddVetModal').then(m => ({ default: m.AddVetModal })));

// Lazy load tab components
const OverviewTab = React.lazy(() => import('./admin/OverviewTab').then(m => ({ default: m.OverviewTab })));
const UsersTab = React.lazy(() => import('./admin/UsersTab').then(m => ({ default: m.UsersTab })));
const ContentTab = React.lazy(() => import('./admin/ContentTab').then(m => ({ default: m.ContentTab })));
const AISystemsTab = React.lazy(() => import('./admin/AISystemsTab').then(m => ({ default: m.AISystemsTab })));
const SettingsTab = React.lazy(() => import('./admin/SettingsTab').then(m => ({ default: m.SettingsTab })));
const SocialMediaTab = React.lazy(() => import('./admin/SocialMediaTab').then(m => ({ default: m.SocialMediaTab })));

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
    onBrowseSite?: () => void;
    onViewPet: (pet: PetProfile) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, currentUser, allPets, vetClinics, donations, onDeleteUser, onLogout, onRefresh, onViewPost, onBrowseSite, onViewPet }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();

    // Simplified tab system: 5 main tabs + legacy tabs for backward compatibility
    type AdminTab = 'overview' | 'users' | 'content' | 'ai' | 'settings' |
                    'clinics' | 'pets' | 'blog' | 'donations' | 'verification' |
                    'logs' | 'optimization' | 'i18n' | 'social' | 'gamification' | 'config' | 'usage' | 'notifications';
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [allDonations, setAllDonations] = useState<Donation[]>(donations);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [showAddVetPet, setShowAddVetPet] = useState<{ show: boolean, email: string }>({ show: false, email: '' });
    const [showAddClinic, setShowAddClinic] = useState(false);
    const [showAddVet, setShowAddVet] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [petSearch, setPetSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [petStatusFilter, setPetStatusFilter] = useState<'all' | 'lost' | 'forAdoption' | 'owned'>('all');

    const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
    const [showEditPet, setShowEditPet] = useState(false);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['operations', 'community', 'system']);

    const [systemConfig, setSystemConfig] = useState({
        maintenanceMode: false,
        primaryAIModel: 'gemini-2.0-flash'
    });

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => 
            prev.includes(groupId) 
                ? prev.filter(g => g !== groupId) 
                : [...prev, groupId]
        );
    };

    const handleUpdatePet = async (pet: PetProfile) => {
        setIsRefreshing(true);
        try {
            await dbService.savePet(pet);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'UPDATE_PET',
                targetId: pet.id,
                details: `Admin override update for pet: ${pet.name}`
            });
            addSnackbar(t('dashboard:admin.petUpdated'), 'success');
            await onRefresh();
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    const handleUpdateConfig = async (newConfig: any) => {
        setSystemConfig(newConfig);
        addSnackbar(t('dashboard:admin.configUpdated'), 'success');
        // Logic to persist config to Firestore would go here
    };

    useEffect(() => {
        const unsubDonations = dbService.subscribeToDonations(setAllDonations, undefined, true);
        return () => unsubDonations();
    }, []);

    const handleDeleteDonation = async (id: string) => {
        if (!confirm(t('dashboard:admin.confirmPurgeDonation'))) return;
        setIsRefreshing(true);
        try {
            await dbService.deleteDonation(id);
            await dbService.logAdminAction({
                adminEmail: currentUser.email,
                action: 'DELETE_DONATION',
                targetId: id,
                details: `Purged donation record: ${id}`
            });
            addSnackbar(t('dashboard:admin.donationPurged'), 'success');
        } catch (e: any) { addSnackbar(e.message, 'error'); }
        setIsRefreshing(false);
    };

    useEffect(() => {
        dbService.logAdminAction({
            adminEmail: currentUser.email,
            action: 'SESSION_START',
            targetId: currentUser.uid,
            details: 'Admin Command Center initialized'
        });
        // Remove direct getBlogPosts here as it's handled by the tab-aware effect
        return logger.subscribe(setLogs);
    }, []);

    const pendingVerifications = useMemo(() => {
        return users.filter(u => ((u.roles || []).includes('vet') || (u.roles || []).includes('shelter')) && !u.isVerified && u.verificationData);
    }, [users]);

    // Main 5-tab navigation (new structure)
    const mainTabs = useMemo(() => [
        { id: 'overview', label: t('dashboard:admin.tabs.overview'), icon: '📊' },
        { id: 'users', label: t('dashboard:admin.tabs.users'), icon: '👥' },
        { id: 'content', label: t('dashboard:admin.tabs.content'), icon: '📰' },
        { id: 'ai', label: t('dashboard:admin.tabs.ai'), icon: '🧠' },
        { id: 'settings', label: t('dashboard:admin.tabs.settings'), icon: '⚙️' }
    ], [t]);

    // Legacy groups for backward compatibility (collapsible sections)
    const groups = useMemo(() => [
        {
            id: 'operations',
            label: t('dashboard:admin.categoryOperations'),
            status: pendingVerifications.length > 0 ? 'pending' : 'active',
            tabs: [
                { id: 'pets', label: t('dashboard:admin.tabPetsShort'), fullLabel: t('dashboard:admin.adminTabPets'), icon: '🐾' },
                { id: 'clinics', label: t('dashboard:admin.tabClinicsShort'), fullLabel: t('dashboard:admin.adminTabClinics'), icon: '🏥' },
                { id: 'verification', label: t('dashboard:admin.tabVerifyShort'), fullLabel: t('dashboard:admin.pendingVerificationsTitle'), count: pendingVerifications.length, icon: '🛡️', status: pendingVerifications.length > 0 ? 'pending' : 'active' },
                { id: 'donations', label: t('dashboard:admin.tabDonationsShort'), fullLabel: t('dashboard:admin.adminTabDonations'), icon: '💰' }
            ]
        },
        {
            id: 'community',
            label: t('dashboard:admin.categoryCommunity'),
            tabs: [
                { id: 'gamification', label: t('dashboard:admin.tabGamificationShort'), fullLabel: t('dashboard:admin.adminTabGamification'), icon: '🏆' },
                { id: 'social', label: t('dashboard:admin.tabSocialShort'), fullLabel: t('dashboard:admin.adminTabSocial'), icon: '📡' }
            ]
        },
        {
            id: 'system',
            label: t('dashboard:admin.categorySystem'),
            tabs: [
                { id: 'blog', label: t('dashboard:admin.tabBlogShort'), fullLabel: t('dashboard:admin.adminTabBlog'), icon: '📰' },
                { id: 'i18n', label: t('dashboard:admin.tabI18nShort'), fullLabel: t('dashboard:admin.adminTabI18n'), icon: '🌍' },
                { id: 'notifications', label: t('dashboard:admin.notifyShort'), fullLabel: t('dashboard:admin.notificationCenter'), icon: '🔔' },
                { id: 'usage', label: t('dashboard:admin.tabUsageShort'), fullLabel: t('dashboard:admin.adminTabUsage'), icon: '📊' },
                { id: 'optimization', label: t('dashboard:admin.tabOptimizeShort'), fullLabel: t('dashboard:admin.optimizeTab'), icon: '🎯' },
                { id: 'config', label: t('dashboard:admin.tabConfigShort'), fullLabel: t('dashboard:admin.adminTabConfig'), icon: '⚙️' },
                { id: 'logs', label: t('dashboard:admin.tabLogsShort'), fullLabel: t('dashboard:admin.adminTabLogs'), icon: '📟' }
            ]
        }
    ], [t, pendingVerifications.length]);

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
            // Only fetch if we are on a tab that actually displays blog posts
            const needsBlog = activeTab === 'overview' || activeTab === 'content' || activeTab === 'blog';
            if (!needsBlog) return;

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

    const SidebarItem = ({ tab }: { tab: any }) => (
        <button
            onClick={() => setActiveTab(tab.id as any)}
            title={tab.fullLabel}
            className={`w-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-3 rounded-lg border ${activeTab === tab.id
                ? 'bg-primary/10 text-white border-primary/50 neon-glow-teal'
                : 'bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                }`}
        >
            <span className="text-base relative">
                {tab.icon}
                {tab.status && (
                    <span className={`absolute -top-1 -right-1 hud-status-dot ${
                        tab.status === 'active' ? 'hud-status-dot-active' : 
                        tab.status === 'pending' ? 'hud-status-dot-pending' : 
                        'hud-status-dot-error'
                    }`} />
                )}
            </span>
            <span className={`flex-1 text-left ${sidebarCollapsed ? 'hidden' : 'lg:block'}`}>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">{tab.count}</span>
            )}
        </button>
    );

    return (
        <div data-testid="admin-layout" className="min-h-screen bg-slate-950 text-white transition-colors duration-500 relative flex flex-col md:flex-row overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden text-primary/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)]"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scanline"></div>
            </div>

            {/* SIDEBAR (Desktop) */}
            <aside data-testid="admin-sidebar" className={`hidden md:flex flex-col hud-sidebar hud-grid-bg h-screen sticky top-0 z-50 transition-all duration-500 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="p-6 border-b border-white/5 flex flex-col gap-2 overflow-hidden relative">
                    <button 
                        data-testid="sidebar-toggle"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
                    >
                        {sidebarCollapsed ? '➡️' : '⬅️'}
                    </button>
                    <h1 className={`text-xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] leading-none truncate ${sidebarCollapsed ? 'opacity-0' : ''}`}>
                        {t('dashboard:admin.commandCore').split(' ')[0]} <span className="text-primary">{t('dashboard:admin.commandCore').split(' ')[1]}</span>
                    </h1>
                    <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                        {!sidebarCollapsed && <span className="text-[9px] font-bold text-primary uppercase tracking-widest hidden lg:inline">{t('dashboard:admin.systemRootActive')}</span>}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Main 5 Tabs */}
                    <div className="space-y-2 mb-8">
                        {!sidebarCollapsed && (
                            <div className="px-2 mb-3">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.25em]">{t('dashboard:admin.mainNavigation')}</span>
                            </div>
                        )}
                        {mainTabs.map(tab => (
                            <SidebarItem key={tab.id} tab={{ ...tab, fullLabel: tab.label }} />
                        ))}
                    </div>

                    {/* Legacy Groups (Collapsible) */}
                    {!sidebarCollapsed && (
                        <div className="px-2 mb-3 pt-4 border-t border-white/5">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.25em]">{t('dashboard:admin.advanced')}</span>
                        </div>
                    )}
                    {groups.map(group => (
                        <div key={group.id} className="space-y-2">
                            {!sidebarCollapsed && (
                                <button 
                                    onClick={() => toggleGroup(group.id)}
                                    aria-expanded={expandedGroups.includes(group.id)}
                                    className="w-full flex items-center justify-between px-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        {group.status && (
                                            <span className={`hud-status-dot ${
                                                group.status === 'active' ? 'hud-status-dot-active' : 
                                                group.status === 'pending' ? 'hud-status-dot-pending' : 
                                                'hud-status-dot-error'
                                            }`} />
                                        )}
                                        <span>{group.label}</span>
                                    </div>
                                    <span className={`transition-transform duration-300 ${expandedGroups.includes(group.id) ? 'rotate-180' : ''}`}>▾</span>
                                </button>
                            )}
                            <AnimatePresence initial={false}>
                                {(expandedGroups.includes(group.id) || sidebarCollapsed) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-1 overflow-hidden"
                                    >
                                        {group.tabs.map(tab => <SidebarItem key={tab.id} tab={tab} />)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-3 bg-black/20 overflow-hidden">
                    {!sidebarCollapsed && (
                        <>
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono hidden lg:flex">
                                <span>{t('statTotalUsers')}</span>
                                <span className="text-white">{users.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono hidden lg:flex">
                                <span>{t('dashboard:admin.uptime')}</span>
                                <span className="text-white">99.99%</span>
                            </div>
                        </>
                    )}
                    <GlassButton onClick={handleRefresh} variant="secondary" className="w-full !py-2 !text-[9px]" title={t('dashboard:admin.syncNode')}>
                        {isRefreshing ? <LoadingSpinner /> : <span className={sidebarCollapsed ? 'hidden' : 'lg:inline'}>{t('dashboard:admin.syncNodeShort')}</span>}
                        {sidebarCollapsed && !isRefreshing && '🔄'}
                    </GlassButton>
                    <GlassButton onClick={onLogout} variant="danger" className="w-full !py-2 !text-[9px]" title={t('dashboard:admin.exitSession')}>
                        <span className={sidebarCollapsed ? 'hidden' : 'lg:inline'}>{t('dashboard:admin.exitSessionShort')}</span>
                        {sidebarCollapsed && '🔌'}
                    </GlassButton>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10 transition-all duration-500`}>

                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-[100] w-full px-4 py-4 bg-slate-950/90 backdrop-blur-xl border-b border-primary/20 flex justify-between items-center relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-black tracking-tighter uppercase text-white">
                            CMD <span className="text-primary">CORE</span>
                        </h1>
                        {pendingVerifications.length > 0 && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">{pendingVerifications.length}</span>
                        )}
                    </div>
                    <button onClick={onLogout} className="text-slate-400 hover:text-white" aria-label={t('dashboard:admin.exitSession')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">

                    <h2 className="sr-only">{activeTab}</h2>

                    {/* Persistent Alert Feed */}
                    {pendingVerifications.length > 0 && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('dashboard:admin.urgentProtocol')}</span>
                            <span className="text-[10px] font-bold text-white uppercase">{pendingVerifications.length} {t('dashboard:admin.pendingVerificationsTitle')}</span>
                            <button
                                onClick={() => setActiveTab('verification')}
                                className="ml-2 text-[10px] font-black text-primary hover:underline uppercase"
                            >
                                {t('dashboard:admin.resolveNow')}
                            </button>
                        </div>
                    )}

                    {/* Mobile Horizontal Tabs */}
                    <div className="md:hidden flex gap-3 pb-4 overflow-x-auto scrollbar-hide mb-4">
                        {mainTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as AdminTab)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider whitespace-nowrap rounded-lg border ${activeTab === tab.id
                                    ? 'bg-primary/10 text-white border-primary'
                                    : 'bg-white/5 border-white/10 text-slate-500'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                        {/* Divider */}
                        <div className="w-px bg-white/10 mx-2"></div>
                        {/* Legacy tabs */}
                        {groups.flatMap(g => g.tabs).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as AdminTab)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider whitespace-nowrap rounded-lg border ${activeTab === tab.id
                                    ? 'bg-primary/10 text-white border-primary'
                                    : 'bg-white/5 border-white/10 text-slate-500'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner /></div>}>
                        <div className="animate-fade-in max-w-6xl mx-auto">
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    users={users}
                                    allPets={allPets}
                                    donations={allDonations}
                                    blogPosts={blogPosts}
                                    pendingVerifications={pendingVerifications}
                                    onNavigateToTab={(tab) => setActiveTab(tab as AdminTab)}
                                    onNavigateToBlog={() => { setEditingPost(null); setShowEditor(true); }}
                                />
                            )}

                            {activeTab === 'users' && (
                                <UsersTab users={users} />
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
                                                        <tr key={c.id} className="hud-table-row group">
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
                                                            <tr key={v.uid} className="hud-table-row group">
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
                                                    <tr key={p.id} className="hud-table-row group">
                                                        <td className="p-5">
                                                            <div 
                                                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                                                onPointerDown={() => onViewPet(p)}
                                                            >
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
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm ${p.isLost ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
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
                                                        <td className="p-5 text-right space-x-2">
                                                            <button
                                                                onClick={() => { setEditingPet(p); setShowEditPet(true); }}
                                                                className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                                                            >
                                                                {t('dashboard:admin.editButton')}
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm(t('dashboard:admin.confirmTerminateProfile'))) {
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

                        {activeTab === 'gamification' && (
                            <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
                                <GlassCard className="p-8 border-primary/20 bg-black/40">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">{t('dashboard:admin.adminTabGamification')}</h3>
                                    <div className="grid gap-4">
                                        {users.filter(u => u.points > 0 || u.badges.length > 0).map(u => (
                                            <div key={u.uid} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white">{u.email}</p>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{u.points} XP</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {u.badges.map(b => (
                                                        <span key={b} className="px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-[8px] font-black uppercase">{b}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'config' && (
                            <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
                                <GlassCard className="p-8 border-primary/20 bg-black/40">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">{t('dashboard:admin.adminTabConfig')}</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div>
                                                <p className="font-bold text-white">Maintenance Mode</p>
                                                <p className="text-xs text-slate-500">Lock the platform for updates.</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={systemConfig.maintenanceMode}
                                                onChange={(e) => handleUpdateConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
                                                className="w-6 h-6 accent-primary"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Primary AI Model</p>
                                            <select
                                                value={systemConfig.primaryAIModel}
                                                onChange={(e) => handleUpdateConfig({ ...systemConfig, primaryAIModel: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary"
                                            >
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
                                                <option value="gemini-2.0-pro">Gemini 2.0 Pro (Intelligent)</option>
                                                <option value="gemini-exp-1206">Gemini Experimental</option>
                                            </select>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'blog' && (<div className="space-y-6">
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
                                                <tr key={p.id} className="hud-table-row group">
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
                                                                if (confirm(t('dashboard:admin.confirmPurgeContent'))) {
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
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <SearchOptimizationDashboard />
                            </div>
                        )}

                        {activeTab === 'i18n' && (
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <TranslationHealthDashboard />
                            </div>
                        )}

                        {activeTab === 'social' && (
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <SocialDiscoveryDashboard />
                            </div>
                        )}

                        {activeTab === 'donations' && (
                            <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('dashboard:admin.adminTabDonations')}</h3>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase font-black">{t('dashboard:admin.totalRevenue')}</p>
                                        <p className="text-xl font-black text-primary">€{allDonations.reduce((acc, d) => acc + (d.numericValue || 0), 0).toFixed(2)}</p>
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
                                                {allDonations.map(d => (
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
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${d.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'
                                                                }`}>
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
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'verification' && (
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <AdminVetVerificationHUD />
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <AdminNotificationSettings />
                            </div>
                        )}

                        {/* New Tab: Content Management */}
                        {activeTab === 'content' && (
                            <ContentTab
                                blogPosts={blogPosts}
                                currentUser={currentUser}
                                onEditPost={(post) => { setEditingPost(post); setShowEditor(true); }}
                                onDeletePost={async (postId) => {
                                    await dbService.deleteBlogPost(postId);
                                    await dbService.logAdminAction({
                                        adminEmail: currentUser.email,
                                        action: 'DELETE_BLOG_POST',
                                        targetId: postId,
                                        details: `Purged blog post: ${postId}`
                                    });
                                    await handleRefresh();
                                }}
                                onViewPost={onViewPost}
                            />
                        )}

                        {/* New Tab: Social Media Management */}
                        {activeTab === 'social' && (
                            <SocialMediaTab />
                        )}

                        {/* New Tab: AI Systems (combines ai, usage) */}
                        {activeTab === 'ai' && (
                            <AISystemsTab />
                        )}

                        {/* New Tab: Settings (combines config, logs) */}
                        {activeTab === 'settings' && (
                            <SettingsTab
                                logs={logs}
                                systemConfig={systemConfig}
                                onUpdateConfig={handleUpdateConfig}
                            />
                        )}

                        {/* Legacy AI tabs (for backward compatibility) */}
                        {activeTab === 'usage' && (
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <AIUsageTable />
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <GlassCard className="bg-black/60 border-primary/20 shadow-2xl overflow-hidden rounded-[2rem] max-w-6xl mx-auto">
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
                </Suspense>
                </div>
            </main>

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

            {showEditPet && editingPet && (
                <AdminPetEditorModal
                    pet={editingPet}
                    currentUser={currentUser}
                    isOpen={showEditPet}
                    onClose={() => setShowEditPet(false)}
                    onUpdate={handleUpdatePet}
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
