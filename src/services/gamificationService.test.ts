import { describe, it, expect } from 'vitest';
import { checkBadgeEligibility, BadgeDefinition } from './gamificationService';
import { User } from '../types';

describe('GamificationService', () => {
    const baseUser: User = {
        uid: '1',
        email: 'test@test.com',
        roles: ['owner'],
        activeRole: 'owner',
        friends: [],
        friendRequests: [],
        points: 0,
        badges: []
    };

    it('should award Sightings Scout badge for > 5 sightings', () => {
        const stats = { sightingsReported: 6, reunionsSupported: 0 };
        const newBadges = checkBadgeEligibility(baseUser, stats);
        expect(newBadges).toContain('Sightings Scout');
    });

    it('should award Reunion Ranger badge for > 1 reunion', () => {
        const stats = { sightingsReported: 0, reunionsSupported: 2 };
        const newBadges = checkBadgeEligibility(baseUser, stats);
        expect(newBadges).toContain('Reunion Ranger');
    });

    it('should award Neighborhood Hero for high contributions', () => {
        const stats = { sightingsReported: 25, reunionsSupported: 6 };
        const newBadges = checkBadgeEligibility(baseUser, stats);
        expect(newBadges).toContain('Neighborhood Hero');
    });

    it('should not award badge if already owned', () => {
        const userWithBadge = { ...baseUser, badges: ['First Eyes', 'Sightings Scout'] };
        const stats = { sightingsReported: 6, reunionsSupported: 0 };
        const newBadges = checkBadgeEligibility(userWithBadge, stats);
        expect(newBadges).not.toContain('Sightings Scout'); // Should return only NEW badges
        expect(newBadges.length).toBe(0);
    });
});
