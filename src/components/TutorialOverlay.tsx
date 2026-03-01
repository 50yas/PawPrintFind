
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './ui/GlassCard';

interface TutorialStep {
    targetId?: string;
    icon: string;
    titleKey: string;
    descKey: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    accentColor?: string;
}

const OWNER_STEPS: TutorialStep[] = [
    { icon: '🐾', titleKey: 'tutorial.owner.welcome.title', descKey: 'tutorial.owner.welcome.desc', position: 'center', accentColor: '#06b6d4' },
    { targetId: 'register-btn', icon: '➕', titleKey: 'tutorial.owner.register.title', descKey: 'tutorial.owner.register.desc', position: 'bottom', accentColor: '#8b5cf6' },
    { targetId: 'missing-pets-map', icon: '🗺️', titleKey: 'tutorial.owner.map.title', descKey: 'tutorial.owner.map.desc', position: 'top', accentColor: '#ef4444' },
    { targetId: 'community-nav', icon: '👥', titleKey: 'tutorial.owner.community.title', descKey: 'tutorial.owner.community.desc', position: 'top', accentColor: '#10b981' },
    { targetId: 'emergency-fab', icon: '🚨', titleKey: 'tutorial.owner.emergency.title', descKey: 'tutorial.owner.emergency.desc', position: 'left', accentColor: '#f59e0b' },
    { icon: '⭐', titleKey: 'tutorial.owner.karma.title', descKey: 'tutorial.owner.karma.desc', position: 'center', accentColor: '#f59e0b' },
    { icon: '🏥', titleKey: 'tutorial.owner.vet.title', descKey: 'tutorial.owner.vet.desc', position: 'center', accentColor: '#06b6d4' },
];

const VET_STEPS: TutorialStep[] = [
    { icon: '🩺', titleKey: 'tutorial.vet.welcome.title', descKey: 'tutorial.vet.welcome.desc', position: 'center', accentColor: '#06b6d4' },
    { icon: '🛡️', titleKey: 'tutorial.vet.verify.title', descKey: 'tutorial.vet.verify.desc', position: 'center', accentColor: '#8b5cf6' },
    { icon: '📅', titleKey: 'tutorial.vet.appointments.title', descKey: 'tutorial.vet.appointments.desc', position: 'center', accentColor: '#10b981' },
    { icon: '🤖', titleKey: 'tutorial.vet.ai.title', descKey: 'tutorial.vet.ai.desc', position: 'center', accentColor: '#f59e0b' },
    { icon: '🏥', titleKey: 'tutorial.vet.clinic.title', descKey: 'tutorial.vet.clinic.desc', position: 'center', accentColor: '#ef4444' },
    { icon: '👑', titleKey: 'tutorial.vet.pro.title', descKey: 'tutorial.vet.pro.desc', position: 'center', accentColor: '#f59e0b' },
];

const SHELTER_STEPS: TutorialStep[] = [
    { icon: '🏠', titleKey: 'tutorial.shelter.welcome.title', descKey: 'tutorial.shelter.welcome.desc', position: 'center', accentColor: '#10b981' },
    { icon: '➕', titleKey: 'tutorial.shelter.register.title', descKey: 'tutorial.shelter.register.desc', position: 'center', accentColor: '#8b5cf6' },
    { icon: '🐕', titleKey: 'tutorial.shelter.adoption.title', descKey: 'tutorial.shelter.adoption.desc', position: 'center', accentColor: '#06b6d4' },
    { icon: '👥', titleKey: 'tutorial.shelter.community.title', descKey: 'tutorial.shelter.community.desc', position: 'center', accentColor: '#f59e0b' },
    { icon: '📊', titleKey: 'tutorial.shelter.stats.title', descKey: 'tutorial.shelter.stats.desc', position: 'center', accentColor: '#ef4444' },
];

const VOLUNTEER_STEPS: TutorialStep[] = [
    { icon: '🤝', titleKey: 'tutorial.volunteer.welcome.title', descKey: 'tutorial.volunteer.welcome.desc', position: 'center', accentColor: '#10b981' },
    { icon: '🚴', titleKey: 'tutorial.volunteer.patrol.title', descKey: 'tutorial.volunteer.patrol.desc', position: 'center', accentColor: '#06b6d4' },
    { icon: '👁️', titleKey: 'tutorial.volunteer.sighting.title', descKey: 'tutorial.volunteer.sighting.desc', position: 'center', accentColor: '#f59e0b' },
    { icon: '⭐', titleKey: 'tutorial.volunteer.karma.title', descKey: 'tutorial.volunteer.karma.desc', position: 'center', accentColor: '#f59e0b' },
    { icon: '🎯', titleKey: 'tutorial.volunteer.missions.title', descKey: 'tutorial.volunteer.missions.desc', position: 'center', accentColor: '#8b5cf6' },
    { icon: '🏆', titleKey: 'tutorial.volunteer.leaderboard.title', descKey: 'tutorial.volunteer.leaderboard.desc', position: 'center', accentColor: '#ef4444' },
];

const ADMIN_STEPS: TutorialStep[] = [
    { icon: '⚡', titleKey: 'tutorial.admin.welcome.title', descKey: 'tutorial.admin.welcome.desc', position: 'center', accentColor: '#06b6d4' },
    { icon: '👥', titleKey: 'tutorial.admin.users.title', descKey: 'tutorial.admin.users.desc', position: 'center', accentColor: '#8b5cf6' },
    { icon: '🐾', titleKey: 'tutorial.admin.operations.title', descKey: 'tutorial.admin.operations.desc', position: 'center', accentColor: '#ef4444' },
    { icon: '💰', titleKey: 'tutorial.admin.finance.title', descKey: 'tutorial.admin.finance.desc', position: 'center', accentColor: '#10b981' },
    { icon: '🧠', titleKey: 'tutorial.admin.ai.title', descKey: 'tutorial.admin.ai.desc', position: 'center', accentColor: '#f59e0b' },
    { icon: '🏆', titleKey: 'tutorial.admin.community.title', descKey: 'tutorial.admin.community.desc', position: 'center', accentColor: '#8b5cf6' },
];

const getStepsByRole = (role?: string): TutorialStep[] => {
    switch (role) {
        case 'vet': return VET_STEPS;
        case 'shelter': return SHELTER_STEPS;
        case 'volunteer': return VOLUNTEER_STEPS;
        case 'super_admin': return ADMIN_STEPS;
        default: return OWNER_STEPS;
    }
};

interface TutorialOverlayProps {
    onClose: () => void;
    userRole?: string;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose, userRole }) => {
    const { t } = useTranslations();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    const STEPS = getStepsByRole(userRole);
    const step = STEPS[currentStepIndex];
    const isLast = currentStepIndex === STEPS.length - 1;
    const accentColor = step.accentColor || '#06b6d4';

    useEffect(() => {
        if (!step.targetId) {
            setTargetRect(null);
            return;
        }
        const updateTarget = () => {
            const el = document.getElementById(step.targetId!);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null);
            }
        };
        const timer = setTimeout(updateTarget, 300);
        window.addEventListener('resize', updateTarget);
        return () => { clearTimeout(timer); window.removeEventListener('resize', updateTarget); };
    }, [currentStepIndex, step.targetId]);

    const handleNext = () => {
        if (isLast) {
            handleClose();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
    };

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 400);
    };

    // Popover positioning
    const getPopoverStyle = (): React.CSSProperties => {
        // On narrow screens always center — targeting elements is unreliable
        const isNarrow = window.innerWidth < 520;
        if (!targetRect || step.position === 'center' || isNarrow) {
            // Offset upward to clear the mobile bottom nav (~80px) + safe area
            return { top: 'calc(50% - 50px)', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        const gap = 16;
        const popoverW = 320;
        const popoverH = 260;
        const pad = 16;
        let top = 0, left = 0, transform = '';

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
        }

        // Flip vertical if out of bounds
        if (step.position === 'top' && top - popoverH < pad) {
            top = targetRect.bottom + gap;
            transform = 'translate(-50%, 0)';
        } else if (step.position === 'bottom' && top + popoverH > window.innerHeight - pad) {
            top = targetRect.top - gap;
            transform = 'translate(-50%, -100%)';
        }

        // Clamp horizontal
        const lEdge = left - popoverW / 2;
        const rEdge = left + popoverW / 2;
        if (lEdge < pad) left = pad + popoverW / 2;
        else if (rEdge > window.innerWidth - pad) left = window.innerWidth - pad - popoverW / 2;

        return { top, left, transform };
    };

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 z-[9999] pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/70 pointer-events-auto" onClick={handleClose} />

                    {/* Spotlight highlight */}
                    {targetRect && (
                        <motion.div
                            className="absolute rounded-xl pointer-events-none"
                            style={{
                                top: targetRect.top - 8,
                                left: targetRect.left - 8,
                                width: targetRect.width + 16,
                                height: targetRect.height + 16,
                                boxShadow: `0 0 0 9999px rgba(0,0,0,0.75), 0 0 30px ${accentColor}60`,
                                border: `2px solid ${accentColor}60`,
                            }}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                        />
                    )}

                    {/* Popover card */}
                    <motion.div
                        className="absolute w-[90%] max-w-sm pointer-events-auto z-[9999]"
                        style={getPopoverStyle()}
                        key={currentStepIndex}
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        <div
                            className="relative rounded-2xl border overflow-hidden"
                            style={{
                                background: 'rgba(15,23,42,0.92)',
                                borderColor: `${accentColor}40`,
                                backdropFilter: 'blur(20px)',
                                boxShadow: `0 0 40px ${accentColor}20, 0 20px 60px rgba(0,0,0,0.5)`,
                            }}
                        >
                            {/* Accent bar */}
                            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{step.icon}</span>
                                        <span
                                            className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                                            style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
                                        >
                                            {currentStepIndex + 1} / {STEPS.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold"
                                        aria-label="Skip tutorial"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <h3 className="text-base font-black text-white mb-2 leading-tight">
                                    {t(step.titleKey)}
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t(step.descKey)}
                                </p>

                                {/* Progress dots */}
                                <div className="flex items-center justify-center gap-1.5 mt-4">
                                    {STEPS.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentStepIndex(i)}
                                            className="rounded-full transition-all duration-300"
                                            style={{
                                                width: i === currentStepIndex ? 16 : 6,
                                                height: 6,
                                                background: i === currentStepIndex ? accentColor : 'rgba(255,255,255,0.2)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Fixed navigation buttons — clear mobile bottom nav (75px) + safe area */}
                    <div
                        className="fixed left-0 right-0 flex items-center justify-center gap-4 pointer-events-auto z-[10000]"
                        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
                    >
                        {/* Prev button */}
                        <motion.button
                            onClick={handlePrev}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                            style={{
                                background: currentStepIndex > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(12px)',
                                opacity: currentStepIndex > 0 ? 1 : 0.3,
                                cursor: currentStepIndex > 0 ? 'pointer' : 'default',
                            }}
                            whileHover={currentStepIndex > 0 ? { scale: 1.1 } : {}}
                            whileTap={currentStepIndex > 0 ? { scale: 0.95 } : {}}
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </motion.button>

                        {/* Main next/finish circle button */}
                        <motion.button
                            onClick={handleNext}
                            className="w-16 h-16 rounded-full flex items-center justify-center font-black text-black shadow-2xl"
                            style={{
                                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                                boxShadow: `0 0 30px ${accentColor}60, 0 8px 25px rgba(0,0,0,0.4)`,
                            }}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            {isLast ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </motion.button>

                        {/* Skip button */}
                        <motion.button
                            onClick={handleClose}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(12px)',
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none text-center">
                                {t('tutorial.skip')}
                            </span>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
