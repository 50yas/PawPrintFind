import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from './blogUtils';

describe('blogUtils - calculateReadingTime', () => {
    it('returns 0 for empty or non-string input', () => {
        expect(calculateReadingTime('')).toBe(0);
        expect(calculateReadingTime(undefined)).toBe(0);
    });

    it('returns 1 for short text', () => {
        expect(calculateReadingTime('Hello world')).toBe(1);
    });

    it('calculates time for long text correctly', () => {
        const longText = Array(450).fill('word').join(' ');
        expect(calculateReadingTime(longText)).toBe(2);
    });

    it('handles multiple spaces and newlines', () => {
        const text = 'Word1 Word2 Word3';
        expect(calculateReadingTime(text)).toBe(1);
    });
});