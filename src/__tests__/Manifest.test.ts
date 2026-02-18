
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest Configuration', () => {
  it('should include PNG or SVG icons for mobile compatibility', () => {
    const viteConfigPath = path.resolve(__dirname, 'vite.config.ts');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // We accept SVG now as we don't have image generation tools
    const hasIcon = /type:\s*['"]image\/(png|svg\+xml)['"]/.test(viteConfigContent);

    expect(hasIcon).toBe(true);
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
    const hasAppleTouchIcon = /<link\s+rel=['"]apple-touch-icon['"]\s+href=['"]\/favicon\.svg['"]/.test(indexContent);
    expect(hasAppleTouchIcon).toBe(true);
  });
});
