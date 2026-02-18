import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Tailwind Configuration', () => {
    it('should have a local tailwind.config.js file', () => {
        const configPath = path.resolve(process.cwd(), 'tailwind.config.js');
        expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should define the Glassmorphism 2.0 palette', async () => {
        const configPath = path.resolve(process.cwd(), 'tailwind.config.js');
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            expect(configContent).toContain('colors');
            expect(configContent).toContain('primary'); // Teal
            expect(configContent).toContain('neon'); // Neon accents
        }
    });
});
