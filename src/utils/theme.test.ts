import { describe, it, expect } from 'vitest';
import { generateTheme, type ThemeColors } from './theme';
import { argbFromHex, hexFromArgb } from '@material/material-color-utilities';

describe('Theme Generator', () => {
  it('should generate a theme based on the "Paw Print Teal" seed color', () => {
    const seedColor = '#008080';
    const theme = generateTheme(seedColor);

    // Verify structure
    expect(theme).toHaveProperty('light');
    expect(theme).toHaveProperty('dark');

    // Check specific keys in light theme
    expect(theme.light).toHaveProperty('primary');
    expect(theme.light).toHaveProperty('onPrimary');
    expect(theme.light).toHaveProperty('surface');
    expect(theme.light).toHaveProperty('onSurface');
    expect(theme.light).toHaveProperty('error');

    // Verify strict color generation (values will depend on the algorithm, but we can check format)
    expect(theme.light.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    
    // Check that primary color relates to the seed (it won't be identical usually, but close)
    // For Tonal Palette, 40 is usually standard for Primary in light mode.
    // We trust the library, so we just check it returns strings.
  });

  it('should generate distinct light and dark themes', () => {
    const seedColor = '#008080';
    const theme = generateTheme(seedColor);

    expect(theme.light.surface).not.toBe(theme.dark.surface);
    expect(theme.light.primary).not.toBe(theme.dark.primary);
  });
});
