# Project Orchestrator Memory

## PawPrintFind Architecture Patterns

### Translation System Architecture
- **Dual Source System**: TypeScript files (`translations/*.ts`) AND JSON files (`public/locales/{lang}/*.json`)
- **i18next Integration**: Uses react-i18next with `useTranslation()` hook exposed via `useTranslations()` custom hook
- **Namespace Pattern**: Keys use namespace prefixes (`dashboard:vet.practicePortal`) for organized scoping
- **8 Languages**: en, it, es, fr, de, zh, ar, ro - all with comprehensive coverage

### Common Translation Issues
1. **Missing JSON Keys**: Translation keys referenced in components but not in JSON files
2. **Press Kit Keys**: `downloadAsset`, `formatLabel`, `bgLabel`, `transparentBg`, `coloredBg`, `downloadButton`, `pressKitTitle`, `pressKitDesc`, `assetLogoIcon`, `assetLogoText`, `assetLogoLockup` - not in common.json
3. **PressKit Logo**: WordmarkSVG shows "Paw Print" but should show "Paw Print Find" per user requirement

### Frequently Modified Files
- `components/PressKit.tsx` - Press kit and asset download functionality
- `components/LoadingScreen.tsx` - Boot sequence with animated logo
- `public/locales/en/common.json` - Primary translation source
- `translations/en.ts` - TypeScript translation definitions

### Optimal Change Sequence
1. **Types first**: Update `types.ts` if new data structures needed
2. **Translations**: Add missing keys to both TypeScript AND JSON files (all 8 languages)
3. **Service layer**: Update relevant services if backend logic changes
4. **UI Components**: Implement component changes
5. **Tests**: Update test files to match new translations
6. **Visual assets**: SVG/graphics updates last (non-blocking)

### Testing Checklist for Translation Changes
- [ ] Verify all keys exist in common.json for all 8 languages
- [ ] Test key interpolation ({{petName}}, {{count}}) renders correctly
- [ ] Check namespace prefixes (`dashboard:`, `vet.`, etc.) resolve properly
- [ ] Validate RTL layout for Arabic (ar)
- [ ] Run vitest tests (pass-through mocking returns keys as-is)

### Known Bottlenecks
- **Translation JSON files**: Must be updated in 8 languages (en, it, es, fr, de, zh, ar, ro)
- **Press Kit assets**: SVG generation for icon, wordmark, lockup variants
- **Loading screen**: Complex CSS animations may impact performance

## Agent Coordination Patterns

### i18n-copy-optimizer
- Handles all translation key additions
- Updates both TypeScript and JSON sources
- Maintains consistency across 8 languages
- Validates namespace structure

### futuristic-ui-builder
- UI/UX improvements and graphics
- CSS animation optimization
- SVG asset generation
- Component visual enhancements

### performance-optimizer
- Animation performance tuning
- Asset loading optimization
- Bundle size analysis

## Recent Issues Resolved
- None yet - first orchestration session

## Recurring Conflicts
- None yet - monitoring for patterns
