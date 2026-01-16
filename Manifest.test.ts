
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest Configuration', () => {
  it('should include PNG icons for mobile compatibility', () => {
    const viteConfigPath = path.resolve(__dirname, 'vite.config.ts');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // We are parsing the text because importing vite.config.ts in a test environment
    // without full vite setup can be flaky with plugins.
    // We look for the icons array in the manifest object.

    // This regex looks for the 'icons' array within the 'manifest' object
    // and checks if it contains an entry with type: 'image/png'
    const hasPngIcon = /type:\s*['"]image\/png['"]/.test(viteConfigContent);

    expect(hasPngIcon).toBe(true);
  });

  it('should explicitly define start_url as /', () => {
      const viteConfigPath = path.resolve(__dirname, 'vite.config.ts');
      const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');
      const hasStartUrl = /start_url:\s*['"]\/['"]/.test(viteConfigContent);
      expect(hasStartUrl).toBe(true);
  });

  it('should include apple-touch-icon in index.html', () => {
    const indexPath = path.resolve(__dirname, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const hasAppleTouchIcon = /<link\s+rel=['"]apple-touch-icon['"]\s+href=['"]\/pwa-192x192\.png['"]/.test(indexContent);
    expect(hasAppleTouchIcon).toBe(true);
  });
});
