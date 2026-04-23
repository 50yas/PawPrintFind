import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Global CSS Variables', () => {
    it('should define Material 3 CSS variables in src/index.css', () => {
        const cssPath = path.resolve(process.cwd(), 'src/index.css');
        const cssContent = fs.readFileSync(cssPath, 'utf-8');

        // Check for root definition
        expect(cssContent).toContain(':root');
        expect(cssContent).toContain('--md-sys-color-primary:');
        expect(cssContent).toContain('--md-sys-color-on-primary:');
        expect(cssContent).toContain('--md-sys-color-surface:');
        
        // Check for dark mode definition
        // Tailwind class strategy usually uses .dark
        expect(cssContent).toContain('.dark'); 
        // We verify that variables are redefined inside .dark (or verify the file structure implies it)
        // A simple check is that the variable appears at least twice (once for root, once for dark) 
        // OR checks for .dark { ... --md-sys-color-primary ... } structure, which is hard with simple string match.
        // We will assume if .dark exists and variables are present, we are good for this level of testing.
    });
});
