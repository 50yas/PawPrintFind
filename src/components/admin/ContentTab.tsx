import React from 'react';
import { BlogPost, User } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { MetricCard } from '../analytics/MetricCard';
import { GlassCard, GlassButton } from '../ui';
import { ResponsiveLineChart } from '../analytics/ResponsiveLineChart';

interface ContentTabProps {
  blogPosts: BlogPost[];
  currentUser: User;
  onEditPost: (post: BlogPost | null) => void;
  onDeletePost: (postId: string) => Promise<void>;
  onViewPost?: (post: BlogPost) => void;
}

export const ContentTab: React.FC<ContentTabProps> = ({
  blogPosts,
  currentUser,
  onEditPost,
  onDeletePost,
  onViewPost
}) => {
  const { t } = useTranslations();

  // Calculate content metrics
  const totalViews = blogPosts.reduce((sum, post) => sum + (post.views || 0), 0);
  const publishedPosts = blogPosts.length; // All fetched posts are published
  const avgViews = publishedPosts > 0 ? Math.round(totalViews / publishedPosts) : 0;

  // Calculate views trend (last 7 days)
  const viewsData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayViews = blogPosts.reduce((sum, post) => {
      // This is simplified - in a real app, you'd track daily views
      return sum + (post.views || 0) / 7; // Distribute views evenly for demo
    }, 0);

    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      views: Math.round(dayViews)
    };
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <span className="text-3xl">📰</span>
            {t('dashboard:admin.content.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('dashboard:admin.blogRepository')}</p>
        </div>
        <GlassButton
          onClick={() => onEditPost(null)}
          variant="primary"
          className="scale-110 shadow-primary/20"
        >
          {t('dashboard:admin.newEntry')}
        </GlassButton>
      </div>

      {/* Content Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={t('dashboard:admin.content.blogPosts')}
          value={publishedPosts}
          icon="📝"
          colorClass="bg-purple-500/10 text-purple-400"
        />
        <MetricCard
          title="Total Views"
          value={totalViews}
          icon="👁️"
          colorClass="bg-cyan-500/10 text-cyan-400"
        />
        <MetricCard
          title="Avg Views/Post"
          value={avgViews}
          icon="📊"
          colorClass="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {/* Content Analytics Chart */}
      <GlassCard className="p-6 border-white/10 bg-black/40">
        <ResponsiveLineChart
          data={viewsData}
          lines={[{ dataKey: 'views', stroke: '#8B5CF6', name: 'Views', strokeWidth: 2 }]}
          xAxisKey="day"
          title={t('dashboard:admin.content.analytics')}
          height={250}
          showArea={true}
        />
      </GlassCard>

      {/* Blog Posts Table */}
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
              {blogPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.2em]">{t('dashboard:admin.content.noBlogPosts')}</p>
                      <GlassButton onClick={() => onEditPost(null)} variant="primary" className="mt-2">
                        {t('dashboard:admin.newEntry')}
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ) : (
                blogPosts.map(p => (
                  <tr key={p.id} className="hud-table-row group">
                    <td className="p-5">
                      <div className="max-w-xs md:max-w-md">
                        <p className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 font-medium mt-1">{p.summary}</p>
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
                        onClick={() => onEditPost(p)}
                        className="px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all font-black text-[9px] tracking-widest border border-primary/20"
                      >
                        {t('dashboard:admin.editButton')}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(t('dashboard:admin.confirmPurgeContent'))) {
                            await onDeletePost(p.id);
                          }
                        }}
                        className="px-3 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] tracking-widest border border-red-500/20"
                      >
                        {t('dashboard:admin.deleteUserButton')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
