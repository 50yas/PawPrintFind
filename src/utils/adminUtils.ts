
/**
 * Utility for calculating administrative metrics and growth.
 */

export interface GrowthMetrics {
    total: number;
    newLastWeek: number;
    velocity: number; // Percentage change or items per day
}

/**
 * Calculates growth metrics based on a list of items with timestamps.
 * @param items List of objects containing at least a 'joinedAt' or 'createdAt' field.
 * @returns GrowthMetrics object.
 */
export const calculateGrowth = (items: any[]): GrowthMetrics => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const total = items.length;
    const newLastWeek = items.filter(item => {
        const ts = item.joinedAt || item.createdAt || 0;
        return ts >= oneWeekAgo;
    }).length;

    const velocity = Number((newLastWeek / 7).toFixed(2));

    return {
        total,
        newLastWeek,
        velocity
    };
};
