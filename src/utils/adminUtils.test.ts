
import { describe, it, expect } from 'vitest';
import { calculateGrowth } from './adminUtils';

describe('adminUtils - calculateGrowth', () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

    it('correctly counts items from the last week', () => {
        const mockItems = [
            { joinedAt: now },
            { joinedAt: twoDaysAgo },
            { joinedAt: tenDaysAgo }
        ];

        const metrics = calculateGrowth(mockItems);
        expect(metrics.total).toBe(3);
        expect(metrics.newLastWeek).toBe(2);
        expect(metrics.velocity).toBe(0.29); // 2 / 7
    });

    it('handles items with createdAt field', () => {
        const mockItems = [
            { createdAt: now },
            { createdAt: twoDaysAgo }
        ];

        const metrics = calculateGrowth(mockItems);
        expect(metrics.newLastWeek).toBe(2);
    });

    it('returns zero for empty list', () => {
        const metrics = calculateGrowth([]);
        expect(metrics.total).toBe(0);
        expect(metrics.newLastWeek).toBe(0);
        expect(metrics.velocity).toBe(0);
    });
});
