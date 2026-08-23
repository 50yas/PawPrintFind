import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Helper to parse CSS variables from file
function getCssVariables(filePath: string): { root: Record<string, string>, dark: Record<string, string> } {
  let css = fs.readFileSync(filePath, 'utf-8');
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  const rootMatch = css.match(/:root\s*{([^}]+)}/);
  const darkMatch = css.match(/\.dark\s*{([^}]+)}/);

  const parseBlock = (block: string) => {
    const vars: Record<string, string> = {};
    block.split(';').forEach(line => {
      line = line.trim();
      if (!line) return;
      const parts = line.split(':');
      if (parts.length < 2) return;
      
      const key = parts[0].trim();
      // Join back in case value has colons (though unlikely for colors)
      const value = parts.slice(1).join(':').trim();
      
      if (key.startsWith('--') && value) {
        vars[key] = value;
      }
    });
    return vars;
  };

  return {
    root: rootMatch ? parseBlock(rootMatch[1]) : {},
    dark: darkMatch ? parseBlock(darkMatch[1]) : {}
  };
}

// Helper: Convert Hex/RGB/HSL to RGB object
function parseColor(color: string): { r: number, g: number, b: number } | null {
  if (!color) return null;
  color = color.trim();
  
  // Hex
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    }
  }

  // Tailwind HSL (e.g., "191 100% 50%")
  const hslMatch = color.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  return null;
}

// Helper: Calculate Luminance
function getLuminance({ r, g, b }: { r: number, g: number, b: number }): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Helper: Calculate Contrast Ratio
function getContrastRatio(fg: string, bg: string): number {
  const fgRgb = parseColor(fg);
  const bgRgb = parseColor(bg);

  if (!fgRgb || !bgRgb) {
    return 0; // Fail safe
  }

  const lum1 = getLuminance(fgRgb);
  const lum2 = getLuminance(bgRgb);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Accessibility: Color Contrast', () => {
  const { root, dark } = getCssVariables(path.resolve(process.cwd(), 'src/index.css'));

  // Merge dark variables on top of root for full context
  const darkTheme = { ...root, ...dark };

  describe('Light Mode', () => {
    it('should pass WCAG AA (4.5:1) for Foreground on Background', () => {
      const ratio = getContrastRatio(root['--foreground'], root['--background']);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Dark Mode', () => {
    it('should have a dark background color', () => {
      const bgRgb = parseColor(darkTheme['--background']);
      const luminance = getLuminance(bgRgb!);
      expect(luminance).toBeLessThan(0.5);
    });

    it('should pass WCAG AA (4.5:1) for Foreground on Background', () => {
      // In dark mode, background should be dark, foreground should be light.
      const ratio = getContrastRatio(darkTheme['--foreground'], darkTheme['--background']);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should pass WCAG AA (4.5:1) for Material 3 On-Surface on Surface', () => {
      const ratio = getContrastRatio(darkTheme['--md-sys-color-on-surface'], darkTheme['--md-sys-color-surface']);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});