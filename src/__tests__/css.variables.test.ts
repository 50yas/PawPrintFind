import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Global CSS Variables', () => {
    it('should define Material 3 CSS variables in index.css', () => {
        const cssPath = path.resolve(process.cwd(), 'src/index.css');
        const cssContent = fs.readFileSync(cssPath, 'utf-8');

        // Check for root definition
        expect(cssContent).toContain(':root');
        expect(cssContent).toContain('--md-sys-color-primary:');
        expect(cssContent).toContain('--md-sys-color-on-primary:');
        expect(cssContent).toContain('--md-sys-color-surface:');
        
        // Check for dark mode definition
        expect(cssContent).toContain('.dark'); 
    });
});
