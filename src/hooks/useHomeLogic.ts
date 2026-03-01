import { useState, useEffect, useRef } from 'react';
import { View, User, Donation } from '../types';
import { dbService } from '../services/firebase';
import { useScrollAnimation } from './useScrollAnimation';

interface UseHomeLogicProps {
    currentUser: User | null;
    setView: (view: View) => void;
    openLogin: () => void;
}

export const useHomeLogic = ({ currentUser, setView, openLogin }: UseHomeLogicProps) => {
    useScrollAnimation();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [shouldLoadHeavyContent, setShouldLoadHeavyContent] = useState(false);
    const featuresRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [stats, setStats] = useState({
        petsProtected: 1200,
        successfulMatches: 847,
        communityMembers: 5600,
        vetPartners: 342,
        activeCities: 23,
        totalDonations: 0,
        responseTime: 12
    });

    // Fetch public stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dbService.getPublicStats();
                setStats(prev => ({
                    ...prev,
                    ...data
                }));
            } catch (error) {
                console.error("Failed to fetch public stats:", error);
            }
        };
        fetchStats();
    }, []);

    // Defer donations subscription until needed
    useEffect(() => {
        if (!shouldLoadHeavyContent) return;
        const unsub = dbService.subscribeToDonations(setDonations);
        return () => unsub();
    }, [shouldLoadHeavyContent]);

    // Use Intersection Observer to defer below-the-fold content
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoadHeavyContent(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '400px' } // Start loading 400px before visible
        );

        if (featuresRef.current) {
            observer.observe(featuresRef.current);
        }

        // Fallback: Load after 2 seconds if user doesn't scroll
        const fallbackTimer = setTimeout(() => setShouldLoadHeavyContent(true), 2000);

        return () => {
            observer.disconnect();
            clearTimeout(fallbackTimer);
        };
    }, []);

    // Sync React state with video element state to prevent desync on external events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVolumeChange = () => setIsMuted(video.muted);
        video.addEventListener('volumechange', handleVolumeChange);
        return () => video.removeEventListener('volumechange', handleVolumeChange);
    }, []);

    // Monitor fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleToggleAudio = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            if (!videoRef.current.muted && videoRef.current.paused) {
                videoRef.current.play().catch(console.error);
            }
        }
    };

    const handleRestart = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
        }
    };

    const handleToggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await videoContainerRef.current?.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    const handleNavigate = (view: View) => {
        if (currentUser) {
            setView(view);
        } else {
            openLogin();
        }
    };

    return {
        stats,
        donations,
        shouldLoadHeavyContent,
        featuresRef,
        videoRef,
        videoContainerRef,
        isMuted,
        setIsMuted,
        isFullscreen,
        handleToggleAudio,
        handleRestart,
        handleToggleFullscreen,
        handleNavigate
    };
};
