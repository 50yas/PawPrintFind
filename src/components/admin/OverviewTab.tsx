import React from 'react';
import { motion } from 'framer-motion';
import { User, PetProfile, Donation, BlogPost } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { MetricCard } from '../analytics/MetricCard';
import { ResponsiveLineChart } from '../analytics/ResponsiveLineChart';
import { GlassCard, GlassButton } from '../ui';
import { VersionDisplay } from '../VersionDisplay';
import { SystemHealth } from '../SystemHealth';

interface OverviewTabProps {
  users: User[];
  allPets: PetProfile[];
  donations: Donation[];
  blogPosts: BlogPost[];
  pendingRequestsCount: number; // Use real-time count
  onNavigateToTab: (tab: string) => void;
  onNavigateToBlog: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  users,
  allPets,
  donations,
  blogPosts,
  pendingRequestsCount,
  onNavigateToTab,
  onNavigateToBlog
}) => {
  const { t } = useTranslations();

  // Calculate registration data for chart
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const registrationData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const count = (users || []).filter(u => {
      const created = new Date(u.createdAt || 0);
      return created.toDateString() === d.toDateString();
    }).length;
    return {
      day: days[d.getDay()],
      registrations: count,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Calculate previous week's user count for trend
  const previousWeekUsers = users.filter(u => {
    const created = new Date(u.createdAt || 0);
    const weekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    return created >= twoWeeksAgo && created < weekAgo;
  }).length;

  const newUsersThisWeek = users.filter(u =>
    new Date(u.createdAt || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header with Version */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <span className="text-3xl">📊</span>
            {t('dashboard:admin.overview.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('dashboard:admin.overview.systemHealth')}</p>
        </div>

        {/* Version Display */}
        <GlassCard className="p-4 border-primary/20 bg-black/40">
          <VersionDisplay variant="full" />
        </GlassCard>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard:admin.statTotalUsers')}
          value={users.length}
          previousValue={users.length - newUsersThisWeek}
          icon="👥"
          trend="up"
          colorClass="bg-cyan-500/10 text-cyan-400"
          onClick={() => onNavigateToTab('users')}
        />
        <MetricCard
          title={t('dashboard:admin.statTotalPets')}
          value={allPets.length}
          icon="🐾"
          trend={allPets.filter(p => p.isLost).length > 0 ? 'neutral' : 'up'}
          colorClass="bg-blue-500/10 text-blue-400"
        />
        <MetricCard
          title={t('dashboard:admin.statTotalDonations')}
          value={donations.reduce((a, d) => a + (d.numericValue || 0), 0)}
          prefix="€"
          decimals={0}
          icon="💰"
          trend="up"
          colorClass="bg-amber-500/10 text-amber-400"
        />
        <MetricCard
          title={t('dashboard:admin.statActiveAlerts')}
          value={pendingRequestsCount}
          icon={pendingRequestsCount > 0 ? '🔴' : '✅'}
          trend={pendingRequestsCount > 0 ? 'neutral' : 'up'}
          colorClass={pendingRequestsCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}
          onClick={() => onNavigateToTab('operations')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 border-white/10 bg-black/40 glass-card-enhanced">
          <ResponsiveLineChart
            data={registrationData}
            lines={[{ dataKey: 'registrations', stroke: '#14B8A6', name: t('dashboard:admin.users.registrationTrend'), strokeWidth: 2 }]}
            xAxisKey="day"
            title={t('dashboard:admin.users.registrationTrend')}
            height={250}
            showArea={true}
          />
        </GlassCard>

        <GlassCard className="p-6 border-white/10 bg-black/40 flex flex-col justify-center items-center text-center space-y-4 glass-card-enhanced relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-scan"></div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[8px] font-mono text-primary font-black tracking-[0.2em] uppercase">{t('dashboard:admin.systemStatusOnline')}</span>
              </div>
              <motion.span
                initial={{ scale: 0.9, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black text-white relative z-10 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                {users.length}
              </motion.span>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">{t('dashboard:admin.totalPopulation')}</p>
            <p className="text-[8px] text-slate-500 uppercase font-mono leading-none">
              {users.filter(u => new Date(u.createdAt || 0).toDateString() === new Date().toDateString()).length} {t('dashboard:admin.newSignalsToday')}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions Panel */}
      <GlassCard className="p-6 border-white/10 bg-black/40">
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          {t('dashboard:admin.overview.quickActions')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassButton
            onClick={onNavigateToBlog}
            variant="secondary"
            className="!py-3 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📝</span>
            <span className="text-[10px] font-black">{t('dashboard:admin.quickAction.addBlogPost')}</span>
          </GlassButton>
          <GlassButton
            onClick={() => onNavigateToTab('users')}
            variant="secondary"
            className="!py-3 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">👤</span>
            <span className="text-[10px] font-black">{t('dashboard:admin.quickAction.addUser')}</span>
          </GlassButton>
          <GlassButton
            onClick={() => onNavigateToTab('system')}
            variant="secondary"
            className="!py-3 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📋</span>
            <span className="text-[10px] font-black">{t('dashboard:admin.quickAction.viewLogs')}</span>
          </GlassButton>
          <GlassButton
            onClick={() => onNavigateToTab('system')}
            variant="secondary"
            className="!py-3 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-[10px] font-black">{t('dashboard:admin.quickAction.systemConfig')}</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* System Health */}
      <React.Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}>
        <SystemHealth />
      </React.Suspense>

      {/* Content Intelligence / Trending Blog Posts */}
      <GlassCard className="p-8 border-primary/20 bg-black/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
            <span className="text-xl">📈</span>
            {t('dashboard:admin.contentIntelligence')}
          </h3>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-slate-500 uppercase font-black">{t('dashboard:admin.totalEngagement')}</span>
              <span className="text-xs font-mono text-primary font-bold">{blogPosts.reduce((acc, p) => acc + (p.views || 0), 0)} {t('dashboard:admin.viewsLabel')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3).map((post, i) => (
            <div key={post.id} className="relative group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
              <div className="absolute top-0 right-0 p-3 text-[20px] opacity-10 font-black italic">0{i + 1}</div>
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
  );
};
