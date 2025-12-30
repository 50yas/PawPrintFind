import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type Theme,
} from '@material/material-color-utilities';

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

export interface AppTheme {
  light: ThemeColors;
  dark: ThemeColors;
}

const mapSchemeToThemeColors = (scheme: any): ThemeColors => {
  const jsonScheme = scheme.toJSON();
  // scheme.toJSON() returns an object where keys are the role names and values are ARGB numbers
  // We need to convert values to hex.
  // Note: The library's Scheme class usually has properties like 'primary', 'onPrimary', etc. that are numbers.
  
  // We'll iterate over the properties we defined in ThemeColors and try to find them in the scheme.
  // Actually, let's just construct it manually to be safe and explicit, as the library's JSON structure might change or not match exactly.
  // However, iterating is cleaner if the names match.
  // The 'Scheme' class in material-color-utilities uses standard names.
  
  return {
    primary: hexFromArgb(scheme.primary),
    onPrimary: hexFromArgb(scheme.onPrimary),
    primaryContainer: hexFromArgb(scheme.primaryContainer),
    onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    secondary: hexFromArgb(scheme.secondary),
    onSecondary: hexFromArgb(scheme.onSecondary),
    secondaryContainer: hexFromArgb(scheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
    tertiary: hexFromArgb(scheme.tertiary),
    onTertiary: hexFromArgb(scheme.onTertiary),
    tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
    onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
    error: hexFromArgb(scheme.error),
    onError: hexFromArgb(scheme.onError),
    errorContainer: hexFromArgb(scheme.errorContainer),
    onErrorContainer: hexFromArgb(scheme.onErrorContainer),
    background: hexFromArgb(scheme.background),
    onBackground: hexFromArgb(scheme.onBackground),
    surface: hexFromArgb(scheme.surface),
    onSurface: hexFromArgb(scheme.onSurface),
    surfaceVariant: hexFromArgb(scheme.surfaceVariant),
    onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
    outline: hexFromArgb(scheme.outline),
    outlineVariant: hexFromArgb(scheme.outlineVariant),
    shadow: hexFromArgb(scheme.shadow),
    scrim: hexFromArgb(scheme.scrim),
    inverseSurface: hexFromArgb(scheme.inverseSurface),
    inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
    inversePrimary: hexFromArgb(scheme.inversePrimary),
    // Some newer tokens might not be available in all versions of the library Scheme,
    // so we default to surface or variants if strictly needed, but let's see if they exist.
    // The current version of material-color-utilities usually supports surfaceContainer* in DynamicScheme, 
    // but the `themeFromSourceColor` returns standard Schemes which might be older structure.
    // Let's check if properties exist, otherwise fallback.
    surfaceDim: scheme.surfaceDim ? hexFromArgb(scheme.surfaceDim) : hexFromArgb(scheme.surface),
    surfaceBright: scheme.surfaceBright ? hexFromArgb(scheme.surfaceBright) : hexFromArgb(scheme.surface),
    surfaceContainerLowest: scheme.surfaceContainerLowest ? hexFromArgb(scheme.surfaceContainerLowest) : hexFromArgb(scheme.surface),
    surfaceContainerLow: scheme.surfaceContainerLow ? hexFromArgb(scheme.surfaceContainerLow) : hexFromArgb(scheme.surface),
    surfaceContainer: scheme.surfaceContainer ? hexFromArgb(scheme.surfaceContainer) : hexFromArgb(scheme.surface),
    surfaceContainerHigh: scheme.surfaceContainerHigh ? hexFromArgb(scheme.surfaceContainerHigh) : hexFromArgb(scheme.surface),
    surfaceContainerHighest: scheme.surfaceContainerHighest ? hexFromArgb(scheme.surfaceContainerHighest) : hexFromArgb(scheme.surface),
  };
};

export const generateTheme = (seedColorHex: string): AppTheme => {
  const seedArgb = argbFromHex(seedColorHex);
  const theme: Theme = themeFromSourceColor(seedArgb);

  return {
    light: mapSchemeToThemeColors(theme.schemes.light),
    dark: mapSchemeToThemeColors(theme.schemes.dark),
  };
};
