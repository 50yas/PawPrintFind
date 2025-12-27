
import React, { useEffect } from 'react';
import { BlogPost } from '../types';
import { dbService } from '../services/firebase';

interface BlogPostDetailProps {
    post: BlogPost;
    onBack: () => void;
}

export const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post, onBack }) => {
    
    // Dynamic SEO Update & View Counter
    useEffect(() => {
        document.title = `${post.seoTitle} | Paw Print`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', post.seoDescription);
        }
        
        // Increment view count
        dbService.incrementBlogPostView(post.id);

        // Reset on unmount
        return () => {
            document.title = "Paw Print | Pet Visual Passport";
        };
    }, [post]);

    return (
        <article className="max-w-4xl mx-auto px-4 py-12 animate-fade-in pb-24">
            <button onClick={onBack} className="text-foreground hover:text-primary font-bold mb-8 flex items-center gap-2 sticky top-24 bg-card/80 backdrop-blur-md rounded-full px-5 py-2.5 w-fit z-50 border border-border shadow-lg transition-all hover:scale-105">
                &larr; Back
            </button>

            {/* Header with Hero Image */}
            <header className="mb-10 text-center relative">
                {post.imageUrl && (
                    <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-2xl relative">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                    </div>
                )}
                
                <div className="relative z-10 -mt-20 px-4">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {post.tags.map(tag => (
                            <span key={tag} className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-primary/30">{tag}</span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight drop-shadow-sm">{post.title}</h1>
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-mono">
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-[10px]">
                                {post.author.charAt(0)}
                            </div>
                            <span className="font-bold">{post.author}</span>
                        </div>
                        <time>{new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="prose prose-lg dark:prose-invert prose-teal mx-auto prose-img:rounded-2xl prose-img:shadow-xl prose-headings:font-extrabold">
                <p className="lead text-xl text-muted-foreground font-medium mb-8 border-l-4 border-primary pl-4">{post.summary}</p>
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Footer */}
            <div className="mt-20 pt-10 border-t border-border text-center">
                <p className="text-muted-foreground text-sm italic mb-6">Found this helpful? Share it with your community.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')} className="btn btn-secondary text-xs px-6">Twitter</button>
                    <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="btn btn-secondary text-xs px-6">Facebook</button>
                </div>
            </div>
        </article>
    );
};
