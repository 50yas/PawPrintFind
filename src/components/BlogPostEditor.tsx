
import React, { useState } from 'react';
import { BlogPost, User } from '../types';
import { aiBridgeService } from '../services/aiBridgeService';
import { dbService } from '../services/firebase';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { GlassCard, GlassButton, CinematicLoader } from './ui';

interface BlogPostEditorProps {
    post?: BlogPost | null;
    currentUser: User;
    onSave: () => void;
    onCancel: () => void;
}

export const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ post, currentUser, onSave, onCancel }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    
    const [title, setTitle] = useState(post?.title || '');
    const [summary, setSummary] = useState(post?.summary || '');
    const [imageUrl, setImageUrl] = useState(post?.imageUrl || '');
    const [content, setContent] = useState(post?.content || '');
    const [topic, setTopic] = useState('');
    const [tags, setTags] = useState<string[]>(post?.tags || []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        if (!topic) {
            addSnackbar("Please enter a topic for AI generation.", 'error');
            return;
        }
        setIsGenerating(true);
        try {
            const result = await aiBridgeService.generateBlogPost(topic);
            setTitle(result.title || '');
            setSummary(result.summary || '');
            setContent(result.content || '');
            setTags(result.tags || []);
            addSnackbar("Content generated successfully!", 'success');
        } catch (error: any) {
            addSnackbar("AI Generation failed: " + error.message, 'error');
        }
        setIsGenerating(false);
    };

    const handleSave = async () => {
        if (!title || !content) {
            addSnackbar("Title and Content are required.", 'error');
            return;
        }
        setIsSaving(true);
        try {
            const newPost: BlogPost = {
                id: post?.id || Date.now().toString(),
                title,
                summary,
                content,
                author: currentUser.email,
                tags,
                slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                publishedAt: post?.publishedAt || Date.now(),
                seoTitle: title, // Simplified for now
                seoDescription: summary,
                views: post?.views || 0,
                imageUrl: imageUrl || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1000&q=80" // Default placeholder
            };
            
            await dbService.saveBlogPost(newPost);
            addSnackbar("Blog post saved successfully.", 'success');
            onSave();
        } catch (error: any) {
            addSnackbar("Failed to save post: " + error.message, 'error');
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-8 bg-slate-900/90 border-white/10 shadow-2xl relative">
                <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">{post ? 'Edit Post' : 'Create New Post'}</h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: AI Tools */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                AI Assistant
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">Enter a topic and let Gemini draft the post for you.</p>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Tips for keeping cats cool in summer..."
                                className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary/50 transition-colors resize-none mb-3"
                            />
                            <GlassButton onClick={handleGenerate} disabled={isGenerating} variant="primary" className="w-full text-xs font-bold">
                                {isGenerating ? <CinematicLoader /> : 'Generate Draft'}
                            </GlassButton>
                        </div>
                    </div>

                    {/* Right Column: Editor */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="post-title" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                            <input
                                id="post-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 transition-colors font-bold text-lg"
                                placeholder="Post Title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="post-summary" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Summary (SEO Description)</label>
                            <textarea
                                id="post-summary"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                rows={2}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 transition-colors text-sm"
                                placeholder="Brief summary..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="post-image-url" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cover Image URL</label>
                            <input
                                id="post-image-url"
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 transition-colors text-sm"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="post-content" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content</label>
                            <textarea
                                id="post-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={12}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 transition-colors font-mono text-sm leading-relaxed"
                                placeholder="Write your post content here..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="post-tags" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tags (comma separated)</label>
                            <input
                                id="post-tags"
                                type="text"
                                value={tags.join(', ')}
                                onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()))}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 transition-colors text-sm"
                                placeholder="cats, summer, health"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <button onClick={onCancel} className="px-6 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <GlassButton onClick={handleSave} disabled={isSaving} variant="primary" className="px-8 py-3 text-sm font-bold">
                                {isSaving ? <CinematicLoader /> : 'Publish Post'}
                            </GlassButton>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
