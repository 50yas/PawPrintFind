import React from 'react';
import { getBadgeByName, BadgeDefinition, BADGES } from '../services/gamificationService';

// Category color themes
const CATEGORY_THEME: Record<string, { bg: string; glow: string; border: string; text: string; gradient: string }> = {
    sighting:  { bg: '#0f2233', glow: '#06b6d4', border: '#06b6d480', text: '#67e8f9', gradient: 'from-cyan-500/20 to-blue-600/20' },
    reunion:   { bg: '#0f2018', glow: '#10b981', border: '#10b98180', text: '#6ee7b7', gradient: 'from-emerald-500/20 to-teal-600/20' },
    rider:     { bg: '#1a1018', glow: '#8b5cf6', border: '#8b5cf680', text: '#c4b5fd', gradient: 'from-violet-500/20 to-purple-600/20' },
    karma:     { bg: '#1a1508', glow: '#f59e0b', border: '#f59e0b80', text: '#fcd34d', gradient: 'from-amber-500/20 to-yellow-600/20' },
    streak:    { bg: '#1a0f08', glow: '#f97316', border: '#f9731680', text: '#fdba74', gradient: 'from-orange-500/20 to-red-600/20' },
    social:    { bg: '#0f0f20', glow: '#a855f7', border: '#a855f780', text: '#d8b4fe', gradient: 'from-purple-500/20 to-pink-600/20' },
    special:   { bg: '#12080f', glow: '#ec4899', border: '#ec489980', text: '#f9a8d4', gradient: 'from-pink-500/20 to-rose-600/20' },
};

// Badge shape paths (hexagon, diamond, shield, circle, star, etc.)
const BADGE_SHAPES: Record<string, string> = {
    sighting: 'M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z',   // hexagon
    reunion:  'M50 5 L90 50 L50 95 L10 50 Z',                          // diamond
    rider:    'M50 5 L85 15 L95 50 L85 85 L50 95 L15 85 L5 50 L15 15 Z', // octagon
    karma:    'M50 5 L61 35 L93 35 L68 57 L79 88 L50 70 L21 88 L32 57 L7 35 L39 35 Z', // star
    streak:   'M50 5 L80 20 L95 50 L80 80 L50 95 L20 80 L5 50 L20 20 Z', // octagon
    social:   'M50 5 A45 45 0 1 1 49.999 5 Z',   // circle (approximated)
    special:  'M50 5 L63 27 L88 27 L70 45 L78 70 L50 55 L22 70 L30 45 L12 27 L37 27 Z', // 5-point star
};

interface BadgeCardProps {
    badgeName: string;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
    earned?: boolean;
}

const BadgeSVG: React.FC<{ badge: BadgeDefinition; size: number; earned: boolean }> = ({ badge, size, earned }) => {
    const theme = CATEGORY_THEME[badge.category] || CATEGORY_THEME.special;
    const shapePath = BADGE_SHAPES[badge.category] || BADGE_SHAPES.sighting;
    const opacity = earned ? 1 : 0.35;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity }}
        >
            <defs>
                <filter id={`glow-${badge.id}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation={earned ? "4" : "1"} result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id={`grad-${badge.id}`} cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor={theme.glow} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={theme.bg} stopOpacity="1" />
                </radialGradient>
                <linearGradient id={`border-${badge.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={theme.glow} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={theme.text} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={theme.glow} stopOpacity="0.9" />
                </linearGradient>
            </defs>

            {/* Background shape */}
            <path
                d={shapePath}
                fill={`url(#grad-${badge.id})`}
                stroke={`url(#border-${badge.id})`}
                strokeWidth="2"
                filter={earned ? `url(#glow-${badge.id})` : undefined}
            />

            {/* Shine overlay */}
            {earned && (
                <path
                    d={shapePath}
                    fill="url(#shine)"
                    opacity="0.15"
                />
            )}

            {/* Icon centered */}
            <text
                x="50"
                y="63"
                textAnchor="middle"
                fontSize="34"
                dominantBaseline="middle"
                style={{ fontSize: badge.category === 'special' ? '28px' : '34px' }}
            >
                {badge.icon}
            </text>

            {/* Earned sparkle dots */}
            {earned && (
                <>
                    <circle cx="20" cy="20" r="2" fill={theme.glow} opacity="0.6" />
                    <circle cx="80" cy="20" r="2" fill={theme.glow} opacity="0.6" />
                    <circle cx="15" cy="60" r="1.5" fill={theme.text} opacity="0.5" />
                    <circle cx="85" cy="60" r="1.5" fill={theme.text} opacity="0.5" />
                </>
            )}
        </svg>
    );
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
    badgeName,
    size = 'md',
    showTooltip = true,
    earned = true,
}) => {
    const [hovered, setHovered] = React.useState(false);

    const badge = getBadgeByName(badgeName) || {
        id: badgeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: badgeName,
        description: `Special badge: ${badgeName}`,
        icon: '⭐',
        category: 'special' as const,
        criteria: {},
    };

    const theme = CATEGORY_THEME[badge.category] || CATEGORY_THEME.special;

    const svgSize = { sm: 40, md: 64, lg: 96 }[size];
    const nameSize = { sm: 'text-[8px]', md: 'text-[9px]', lg: 'text-[10px]' }[size];

    return (
        <div
            className="relative inline-flex flex-col items-center gap-1 cursor-default select-none"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Badge SVG */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: hovered && earned ? 'scale(1.12) translateY(-2px)' : 'scale(1)',
                    filter: hovered && earned ? `drop-shadow(0 0 12px ${theme.glow}80)` : undefined,
                }}
            >
                <BadgeSVG badge={badge} size={svgSize} earned={earned} />
            </div>

            {/* Name label */}
            <span
                className={`${nameSize} font-black uppercase tracking-wide text-center leading-tight max-w-[80px] transition-colors duration-200`}
                style={{ color: earned ? theme.text : '#4b5563' }}
            >
                {badge.name}
            </span>

            {/* Tooltip */}
            {showTooltip && hovered && (
                <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    style={{ minWidth: 160 }}
                >
                    <div
                        className="rounded-xl p-3 text-xs text-center shadow-2xl"
                        style={{
                            background: 'rgba(15,23,42,0.95)',
                            border: `1px solid ${theme.border}`,
                            backdropFilter: 'blur(16px)',
                            boxShadow: `0 0 20px ${theme.glow}30`,
                        }}
                    >
                        <div className="text-lg mb-1">{badge.icon}</div>
                        <div className="font-black text-white text-[10px] uppercase tracking-wider mb-1">{badge.name}</div>
                        <div className="text-slate-400 text-[9px] leading-relaxed">{badge.description}</div>
                        <div
                            className="mt-1.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block"
                            style={{ background: `${theme.glow}20`, color: theme.glow, border: `1px solid ${theme.border}` }}
                        >
                            {badge.category}
                        </div>
                        {!earned && (
                            <div className="mt-1 text-[8px] text-slate-500 font-bold uppercase">Not yet earned</div>
                        )}
                    </div>
                    {/* Arrow */}
                    <div className="w-2 h-2 mx-auto" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${theme.border}` }} />
                </div>
            )}
        </div>
    );
};

// Compact inline badge pill (for lists, cards)
export const BadgePill: React.FC<{ badgeName: string; size?: 'xs' | 'sm' }> = ({ badgeName, size = 'sm' }) => {
    const badge = getBadgeByName(badgeName);
    const theme = badge ? CATEGORY_THEME[badge.category] : CATEGORY_THEME.special;
    const icon = badge?.icon || '⭐';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider border ${size === 'xs' ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]'}`}
            style={{
                background: `${theme.glow}15`,
                color: theme.text,
                borderColor: `${theme.glow}40`,
            }}
        >
            <span>{icon}</span>
            <span>{badgeName}</span>
        </span>
    );
};

// Full badge showcase grid
export const BadgeShowcase: React.FC<{ earnedBadges: string[]; showAll?: boolean }> = ({
    earnedBadges,
    showAll = false,
}) => {
    const displayBadges = showAll
        ? BADGES.map(b => ({ badge: b, earned: earnedBadges.includes(b.name) }))
        : earnedBadges.map(name => ({ badge: getBadgeByName(name) || { id: name, name, description: '', icon: '⭐', category: 'special' as const, criteria: {} }, earned: true }));

    if (displayBadges.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-4xl mb-2">🎖️</div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">No badges yet</p>
                <p className="text-slate-600 text-xs mt-1">Complete missions and report sightings to earn badges</p>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {displayBadges.map(({ badge, earned }) => (
                <BadgeCard
                    key={badge.id}
                    badgeName={badge.name}
                    size="md"
                    earned={earned}
                />
            ))}
        </div>
    );
};
