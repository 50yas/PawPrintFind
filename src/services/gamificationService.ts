import { User } from '../types';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: {
        sightingsReported?: number;
        reunionsSupported?: number;
    };
}

export const BADGES: BadgeDefinition[] = [
    {
        id: 'sightings-scout',
        name: 'Sightings Scout',
        description: 'Reported over 5 verified sightings.',
        icon: '🔭',
        criteria: { sightingsReported: 5 }
    },
    {
        id: 'reunion-ranger',
        name: 'Reunion Ranger',
        description: 'Helped reunite a lost pet with their family.',
        icon: '🤝',
        criteria: { reunionsSupported: 1 }
    },
    {
        id: 'neighborhood-hero',
        name: 'Neighborhood Hero',
        description: 'A true guardian of the community.',
        icon: '🦸',
        criteria: { sightingsReported: 20, reunionsSupported: 5 }
    }
];

export const checkBadgeEligibility = (
    user: User, 
    stats: { sightingsReported: number, reunionsSupported: number }
): string[] => {
    const newBadges: string[] = [];

    BADGES.forEach(badge => {
        if (user.badges.includes(badge.name)) return;

        let eligible = false;
        
        // Check "OR" logic for hero, "AND" logic implicit if multiple keys exist (but here we treat them as thresholds)
        // Actually, let's keep it simple: if ANY threshold is met, it counts towards that specific criteria match?
        // No, usually it's AND for all keys present in criteria object.
        // BUT for Neighborhood Hero I said "OR".
        // Let's implement specific logic for Hero or generalized "OR" if needed?
        // Let's stick to the simple implementation first:
        // If criteria has multiple keys, treat as AND.
        // Except for Neighborhood Hero where I might need to adjust definition or logic.
        
        // Wait, my test case said: "Reported > 20 sightings OR supported > 5 reunions" for Hero.
        // My definition above has both keys. 
        // Let's support an explicit logic type if needed, or just hardcode the check for simplicity/flexibility.
        
        if (badge.name === 'Neighborhood Hero') {
             if (stats.sightingsReported > (badge.criteria.sightingsReported || 999) || 
                 stats.reunionsSupported > (badge.criteria.reunionsSupported || 999)) {
                 eligible = true;
             }
        } else {
             // Default AND logic for others
             const meetsSightings = !badge.criteria.sightingsReported || stats.sightingsReported > badge.criteria.sightingsReported;
             const meetsReunions = !badge.criteria.reunionsSupported || stats.reunionsSupported > badge.criteria.reunionsSupported;
             eligible = meetsSightings && meetsReunions;
        }

        if (eligible) {
            newBadges.push(badge.name);
        }
    });

    return newBadges;
};
