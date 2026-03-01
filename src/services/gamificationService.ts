import { User } from '../types';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'sighting' | 'reunion' | 'rider' | 'karma' | 'streak' | 'social' | 'special';
    criteria: {
        sightingsReported?: number;
        reunionsSupported?: number;
        totalKarma?: number;
        patrolKm?: number;
        streakDays?: number;
        communityAlerts?: number;
        groupMissions?: number;
        deliverySightings?: number;
        monowheelKm?: number;
        nightPatrols?: number;
        tier?: string;
    };
    logic?: 'AND' | 'OR';
}

export const BADGES: BadgeDefinition[] = [
    // === SIGHTING BADGES ===
    {
        id: 'first-eyes',
        name: 'First Eyes',
        description: 'Reported your first sighting',
        icon: '👁️',
        category: 'sighting',
        criteria: { sightingsReported: 1 }
    },
    {
        id: 'sightings-scout',
        name: 'Sightings Scout',
        description: 'Reported over 5 verified sightings',
        icon: '🔭',
        category: 'sighting',
        criteria: { sightingsReported: 5 }
    },
    {
        id: 'eagle-eye',
        name: 'Eagle Eye',
        description: '50 verified sightings reported',
        icon: '🦅',
        category: 'sighting',
        criteria: { sightingsReported: 50 }
    },
    {
        id: 'sharp-shooter',
        name: 'Sharp Shooter',
        description: '100 verified sightings reported',
        icon: '🎯',
        category: 'sighting',
        criteria: { sightingsReported: 100 }
    },

    // === REUNION BADGES ===
    {
        id: 'reunion-ranger',
        name: 'Reunion Ranger',
        description: 'Helped reunite a lost pet with their family',
        icon: '🤝',
        category: 'reunion',
        criteria: { reunionsSupported: 1 }
    },
    {
        id: 'homeward-bound',
        name: 'Homeward Bound',
        description: '5 successful pet reunions supported',
        icon: '🏠',
        category: 'reunion',
        criteria: { reunionsSupported: 5 }
    },
    {
        id: 'neighborhood-hero',
        name: 'Neighborhood Hero',
        description: 'A true guardian of the community',
        icon: '🦸',
        category: 'reunion',
        criteria: { sightingsReported: 20, reunionsSupported: 5 },
        logic: 'OR'
    },

    // === RIDER BADGES ===
    {
        id: 'first-patrol',
        name: 'First Patrol',
        description: 'Completed your first patrol',
        icon: '🚴',
        category: 'rider',
        criteria: { patrolKm: 1 }
    },
    {
        id: 'road-warrior',
        name: 'Road Warrior',
        description: '100km total patrol distance',
        icon: '⚡',
        category: 'rider',
        criteria: { patrolKm: 100 }
    },
    {
        id: 'marathon-rider',
        name: 'Marathon Rider',
        description: '500km total patrol distance',
        icon: '🏆',
        category: 'rider',
        criteria: { patrolKm: 500 }
    },
    {
        id: 'delivery-hero',
        name: 'Delivery Hero',
        description: 'Reported 5 sightings while on delivery duty',
        icon: '📦',
        category: 'rider',
        criteria: { deliverySightings: 5 }
    },
    {
        id: 'wheel-king',
        name: 'Wheel King',
        description: 'Monowheel rider with 50km patrol',
        icon: '🎡',
        category: 'rider',
        criteria: { monowheelKm: 50 }
    },
    {
        id: 'night-rider',
        name: 'Night Rider',
        description: 'Completed 10 night patrols (after 8pm)',
        icon: '🌙',
        category: 'rider',
        criteria: { nightPatrols: 10 }
    },

    // === KARMA BADGES ===
    {
        id: 'karma-seed',
        name: 'Karma Seed',
        description: 'Earned your first 100 karma points',
        icon: '🌱',
        category: 'karma',
        criteria: { totalKarma: 100 }
    },
    {
        id: 'karma-tree',
        name: 'Karma Tree',
        description: 'Earned 1,000 karma points',
        icon: '🌳',
        category: 'karma',
        criteria: { totalKarma: 1000 }
    },
    {
        id: 'karma-forest',
        name: 'Karma Forest',
        description: 'Earned 5,000 karma points',
        icon: '🌲',
        category: 'karma',
        criteria: { totalKarma: 5000 }
    },
    {
        id: 'karma-legend',
        name: 'Karma Legend',
        description: 'Reached Legend tier',
        icon: '👑',
        category: 'karma',
        criteria: { tier: 'legend' }
    },

    // === STREAK BADGES ===
    {
        id: 'week-warrior',
        name: 'Week Warrior',
        description: '7-day active streak',
        icon: '🔥',
        category: 'streak',
        criteria: { streakDays: 7 }
    },
    {
        id: 'fortnight-force',
        name: 'Fortnight Force',
        description: '14-day active streak',
        icon: '💪',
        category: 'streak',
        criteria: { streakDays: 14 }
    },
    {
        id: 'month-master',
        name: 'Month Master',
        description: '30-day active streak',
        icon: '🗓️',
        category: 'streak',
        criteria: { streakDays: 30 }
    },

    // === SOCIAL BADGES ===
    {
        id: 'community-voice',
        name: 'Community Voice',
        description: 'Posted 10 community alerts',
        icon: '📢',
        category: 'social',
        criteria: { communityAlerts: 10 }
    },
    {
        id: 'team-player',
        name: 'Team Player',
        description: 'Completed 5 group missions',
        icon: '🤜',
        category: 'social',
        criteria: { groupMissions: 5 }
    },

    // === SPECIAL BADGES (awarded programmatically) ===
    {
        id: 'alpha-tester',
        name: 'Alpha-Tester',
        description: 'Early adopter of PawPrintFind',
        icon: '🧪',
        category: 'special',
        criteria: {}
    },
    {
        id: 'system-root',
        name: 'System-Root',
        description: 'System administrator',
        icon: '🔐',
        category: 'special',
        criteria: {}
    },
];

export interface ExtendedStats {
    sightingsReported: number;
    reunionsSupported: number;
    totalKarma?: number;
    patrolKm?: number;
    streakDays?: number;
    communityAlerts?: number;
    groupMissions?: number;
    deliverySightings?: number;
    monowheelKm?: number;
    nightPatrols?: number;
    tier?: string;
}

export const checkBadgeEligibility = (
    user: User,
    stats: ExtendedStats
): string[] => {
    const newBadges: string[] = [];

    BADGES.forEach(badge => {
        // Skip special badges (awarded programmatically)
        if (badge.category === 'special') return;
        // Skip already earned badges
        if (user.badges.includes(badge.name)) return;

        const criteria = badge.criteria;
        const checks: boolean[] = [];

        if (criteria.sightingsReported !== undefined) {
            checks.push(stats.sightingsReported >= criteria.sightingsReported);
        }
        if (criteria.reunionsSupported !== undefined) {
            checks.push(stats.reunionsSupported >= criteria.reunionsSupported);
        }
        if (criteria.totalKarma !== undefined) {
            checks.push((stats.totalKarma || 0) >= criteria.totalKarma);
        }
        if (criteria.patrolKm !== undefined) {
            checks.push((stats.patrolKm || 0) >= criteria.patrolKm);
        }
        if (criteria.streakDays !== undefined) {
            checks.push((stats.streakDays || 0) >= criteria.streakDays);
        }
        if (criteria.communityAlerts !== undefined) {
            checks.push((stats.communityAlerts || 0) >= criteria.communityAlerts);
        }
        if (criteria.groupMissions !== undefined) {
            checks.push((stats.groupMissions || 0) >= criteria.groupMissions);
        }
        if (criteria.deliverySightings !== undefined) {
            checks.push((stats.deliverySightings || 0) >= criteria.deliverySightings);
        }
        if (criteria.monowheelKm !== undefined) {
            checks.push((stats.monowheelKm || 0) >= criteria.monowheelKm);
        }
        if (criteria.nightPatrols !== undefined) {
            checks.push((stats.nightPatrols || 0) >= criteria.nightPatrols);
        }
        if (criteria.tier !== undefined) {
            checks.push(stats.tier === criteria.tier);
        }

        if (checks.length === 0) return;

        const eligible = badge.logic === 'OR'
            ? checks.some(c => c)
            : checks.every(c => c);

        if (eligible) {
            newBadges.push(badge.name);
        }
    });

    return newBadges;
};

/** Get badge by name */
export const getBadgeByName = (name: string): BadgeDefinition | undefined => {
    return BADGES.find(b => b.name === name);
};

/** Get badges by category */
export const getBadgesByCategory = (category: BadgeDefinition['category']): BadgeDefinition[] => {
    return BADGES.filter(b => b.category === category);
};

/** Get all earned badge definitions for a user */
export const getUserBadgeDefinitions = (user: User): BadgeDefinition[] => {
    return user.badges.map(name => BADGES.find(b => b.name === name)).filter(Boolean) as BadgeDefinition[];
};
