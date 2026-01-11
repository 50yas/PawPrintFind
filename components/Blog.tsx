
import React, { useEffect, useState } from 'react';
import { BlogPost, View } from '../types';
import { dbService } from '../services/firebase';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage } from './ui/CinematicImage';

interface BlogProps {
    setView: (view: View) => void;
    onSelectPost: (post: BlogPost) => void;
}

export const Blog: React.FC<BlogProps> = ({ setView, onSelectPost }) => {
    const { t, locale } = useTranslations();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            const data = await dbService.getBlogPosts();
            setPosts(data);
            setFilteredPosts(data);
            setIsLoading(false);
        };
        fetchPosts();
    }, []);

    const getLocalizedPost = (post: BlogPost) => {
        if (!post.translations || !locale) return post;
        // Use exact locale match or fallback to base language if locale has region (e.g. en-US -> en)
        const langCode = locale.split('-')[0];
        const localized = post.translations[langCode];
        return localized ? { ...post, ...localized } : post;
    };

    useEffect(() => {
        const lower = searchQuery.toLowerCase();
        setFilteredPosts(posts.filter(p => {
            const localized = getLocalizedPost(p);
            return localized.title.toLowerCase().includes(lower) || 
            localized.summary.toLowerCase().includes(lower) || 
            localized.tags.some(t => t.toLowerCase().includes(lower));
        }));
    }, [searchQuery, posts, locale]);

    const displayPosts = filteredPosts.map(getLocalizedPost);
    const featuredPost = displayPosts[0];
    const otherPosts = displayPosts.slice(1);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <button onClick={() => setView('home')} className="text-primary hover:brightness-125 font-semibold flex items-center gap-2 self-start">
                    &larr; {t('homeButton')}
                </button>
                <div className="relative w-full max-w-md">
                    <input 
                        type="text" 
                        placeholder="Search articles..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input-base pl-10 rounded-full bg-card/80 backdrop-blur-sm border-white/10 shadow-sm"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-4 tracking-tighter">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Paw Print</span> Blog
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Insights, stories, and updates from the future of pet safety.</p>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-64 rounded-3xl bg-muted/30 animate-pulse"></div>
                    ))}
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="space-y-12">
                    {/* Featured Post */}
                    {featuredPost && (
                        <div 
                            onClick={() => onSelectPost(featuredPost)}
                            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-2xl min-h-[400px] flex items-end border border-white/10"
                        >
                            <div className="absolute inset-0 w-full h-full">
                                <CinematicImage priority src={featuredPost.imageUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80'} alt="" className="w-full h-full" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            <div className="relative z-10 p-8 md:p-12 w-full md:w-2/3">
                                <div className="flex gap-2 mb-4">
                                    {featuredPost.tags.slice(0,2).map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-primary/80 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">{tag}</span>
                                    ))}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-primary transition-colors">{featuredPost.title}</h2>
                                <p className="text-gray-300 text-lg mb-6 line-clamp-2">{featuredPost.summary}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
                                    <span>{new Date(featuredPost.publishedAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{featuredPost.views || 0} views</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {otherPosts.map(post => (
                            <div 
                                key={post.id} 
                                onClick={() => onSelectPost(post)}
                                className="bg-card rounded-3xl border border-white/10 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                            >
                                <div className="h-56 relative overflow-hidden">
                                    <CinematicImage src={post.imageUrl || `https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80`} alt="" className="w-full h-full" />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">{post.tags[0] || 'Article'}</span>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold mb-3 text-foreground leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-grow">{post.summary}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border mt-auto font-mono">
                                        <div className="flex items-center gap-2">
                                            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                            {post.views || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🔭</div>
                    <h3 className="text-xl font-bold text-foreground">No posts found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search terms.</p>
                </div>
            )}
        </div>
    );
};
