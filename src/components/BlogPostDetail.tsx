
import React, { useEffect, useRef } from 'react';
import { BlogPost } from '../types';
import { dbService } from '../services/firebase';
import { useTranslations } from '../hooks/useTranslations';
import { calculateReadingTime } from '../utils/blogUtils';
import { CinematicImage } from './ui/CinematicImage';

interface BlogPostDetailProps {
    post: BlogPost;
    onBack: () => void;
}

export const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post, onBack }) => {
    const { t, locale } = useTranslations();
    const hasIncremented = useRef<string | null>(null);

    const getLocalizedPost = (p: BlogPost) => {
        if (!p.translations || !locale) return p;
        const langCode = locale.split('-')[0];
        const localized = p.translations[langCode];
        return localized ? { ...p, ...localized } : p;
    };

    const displayPost = getLocalizedPost(post);

    useEffect(() => {
        if (post?.id && hasIncremented.current !== post.id) {
            dbService.incrementBlogPostView(post.id);
            hasIncremented.current = post.id;
        }
        window.scrollTo(0, 0);
    }, [post?.id]);

    return (
        <article className="max-w-4xl mx-auto px-4 py-12 animate-fade-in pb-24">
            <button onClick={onBack} className="text-white hover:text-primary font-bold mb-8 flex items-center gap-2 sticky top-24 bg-white/5 backdrop-blur-md rounded-full px-5 py-2.5 w-fit z-50 border border-white/10 shadow-lg transition-all hover:scale-105">
                &larr; Back
            </button>

            {/* Header with Hero Image */}
            <header className="mb-10 text-center relative">
                {displayPost.imageUrl && (
                    <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-2xl relative">
                        <CinematicImage src={displayPost.imageUrl} alt={displayPost.title} className="w-full h-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                    </div>
                )}

                <div className="relative z-10 -mt-20 px-4">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {displayPost.tags.map(tag => (
                            <span key={tag} className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-primary/30">{tag}</span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-sm">{displayPost.title}</h1>
                    <div className="flex items-center justify-center gap-6 text-sm text-slate-400 font-mono">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-[10px]">
                                {displayPost.author.charAt(0)}
                            </div>
                            <span className="font-bold">{displayPost.author}</span>
                        </div>
                        <time>{new Date(displayPost.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                        <span className="hidden sm:block">•</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border border-primary/20">
                            {calculateReadingTime(displayPost.content)} MIN READ
                        </span>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="prose prose-lg prose-invert prose-teal mx-auto prose-img:rounded-2xl prose-img:shadow-xl prose-headings:font-extrabold">
                <p className="lead text-xl text-slate-400 font-medium mb-8 border-l-4 border-primary pl-4">{displayPost.summary}</p>
                <div dangerouslySetInnerHTML={{ __html: displayPost.content }} />
            </div>

            {/* Footer */}
            <div className="mt-20 pt-10 border-t border-white/10 text-center">
                <p className="text-slate-400 text-sm italic mb-6">Found this helpful? Share it with your community.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(displayPost.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')} className="glass-btn text-xs px-6">Twitter</button>
                    <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="glass-btn text-xs px-6">Facebook</button>
                </div>
            </div>
        </article>
    );
};
