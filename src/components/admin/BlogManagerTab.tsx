/**
 * BlogManagerTab
 *
 * Full blog management panel for the Admin > Community > Blog & Content sub-section.
 *
 * Features:
 *  - Stats row (total, published, drafts, views)
 *  - Post list with cover image, metadata, status badge, tags
 *  - Delete (with confirm), "Post to Social" inline panel
 *  - Inline BlogPostEditor (new + edit) via the existing BlogPostEditor component
 *
 * Usage:
 *   <BlogManagerTab currentUser={currentUser} />
 */

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost, SocialPlatform, User } from '../../types';
import { dbService } from '../../services/firebase';
import { socialPostService } from '../../services/socialPostService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useTranslations } from '../../hooks/useTranslations';
import { GlassCard, GlassButton } from '../ui';
import { LoadingSpinner } from '../LoadingSpinner';
import { format } from 'date-fns';

// Lazy-load the BlogPostEditor so its heavy deps (geminiService etc.) are code-split
const BlogPostEditor = React.lazy(() =>
    import('../BlogPostEditor').then(m => ({ default: m.BlogPostEditor }))
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogManagerTabProps {
    currentUser: User;
}

interface SocialSharePanelProps {
    post: BlogPost;
    currentUser: User;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helper: infer whether a post is published or a draft.
// BlogPost has no explicit `status` field — we consider it published if
// it has a publishedAt timestamp > 0 and content is non-empty.
// ---------------------------------------------------------------------------
function getBlogStatus(post: BlogPost): 'published' | 'draft' {
    return post.publishedAt && post.publishedAt > 0 && post.content?.trim()
        ? 'published'
        : 'draft';
}

// ---------------------------------------------------------------------------
// Platform configuration
// ---------------------------------------------------------------------------
const PLATFORMS: { id: SocialPlatform; label: string; icon: string; color: string }[] = [
    { id: 'twitter',   label: 'X (Twitter)', icon: '𝕏',  color: 'text-blue-400'  },
    { id: 'facebook',  label: 'Facebook',    icon: 'f',  color: 'text-blue-500'  },
    { id: 'instagram', label: 'Instagram',   icon: '📷', color: 'text-pink-500'  },
    { id: 'linkedin',  label: 'LinkedIn',    icon: 'in', color: 'text-blue-600'  },
];

// ---------------------------------------------------------------------------
// Sub-component: Social Share Panel
// ---------------------------------------------------------------------------
const SocialSharePanel: React.FC<SocialSharePanelProps> = ({ post, currentUser, onClose }) => {
    const { addSnackbar } = useSnackbar();
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['twitter']);
    const [previewText, setPreviewText] = useState(
        `${post.title}\n\n${post.summary || ''}\n\nhttps://pawprint-50.web.app/blog/${post.slug}`
    );
    const [scheduling, setScheduling] = useState(false);

    const togglePlatform = (p: SocialPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    const handleSchedule = async () => {
        if (selectedPlatforms.length === 0) {
            addSnackbar('Select at least one platform.', 'error');
            return;
        }
        setScheduling(true);
        try {
            const captions: Partial<Record<SocialPlatform, string>> = {};
            selectedPlatforms.forEach(p => { captions[p] = previewText; });

            await socialPostService.createScheduledPost({
                blogPostId: post.id,
                platforms: selectedPlatforms,
                captions,
                images: {},
                scheduledTime: new Date(),
                status: 'scheduled',
                createdBy: currentUser.uid,
                createdAt: new Date(),
            });
            addSnackbar('Post scheduled for social media.', 'success');
            onClose();
        } catch (err: any) {
            addSnackbar('Failed to schedule post: ' + (err?.message ?? 'Unknown error'), 'error');
        } finally {
            setScheduling(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1] }}
            className="mt-3 p-4 bg-slate-900/80 border border-white/10 rounded-xl space-y-4"
            aria-label="Share to social media"
        >
            {/* Platform checkboxes */}
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Platforms
                </p>
                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            aria-pressed={selectedPlatforms.includes(p.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                                selectedPlatforms.includes(p.id)
                                    ? 'bg-primary/20 border-primary/40 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className={p.color}>{p.icon}</span>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Caption preview / edit */}
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Caption Preview
                </p>
                <textarea
                    value={previewText}
                    onChange={e => setPreviewText(e.target.value)}
                    rows={4}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 transition-colors resize-none"
                    aria-label="Caption for social media post"
                />
                <p className="text-xs text-slate-500 mt-1 text-right">
                    {previewText.length} chars
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <GlassButton
                    onClick={handleSchedule}
                    isLoading={scheduling}
                    variant="primary"
                    className="text-sm px-5 py-2"
                >
                    Schedule
                </GlassButton>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Sub-component: Stat Card
// ---------------------------------------------------------------------------
interface StatCardProps {
    icon: string;
    label: string;
    value: number | string;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = 'text-white' }) => (
    <GlassCard className="p-4">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-slate-400 text-sm">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
            <div className="text-4xl" aria-hidden="true">{icon}</div>
        </div>
    </GlassCard>
);

// ---------------------------------------------------------------------------
// Sub-component: Post Card
// ---------------------------------------------------------------------------
interface PostCardProps {
    post: BlogPost;
    currentUser: User;
    onEdit: (post: BlogPost) => void;
    onDeleted: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onEdit, onDeleted }) => {
    const { addSnackbar } = useSnackbar();
    const [showSocial, setShowSocial] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const status = getBlogStatus(post);

    const handleDelete = async () => {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await dbService.deleteBlogPost(post.id);
            addSnackbar('Post deleted.', 'success');
            onDeleted();
        } catch (err: any) {
            addSnackbar('Failed to delete: ' + (err?.message ?? 'Unknown error'), 'error');
            setDeleting(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.05, 0.7, 0.1, 1] }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group"
        >
            <div className="flex gap-0 md:gap-4">
                {/* Cover image */}
                <div className="hidden md:block w-36 shrink-0 relative">
                    {post.imageUrl ? (
                        <img
                            src={post.imageUrl}
                            alt={`Cover for ${post.title}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full min-h-[120px] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-4xl" aria-hidden="true">📝</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 min-w-0">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-white font-bold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
                            {post.title}
                        </h3>
                        <span
                            className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                                status === 'published'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }`}
                        >
                            {status === 'published' ? 'Published' : 'Draft'}
                        </span>
                    </div>

                    {/* Summary */}
                    {post.summary && (
                        <p className="text-slate-400 text-sm line-clamp-2 mb-2 leading-relaxed">
                            {post.summary}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                        {post.publishedAt > 0 && (
                            <span>
                                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                            </span>
                        )}
                        <span>{post.views ?? 0} views</span>
                        {post.author && <span>by {post.author}</span>}
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.tags.slice(0, 6).map(tag => (
                                <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary/80 border border-primary/20 rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                            {post.tags.length > 6 && (
                                <span className="text-xs text-slate-500">
                                    +{post.tags.length - 6} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <GlassButton
                            onClick={() => onEdit(post)}
                            className="bg-white/5 hover:bg-white/10 text-white text-xs px-3 py-1.5"
                        >
                            Edit
                        </GlassButton>
                        <GlassButton
                            onClick={handleDelete}
                            isLoading={deleting}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-3 py-1.5"
                        >
                            Delete
                        </GlassButton>
                        <GlassButton
                            onClick={() => setShowSocial(v => !v)}
                            className={`text-xs px-3 py-1.5 transition-colors ${
                                showSocial
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
                            }`}
                        >
                            <span className="mr-1.5" aria-hidden="true">📡</span>
                            Post to Social
                        </GlassButton>
                    </div>

                    {/* Inline social share panel */}
                    <AnimatePresence>
                        {showSocial && (
                            <SocialSharePanel
                                post={post}
                                currentUser={currentUser}
                                onClose={() => setShowSocial(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * BlogManagerTab
 *
 * Manages blog posts inline within the Admin > Community > Blog & Content sub-section.
 * Loads posts from Firestore via dbService, renders a card list, stats row, and
 * inline BlogPostEditor for creating / editing posts.
 */
export const BlogManagerTab: React.FC<BlogManagerTabProps> = ({ currentUser }) => {
    const { addSnackbar } = useSnackbar();
    const { t } = useTranslations();

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<BlogPost | null | undefined>(undefined);
    // undefined = no editor shown; null = new post; BlogPost = edit mode

    // ----- Data loading -----
    const loadPosts = async () => {
        setLoading(true);
        try {
            const fetched = await dbService.getBlogPosts();
            // Sort newest first
            const sorted = [...fetched].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
            setPosts(sorted);
        } catch (err: any) {
            addSnackbar('Failed to load blog posts: ' + (err?.message ?? 'Unknown error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----- Derived stats -----
    const published = posts.filter(p => getBlogStatus(p) === 'published').length;
    const drafts = posts.length - published;
    const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);

    // ----- Editor callbacks -----
    const handleSave = () => {
        setEditingPost(undefined);
        loadPosts();
        addSnackbar('Post saved successfully.', 'success');
    };

    const handleCancel = () => {
        setEditingPost(undefined);
    };

    // ----- Empty state -----
    const EmptyBlogState = () => (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 px-6"
        >
            <div className="text-6xl mb-4" aria-hidden="true">📝</div>
            <h3 className="text-white font-bold text-xl mb-2">No blog posts yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                Create your first post to share updates, tips, and stories with the community.
            </p>
            <GlassButton
                onClick={() => setEditingPost(null)}
                variant="primary"
                className="mx-auto px-8 py-3 text-sm font-bold"
            >
                <span className="mr-2" aria-hidden="true">+</span>
                Create Your First Post
            </GlassButton>
        </motion.div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ----------------------------------------------------------------
                Inline editor section
                BlogPostEditor renders with position:fixed internally.
                We wrap it in a transform container so its fixed positioning
                is scoped to this ancestor (CSS containing block trick).
            ---------------------------------------------------------------- */}
            <AnimatePresence>
                {editingPost !== undefined && (
                    <motion.div
                        key="blog-editor"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: [0.05, 0.7, 0.1, 1] }}
                        className="rounded-2xl overflow-hidden border border-primary/20 bg-slate-950/50"
                        // This transform creates a new containing block, so the
                        // BlogPostEditor's internal `position:fixed` stays within this div.
                        style={{ transform: 'translateZ(0)', position: 'relative' }}
                    >
                        <Suspense fallback={
                            <div className="flex items-center justify-center py-16">
                                <LoadingSpinner />
                            </div>
                        }>
                            <BlogPostEditor
                                post={editingPost}
                                currentUser={currentUser}
                                onSave={handleSave}
                                onCancel={handleCancel}
                            />
                        </Suspense>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Blog & Content</h1>
                    <p className="text-slate-400 text-sm">
                        Manage blog posts and publish to social media
                    </p>
                </div>
                {editingPost === undefined && (
                    <GlassButton
                        onClick={() => setEditingPost(null)}
                        className="bg-primary/20 hover:bg-primary/30 text-white shrink-0"
                    >
                        <span className="text-xl mr-2" aria-hidden="true">+</span>
                        New Post
                    </GlassButton>
                )}
                {editingPost !== undefined && (
                    <GlassButton
                        onClick={handleCancel}
                        className="bg-white/5 hover:bg-white/10 text-slate-400 shrink-0 text-sm"
                    >
                        Discard
                    </GlassButton>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="📋" label="Total Posts"  value={posts.length} />
                <StatCard icon="✅" label="Published"    value={published}     color="text-green-400" />
                <StatCard icon="📄" label="Drafts"       value={drafts}        color="text-slate-300" />
                <StatCard icon="👁️"  label="Total Views"  value={totalViews}    color="text-primary" />
            </div>

            {/* Posts list */}
            <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">All Posts</h2>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <LoadingSpinner />
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyBlogState />
                ) : (
                    <motion.div layout className="space-y-3">
                        <AnimatePresence initial={false}>
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUser={currentUser}
                                    onEdit={p => {
                                        setEditingPost(p);
                                        // Scroll the editor into view
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    onDeleted={loadPosts}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </GlassCard>
        </div>
    );
};
