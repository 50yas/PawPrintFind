import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { User, PetProfile, VetClinic, LogEntry, Donation, BlogPost, View } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { logger } from '../services/loggerService';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';
import { GlassCard, GlassButton } from './ui';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { VetVerificationRequest } from '../types';

// Lazy load tab components
const OverviewTab = React.lazy(() => import('./admin/OverviewTab').then(m => ({ default: m.OverviewTab })));
const UsersTab = React.lazy(() => import('./admin/UsersTab').then(m => ({ default: m.UsersTab })));
const OperationsTab = React.lazy(() => import('./admin/OperationsTab').then(m => ({ default: m.OperationsTab })));
const FinanceTab = React.lazy(() => import('./admin/FinanceTab').then(m => ({ default: m.FinanceTab })));
const CommunityTab = React.lazy(() => import('./admin/CommunityTab').then(m => ({ default: m.CommunityTab })));
const AISystemsTab = React.lazy(() => import('./admin/AISystemsTab').then(m => ({ default: m.AISystemsTab })));
const SettingsTab = React.lazy(() => import('./admin/SettingsTab').then(m => ({ default: m.SettingsTab })));

// Lazy load non-tab components
const BlogPostEditor = React.lazy(() => import('./BlogPostEditor').then(m => ({ default: m.BlogPostEditor })));
const ContentTab = React.lazy(() => import('./admin/ContentTab').then(m => ({ default: m.ContentTab })));

type AdminTab = 'overview' | 'users' | 'operations' | 'finance' | 'community' | 'ai' | 'system';

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

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [allDonations, setAllDonations] = useState<Donation[]>(donations);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [pendingRequests, setPendingRequests] = useState<VetVerificationRequest[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [systemConfig, setSystemConfig] = useState({
        maintenanceMode: false,
        primaryAIModel: 'gemini-2.0-flash'
    });

    const handleUpdateConfig = async (newConfig: any) => {
        setSystemConfig(newConfig);
        addSnackbar(t('dashboard:admin.configUpdated'), 'success');
    };

    useEffect(() => {
        const unsubDonations = dbService.subscribeToDonations(setAllDonations, undefined, true);
        return () => unsubDonations();
    }, []);

    useEffect(() => {
        if (!['admin', 'super_admin'].includes(currentUser?.activeRole || '')) return;
        const q = query(collection(db, 'vet_verification_requests'), where('status', '==', 'pending'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VetVerificationRequest)));
        }, (error: any) => {
            console.error('[AdminDashboard] pending vet verifications listener error:', error);
        });
        return () => unsubscribe();
    }, [currentUser?.activeRole]);

    useEffect(() => {
        dbService.logAdminAction({
            adminEmail: currentUser.email,
            action: 'SESSION_START',
            targetId: currentUser.uid,
            details: 'Admin Command Center initialized'
        });
        return logger.subscribe(setLogs);
    }, []);

    useEffect(() => {
        if (activeTab !== 'overview') return;
        dbService.getBlogPosts().then(setBlogPosts).catch(() => {});
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

    const tabs = useMemo(() => [
        { id: 'overview' as AdminTab, label: t('dashboard:admin.tabs.overview'), icon: '📊' },
        { id: 'users' as AdminTab, label: t('dashboard:admin.tabs.users'), icon: '👥' },
        {
            id: 'operations' as AdminTab,
            label: 'Operations',
            icon: '🐾',
            count: pendingRequests.length > 0 ? pendingRequests.length : undefined
        },
        { id: 'finance' as AdminTab, label: 'Finance', icon: '💰' },
        { id: 'community' as AdminTab, label: 'Community', icon: '🏆' },
        { id: 'ai' as AdminTab, label: t('dashboard:admin.tabs.ai'), icon: '🧠' },
        { id: 'system' as AdminTab, label: 'System', icon: '⚙️' },
    ], [t, pendingRequests.length]);

    const SidebarItem = ({ tab }: { tab: typeof tabs[0] }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`w-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-3 rounded-lg border ${
                activeTab === tab.id
                    ? 'bg-primary/10 text-white border-primary/50 neon-glow-teal'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5'
            }`}
        >
            <span className="text-base relative shrink-0">
                {tab.icon}
                {tab.id === 'operations' && pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 hud-status-dot hud-status-dot-pending" />
                )}
            </span>
            <span className={`flex-1 text-left ${sidebarCollapsed ? 'hidden' : 'lg:block'}`}>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">{tab.count}</span>
            )}
        </button>
    );

    return (
        <div data-testid="admin-layout" className="h-screen bg-slate-950 text-white transition-colors duration-500 relative flex flex-col md:flex-row overflow-hidden">
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

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {tabs.map(tab => (
                        <SidebarItem key={tab.id} tab={tab} />
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
                        {pendingRequests.length > 0 && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">{pendingRequests.length}</span>
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
                    {pendingRequests.length > 0 && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('dashboard:admin.urgentProtocol')}</span>
                            <span className="text-[10px] font-bold text-white uppercase">{pendingRequests.length} {t('dashboard:admin.pendingVerificationsTitle')}</span>
                            <button
                                onClick={() => setActiveTab('operations')}
                                className="ml-2 text-[10px] font-black text-primary hover:underline uppercase"
                            >
                                {t('dashboard:admin.resolveNow')}
                            </button>
                        </div>
                    )}

                    {/* Mobile Horizontal Tabs */}
                    <div className="md:hidden flex gap-3 pb-4 overflow-x-auto scrollbar-hide mb-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider whitespace-nowrap rounded-lg border flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'bg-primary/10 text-white border-primary'
                                        : 'bg-white/5 border-white/10 text-slate-500'
                                }`}
                            >
                                {tab.icon} {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="bg-red-500 text-white px-1 rounded-full text-[7px]">{tab.count}</span>
                                )}
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
                                    pendingRequestsCount={pendingRequests.length}
                                    onNavigateToTab={(tab) => setActiveTab(tab as AdminTab)}
                                    onNavigateToBlog={() => { setEditingPost(null); setShowEditor(true); }}
                                />
                            )}

                            {activeTab === 'users' && (
                                <UsersTab users={users} />
                            )}

                            {activeTab === 'operations' && (
                                <OperationsTab
                                    allPets={allPets}
                                    vetClinics={vetClinics}
                                    users={users}
                                    currentUser={currentUser}
                                    pendingVerificationCount={pendingRequests.length}
                                    onViewPet={onViewPet}
                                    onRefresh={onRefresh}
                                />
                            )}

                            {activeTab === 'finance' && (
                                <FinanceTab
                                    donations={allDonations}
                                    currentUser={currentUser}
                                    onRefresh={onRefresh}
                                />
                            )}

                            {activeTab === 'community' && (
                                <CommunityTab
                                    users={users}
                                    currentUser={currentUser}
                                />
                            )}

                            {activeTab === 'ai' && (
                                <AISystemsTab />
                            )}

                            {activeTab === 'system' && (
                                <SettingsTab
                                    logs={logs}
                                    systemConfig={systemConfig}
                                    onUpdateConfig={handleUpdateConfig}
                                />
                            )}

                        </div>
                    </Suspense>
                </div>
            </main>

            {/* Blog Post Editor Modal */}
            <Suspense fallback={null}>
                {showEditor && (
                    <BlogPostEditor
                        post={editingPost}
                        currentUser={currentUser}
                        onSave={() => { setShowEditor(false); handleRefresh(); }}
                        onCancel={() => setShowEditor(false)}
                    />
                )}
            </Suspense>

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
