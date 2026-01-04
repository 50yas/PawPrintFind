
import { describe, it, expect } from 'vitest';
import { generateAdoptionInquiry } from './templateUtils';

describe('generateAdoptionInquiry', () => {
    it('replaces {{petName}} with the actual pet name', () => {
        const template = "Hello, I want to adopt {{petName}}.";
        const result = generateAdoptionInquiry(template, "Buddy");
        expect(result).toBe("Hello, I want to adopt Buddy.");
    });

    it('handles multiple occurrences of {{petName}}', () => {
        const template = "Is {{petName}} available? I love {{petName}}.";
        const result = generateAdoptionInquiry(template, "Buddy");
        expect(result).toBe("Is Buddy available? I love Buddy.");
    });

    it('returns the template as is if no placeholders are found', () => {
        const template = "Hello, I am interested.";
        const result = generateAdoptionInquiry(template, "Buddy");
        expect(result).toBe("Hello, I am interested.");
    });
});
