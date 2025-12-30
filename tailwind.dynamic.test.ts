import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Tailwind Dynamic Theme Configuration', () => {
    it('should define Material 3 dynamic color tokens', () => {
        const configPath = path.resolve(process.cwd(), 'tailwind.config.js');
        const configContent = fs.readFileSync(configPath, 'utf-8');

        // Check for specific Material 3 tokens mapping to CSS variables
        // We expect them to use the CSS variable naming convention, e.g., 'var(--md-sys-color-primary)'
        
        // Primary
        expect(configContent).toContain('primary: "var(--md-sys-color-primary)"');
        expect(configContent).toContain('"on-primary": "var(--md-sys-color-on-primary)"'); // specific keys with hyphens must be quoted
        expect(configContent).toContain('"primary-container": "var(--md-sys-color-primary-container)"');
        
        // Surface
        expect(configContent).toContain('surface: "var(--md-sys-color-surface)"');
        expect(configContent).toContain('"surface-container": "var(--md-sys-color-surface-container)"');
        expect(configContent).toContain('"surface-container-low": "var(--md-sys-color-surface-container-low)"');
        
        // Error
        expect(configContent).toContain('error: "var(--md-sys-color-error)"');
    });
});
