
import React, { useState } from 'react';

interface CinematicImageProps {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
    srcset?: string; // For responsive images: "image-320w.jpg 320w, image-640w.jpg 640w"
    sizes?: string;  // For viewport-based selection: "(max-width: 640px) 100vw, 640px"
    fetchPriority?: 'high' | 'low' | 'auto'; // Hint for browser resource priority
}

export const CinematicImage: React.FC<CinematicImageProps> = ({
    src,
    alt,
    className = "",
    priority = false,
    srcset,
    sizes,
    fetchPriority = 'auto'
}) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Skeleton / Shimmer Loader */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <img
                src={src}
                srcSet={srcset}
                sizes={sizes}
                alt={alt}
                className={`w-full h-full object-cover transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'}`}
                onLoad={() => setIsLoaded(true)}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={fetchPriority}
            />

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
