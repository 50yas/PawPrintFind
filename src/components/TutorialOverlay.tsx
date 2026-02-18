
import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './ui/GlassCard';

interface TutorialStep {
    targetId: string;
    titleKey: string;
    descKey: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const STEPS: TutorialStep[] = [
    { targetId: 'home-nav', titleKey: 'tutorial.home.title', descKey: 'tutorial.home.desc', position: 'bottom' },
    { targetId: 'register-btn', titleKey: 'tutorial.register.title', descKey: 'tutorial.register.desc', position: 'bottom' },
    { targetId: 'missing-pets-map', titleKey: 'tutorial.map.title', descKey: 'tutorial.map.desc', position: 'top' },
    { targetId: 'community-nav', titleKey: 'tutorial.community.title', descKey: 'tutorial.community.desc', position: 'top' },
    { targetId: 'emergency-fab', titleKey: 'tutorial.emergency.title', descKey: 'tutorial.emergency.desc', position: 'left' },
];

export const TutorialOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslations();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = STEPS[currentStepIndex];

    useEffect(() => {
        const updateTarget = () => {
            const el = document.getElementById(step.targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found (e.g. mobile view differences), skip or center fallback
                setTargetRect(null); 
            }
        };

        // Delay slightly to allow render/scroll
        const timer = setTimeout(updateTarget, 300);
        window.addEventListener('resize', updateTarget);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateTarget);
        };
    }, [currentStepIndex, step.targetId]);

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handleSkip = () => onClose();

    const popoverRef = React.useRef<HTMLDivElement>(null);

    // Calculate Popover Position with Viewport Clamping
    const getPopoverStyle = () => {
        if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        
        const gap = 20;
        const padding = 20; // Safe distance from screen edges
        const popoverWidth = 320; // Approx max width from CSS class
        const popoverHeight = 250; // Approx height

        let top = 0;
        let left = 0;
        let transform = '';

        // Initial Position Calculation
        switch (step.position) {
            case 'bottom':
                top = targetRect.bottom + gap;
                left = targetRect.left + targetRect.width / 2;
                transform = 'translateX(-50%)';
                break;
            case 'top':
                top = targetRect.top - gap;
                left = targetRect.left + targetRect.width / 2;
                transform = 'translate(-50%, -100%)';
                break;
            case 'left':
                top = targetRect.top + targetRect.height / 2;
                left = targetRect.left - gap;
                transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                top = targetRect.top + targetRect.height / 2;
                left = targetRect.right + gap;
                transform = 'translate(0, -50%)';
                break;
            case 'center':
            default:
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }

        // Viewport Boundary Checks (Simple Clamping)
        // Note: For transform-based centering, the logic is trickier. 
        // We will switch to direct Top/Left calculation without transform for edges if needed,
        // but simpler is to check if we are out of bounds and flip or clamp.
        
        // Vertical Flip Check
        if (step.position === 'top' && top - popoverHeight < 0) {
            top = targetRect.bottom + gap;
            transform = 'translate(-50%, 0)'; // Flip to bottom style
        } else if (step.position === 'bottom' && top + popoverHeight > window.innerHeight) {
            top = targetRect.top - gap;
            transform = 'translate(-50%, -100%)'; // Flip to top style
        }

        // Horizontal Clamping
        // Since we center with translateX(-50%), actual left edge is left - width/2
        const estimatedLeftEdge = left - (popoverWidth / 2);
        const estimatedRightEdge = left + (popoverWidth / 2);

        if (estimatedLeftEdge < padding) {
            left = padding + (popoverWidth / 2); 
        } else if (estimatedRightEdge > window.innerWidth - padding) {
            left = window.innerWidth - padding - (popoverWidth / 2);
        }

        return { top, left, transform };
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Highlight Hole with massive shadow for dimming */}
            {targetRect && (
                <div 
                    className="absolute rounded-xl transition-all duration-500 ease-in-out pointer-events-auto"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0,0,0,0.5) inset',
                        zIndex: 9998
                    }}
                />
            )}

            {/* Popover Card */}
            <div 
                ref={popoverRef}
                className="absolute w-[90%] max-w-sm transition-all duration-500 ease-out pointer-events-auto z-[9999]"
                style={getPopoverStyle()}
            >
                <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                            {t('tutorial.step')} {currentStepIndex + 1} / {STEPS.length}
                        </span>
                        <button onClick={handleSkip} className="text-muted-foreground hover:text-white text-xs font-bold uppercase tracking-wider">
                            {t('tutorial.skip')}
                        </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{t(step.titleKey)}</h3>
                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">{t(step.descKey)}</p>

                    <div className="flex justify-end gap-3">
                        {currentStepIndex > 0 && (
                            <button 
                                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-white transition-colors"
                            >
                                {t('backButton')}
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="btn btn-primary px-6 py-2 text-xs font-bold uppercase tracking-wider shadow-lg"
                        >
                            {currentStepIndex === STEPS.length - 1 ? t('tutorial.finish') : t('nextButton')}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
