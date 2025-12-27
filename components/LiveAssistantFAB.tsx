
import React, { useState, useRef, useEffect } from 'react';
import { LiveAssistant, AssistantTools } from './LiveAssistant';
import { useTranslations } from '../hooks/useTranslations';
import { UserRole } from '../types';
import { useDraggable } from '../hooks/useDraggable';

interface LiveAssistantFABProps {
    currentUserRole?: UserRole | null;
    tools?: AssistantTools;
    forceOpen?: boolean; // Prop to control open state from parent (MobileNav)
    onClose?: () => void;
}

export const LiveAssistantFAB: React.FC<LiveAssistantFABProps> = ({ currentUserRole, tools, forceOpen = false, onClose }) => {
    const { t } = useTranslations();
    const [isOpen, setIsOpen] = useState(forceOpen);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    
    const { position, setPosition, handleMouseDown, isDragging } = useDraggable(chatWindowRef);

    useEffect(() => {
        setIsOpen(forceOpen);
    }, [forceOpen]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen && chatWindowRef.current && !isMobile) {
            const el = chatWindowRef.current;
            const initialX = window.innerWidth - el.offsetWidth - 30;
            const initialY = window.innerHeight - el.offsetHeight - 110;
            // Ensure it doesn't spawn off-screen
            setPosition({ 
                x: Math.max(0, initialX), 
                y: Math.max(0, initialY) 
            });
        }
    }, [isOpen, isMobile, setPosition]);

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    }

    return (
        <>
            <style>{`
                @keyframes float-mascot {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes slide-up-mobile {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .mascot-float {
                    animation: float-mascot 4s ease-in-out infinite;
                }
                .pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid rgba(20, 184, 166, 0.5);
                    transform: translate(-50%, -50%);
                    animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
                .animate-slide-up-mobile {
                    animation: slide-up-mobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {/* Desktop FAB Button (Hidden on mobile if not forcing open, relying on bottom nav) */}
            {!isOpen && !isMobile && (
                <div className="fixed bottom-8 right-8 z-[9999] group no-print">
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-foreground px-3 py-1.5 rounded-xl shadow-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none transform translate-x-2 group-hover:translate-x-0 transition-transform border border-border hidden md:block">
                        {t('askAiButtonLabel')}
                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-t border-r border-border transform rotate-45"></div>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center focus:outline-none transition-transform transform active:scale-95"
                        aria-label={t('liveAssistantTitle')}
                    >
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-pulse"></div>
                        <div className="pulse-ring"></div>
                        
                        <div className="absolute inset-2 bg-gradient-to-br from-primary to-secondary rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-md overflow-hidden flex items-center justify-center bg-card">
                             <div className="absolute inset-0 flex items-center justify-center text-primary/50 p-2">
                                <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-current">
                                    <g transform="translate(0, 20) scale(0.9) translate(28, 0)">
                                        <path d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/>
                                        <path d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/>
                                        <path d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/>
                                        <path d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/>
                                        <path d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/>
                                    </g>
                                </svg>
                             </div>
                             
                             <img 
                                src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" 
                                alt="AI Assistant" 
                                className="w-full h-full object-cover mascot-float scale-90 translate-y-1 relative z-10 transition-opacity duration-300"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                             />
                        </div>

                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm z-20"></div>
                    </button>
                </div>
            )}

            {isOpen && (
                 <div
                    ref={chatWindowRef}
                    className={`fixed bg-background dark:bg-gray-900 shadow-2xl flex flex-col z-[9999] no-print border border-border overflow-hidden
                        ${isMobile 
                            ? 'inset-0 w-full h-[100dvh] rounded-none animate-slide-up-mobile' // Fullscreen on mobile
                            : 'rounded-3xl w-[450px] h-[600px] animate-fade-in'
                        }
                        ${!isMobile && isDragging ? 'transition-none' : 'transition-all duration-300'}
                    `}
                    style={!isMobile ? { 
                        transform: `translate(${position.x}px, ${position.y}px)`, 
                        top: 0, left: 0 
                    } : {}}
                >
                    <div
                        onMouseDown={!isMobile ? handleMouseDown : undefined}
                        className={`p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border flex items-center justify-between select-none ${!isMobile ? 'cursor-move' : ''} pt-safe-top`}
                    >
                        <div className="flex items-center space-x-3 pointer-events-none">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 shadow-md">
                                <div className="w-full h-full bg-card rounded-full overflow-hidden flex items-center justify-center">
                                    <img 
                                        src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" 
                                        alt="AI" 
                                        className="w-full h-full object-cover scale-125 translate-y-1"
                                    />
                                </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-foreground text-sm md:text-base">{t('liveAssistantTitle')}</h3>
                               <p className="text-[10px] text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
                                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                               </p>
                           </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-red-500 hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-hidden relative">
                        <LiveAssistant currentUserRole={currentUserRole} tools={tools} />
                    </div>
                </div>
            )}
        </>
    );
};
    