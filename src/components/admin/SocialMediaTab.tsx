import React, { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { socialPostService } from '../../services/socialPostService';
import { SocialScheduledPost, SocialPlatform, User } from '../../types';
import { format } from 'date-fns';
import { SchedulePostModal } from './SchedulePostModal';

/** localStorage key used to persist the dismissed state of the auto-publish warning banner. */
const SOCIAL_WARNING_DISMISSED_KEY = 'pawprint_social_warning_dismissed';

interface SocialMediaTabProps {
  currentUser?: User;
}

/**
 * Social Media Management Tab
 */
export const SocialMediaTab: React.FC<SocialMediaTabProps> = ({ currentUser }) => {
  const { t } = useTranslations();
  const [posts, setPosts] = useState<SocialScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'scheduled' | 'published' | 'failed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Warning banner: read initial dismissed state from localStorage so it stays dismissed on re-mount
  const [warningDismissed, setWarningDismissed] = useState<boolean>(
    () => localStorage.getItem(SOCIAL_WARNING_DISMISSED_KEY) === 'true'
  );

  const handleDismissWarning = () => {
    localStorage.setItem(SOCIAL_WARNING_DISMISSED_KEY, 'true');
    setWarningDismissed(true);
  };

  // Subscribe to scheduled posts
  useEffect(() => {
    setLoading(true);
    const unsubscribe = socialPostService.subscribeToScheduledPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate stats
  const stats = {
    total: posts.length,
    publishedToday: posts.filter(
      (p) =>
        p.publishedAt &&
        new Date(p.publishedAt).toDateString() === new Date().toDateString()
    ).length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    failed: posts.filter((p) => p.status === 'failed').length
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (selectedPlatform !== 'all' && !post.platforms.includes(selectedPlatform)) {
      return false;
    }
    if (selectedStatus !== 'all' && post.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Platform icons
  const platformIcons: Record<SocialPlatform, string> = {
    twitter: '𝕏',
    facebook: 'f',
    instagram: '📷',
    linkedin: 'in'
  };

  // Platform colors
  const platformColors: Record<SocialPlatform, string> = {
    twitter: 'text-blue-400',
    facebook: 'text-blue-500',
    instagram: 'text-pink-500',
    linkedin: 'text-blue-600'
  };

  // Status colors
  const statusColors = {
    draft: 'text-slate-400',
    scheduled: 'text-yellow-500',
    published: 'text-green-500',
    failed: 'text-red-500'
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t('dashboard:admin.social.confirmDelete'))) return;

    try {
      await socialPostService.deleteScheduledPost(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handlePublishNow = async (postId: string) => {
    if (!confirm(t('dashboard:admin.social.confirmPublish'))) return;

    try {
      await socialPostService.publishPost(postId);
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-publish warning banner — dismissible, persisted via localStorage */}
      {!warningDismissed && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
        >
          <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
          <p className="text-sm leading-relaxed flex-1">
            <strong className="font-bold">Social media auto-publishing is not yet active.</strong>{' '}
            Scheduled posts are saved but will not be published automatically.
            Manual publishing support is coming soon.
          </p>
          <button
            onClick={handleDismissWarning}
            aria-label="Dismiss warning"
            className="flex-shrink-0 text-yellow-400 hover:text-yellow-100 transition-colors text-lg leading-none p-1 -mt-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('dashboard:admin.social.title')}
          </h1>
          <p className="text-slate-400">
            {t('dashboard:admin.social.subtitle')}
          </p>
        </div>
        <GlassButton
          onClick={() => setShowCreateModal(true)}
          className="bg-primary/20 hover:bg-primary/30 text-white"
        >
          <span className="text-xl mr-2">+</span>
          {t('dashboard:admin.social.newPost')}
        </GlassButton>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard:admin.social.stats.total')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="text-4xl">📱</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard:admin.social.stats.publishedToday')}</p>
              <p className="text-3xl font-bold text-green-500 mt-1">{stats.publishedToday}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard:admin.social.stats.scheduled')}</p>
              <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.scheduled}</p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard:admin.social.stats.failed')}</p>
              <p className="text-3xl font-bold text-red-500 mt-1">{stats.failed}</p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{t('dashboard:admin.social.filterPlatform')}:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlatform === 'all'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {t('dashboard:admin.social.allPlatforms')}
              </button>
              {(['twitter', 'facebook', 'instagram', 'linkedin'] as SocialPlatform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPlatform === platform
                      ? `bg-${platform === 'twitter' ? 'blue' : platform === 'facebook' ? 'blue' : platform === 'instagram' ? 'pink' : 'blue'}-500/20 ${platformColors[platform]}`
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {platformIcons[platform]} {t(`dashboard:admin.social.platforms.${platform}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{t('dashboard:admin.social.filterStatus')}:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
              className="px-3 py-1 rounded-lg text-sm bg-white/5 text-white border border-white/10 focus:border-primary/50 focus:outline-none"
            >
              <option value="all">{t('dashboard:admin.social.allStatuses')}</option>
              <option value="draft">{t('dashboard:admin.social.status.draft')}</option>
              <option value="scheduled">{t('dashboard:admin.social.status.scheduled')}</option>
              <option value="published">{t('dashboard:admin.social.status.published')}</option>
              <option value="failed">{t('dashboard:admin.social.status.failed')}</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Posts List */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          {t('dashboard:admin.social.scheduledPosts')}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">{t('dashboard:admin.social.loading')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-400">{t('dashboard:admin.social.noPosts')}</p>
            <p className="text-slate-500 text-sm mt-2">{t('dashboard:admin.social.createFirst')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Platforms */}
                    <div className="flex gap-2 mb-2">
                      {post.platforms.map((platform) => (
                        <span
                          key={platform}
                          className={`text-sm font-medium ${platformColors[platform]}`}
                        >
                          {platformIcons[platform]}
                        </span>
                      ))}
                    </div>

                    {/* Caption Preview */}
                    <p className="text-white mb-2 line-clamp-2">
                      {post.captions[post.platforms[0]] || t('dashboard:admin.social.noCaption')}
                    </p>

                    {/* Meta Info */}
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span className={`font-medium ${statusColors[post.status]}`}>
                        {t(`dashboard:admin.social.status.${post.status}`)}
                      </span>
                      <span>
                        {t('dashboard:admin.social.scheduled')}: {format(new Date(post.scheduledTime), 'MMM dd, yyyy HH:mm')}
                      </span>
                      {post.publishedAt && (
                        <span>
                          {t('dashboard:admin.social.published')}: {format(new Date(post.publishedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {post.errorMessage && (
                      <p className="text-red-500 text-xs mt-2">
                        {t('dashboard:admin.social.error')}: {post.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {post.status !== 'published' && (
                      <GlassButton
                        onClick={() => handlePublishNow(post.id)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-500 text-sm px-3 py-1"
                      >
                        {t('dashboard:admin.social.publishNow')}
                      </GlassButton>
                    )}
                    <GlassButton
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-500 text-sm px-3 py-1"
                    >
                      {t('dashboard:admin.social.delete')}
                    </GlassButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {currentUser && (
        <SchedulePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
