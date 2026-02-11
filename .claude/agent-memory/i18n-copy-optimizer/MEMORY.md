# i18n Copy Optimizer Memory

## Project Translation Architecture

### Dual Translation System (Critical Finding)
- **Two parallel systems coexist**:
  1. TypeScript files in `/translations/*.ts` - imported via i18n.ts (537+ lines for en)
  2. JSON files in `/public/locales/{lang}/*.json` - used by some components
- **Translation hook confusion**: `useTranslations()` vs `useTranslation()`
  - `useTranslations()` → Custom hook via LanguageContext (uses i18n from translations/*.ts)
  - `useTranslation('namespace')` → react-i18next hook (uses JSON from public/locales)
  - Components use BOTH inconsistently
  - **PressKit component uses `useTranslations()` which references TypeScript files**

### Current Namespace Structure
```
common.json - UI elements, buttons, labels (159 keys in EN/IT, 144 in others)
auth.json - Authentication flow (87 lines)
dashboard.json - Dashboard-specific content (262 lines in EN, only 173 in IT)
```

### Translation File Status (8 languages: en, it, es, fr, de, zh, ar, ro)
- **TypeScript coverage**: All 8 languages have complete translations/*.ts files
- **JSON coverage**:
  - EN: common.json (159 keys), auth.json, dashboard.json (complete)
  - IT: common.json (159 keys), dashboard.json, auth.json (dashboard incomplete)
  - Other langs: common.json (144 keys), auth.json
  - **Missing**: dashboard.json for es, fr, de, zh, ar, ro

### RTL Support Implementation
- Arabic (ar) properly configured in LanguageContext
- `document.documentElement.dir` set automatically
- `document.documentElement.lang` set automatically
- RTL detection via `i18n.dir(locale)`

## Key Issues Identified & RESOLVED

### 1. ✅ FIXED: Missing Press Kit Translation Keys
**Issue**: PressKit component displayed raw key names like "pressKitTitle", "downloadAsset"
**Root Cause**: Component uses `useTranslations()` hook but keys didn't exist in either TypeScript or JSON files
**Resolution**: Added 12 Press Kit keys to all 8 language JSON files + translations/en.ts:
- pressKit, pressKitTitle, pressKitDesc
- assetLogoIcon, assetLogoText, assetLogoLockup
- downloadAsset, formatLabel, bgLabel
- transparentBg, coloredBg, downloadButton

### 2. ✅ FIXED: Missing ImageTagger, RedeemCode, and Filter Keys
**Issue**: Multiple components referenced undefined translation keys
**Resolution**: Added 16 additional keys to all 8 language files:
- ImageTagger: addMarkCta, describeMarkPrompt, describeMarkPlaceholder, saveMarkButton
- Filters: sortByLabel, filterBySizeLabel
- RedeemCode: codeRedeemedSuccess, codeRedeemFailed, redeemCodeTitle, redeemCodeDesc, enterCodePlaceholder, redeemButton, congratulations, youUnlocked
- UserManagement: loadingUsers, searchUsers

### 3. Incomplete dashboard.json Translations (STILL OPEN)
- English has 262 lines
- Italian has only 173 lines
- Spanish, French, German, Chinese, Arabic, Romanian: MISSING entirely
- Components using `useTranslation('dashboard')` will fail for non-EN users

### 4. Missing Microcopy Translation Keys (PARTIAL FIX)
Based on audit, these still need translation keys:
- Empty state presets (NoPets, NoResults, NoMessages, NoSightings, NoAppointments, Error, Offline) - **Already exist in en.ts under `emptyState` object**
- Error messages in components
- Success messages
- Accessibility labels (aria-label attributes) - **Already exist in en.ts under `aria` object**
- Form validation messages

## Translation Key Naming Conventions (Observed)

### In TypeScript files (translations/*.ts):
- Flat structure with mixed conventions
- camelCase: `homeButton`, `loginButton`, `createImprontaButton`
- PascalCase: None observed
- Nested objects: Limited (auth, placeholders, buttons, errors, success, tutorial, dashboard)

### In JSON files (public/locales/):
- More hierarchical structure
- Namespaced by feature: `admin.commandCore`, `admin.systemRootActive`
- Better organization but incomplete coverage

### Recommended Standard (for future):
- Use hierarchical dot notation: `ui.buttons.login`, `errors.auth.emailInUse`
- Group by component/feature: `dashboard.owner.noPets`, `dashboard.vet.verificationPending`
- Keep consistency across both systems

## Common Phrases & Patterns

### Futuristic Tech Tone (English)
- "System", "Protocol", "Node", "Network", "Core", "Neural", "Operative"
- "Sync", "Audit", "Telemetry", "Bio", "Scan", "Intelligence"
- Italian maintains similar tech tone: "Nodo", "Sistema", "Audit", "Sync"

### Button Patterns
- Action verbs: "Register", "Create", "Report", "Mark", "Edit"
- Short (1-3 words): "Sign In", "Exit", "Save", "Cancel"
- Icon + Text common: "Register Pet 🐾", "Found a Pet? 🐱"

### Error Message Patterns (auth.json)
- Specific and actionable: "Email already registered. Please sign in."
- Not technical: "Incorrect email or password" not "AUTH_ERROR_001"
- Suggest next action: "Please sign in instead", "Please retry"

## String Length Variations by Language

### Observed Expansion Rates
- German: Expect ~30% longer than English
- Italian: Similar length to English
- Arabic: Right-to-left, similar length
- Chinese: Typically shorter (character-based)
- **French**: Slightly longer than English (10-15%)
- **Spanish**: Similar to English, sometimes slightly longer

### UI Impact Areas
- Buttons with long labels may break mobile layout
- Form labels in German may need more horizontal space
- Arabic text alignment requires RTL CSS

## Technical Debt & TODOs

1. ~~**Consolidate translation systems**~~ - Choose ONE source of truth (TypeScript OR JSON) - **DECISION NEEDED**
2. **Complete dashboard.json** for all 6 missing languages (es, fr, de, zh, ar, ro)
3. ~~**Add translation keys to EmptyState.tsx** presets~~ - **Already exist in en.ts under emptyState object**
4. **Create missing namespaces**: adoption, shelter, volunteer, vet (check if needed)
5. ~~**Fix systemAnomalyDetected** missing key in ErrorBoundary~~ - **Already exists in en.ts line 516**
6. **Audit all components** for hardcoded strings (grep for quotes in JSX)
7. **Add missing keys from grep results** to JSON files

## Recent Fixes (2026-02-11)

### Press Kit Translation Fix
- Added 12 Press Kit keys across all 8 languages
- Keys now properly resolve in PressKit component
- Maintained consistent translation quality across all languages
- Press Kit microcopy follows brand guidelines (short, clear, action-oriented)

### Additional Translation Keys Added
- ImageTagger component keys (4 keys)
- Filter and sorting keys (2 keys)
- RedeemCode modal keys (8 keys)
- User management keys (2 keys)
- **Total: 28 new keys added to all 8 language files**

### Validation Results
- All 8 JSON files validated successfully
- TypeScript compilation passes (tsc --noEmit)
- EN/IT have 159 keys each in common.json
- Other languages have 144 keys in common.json
- **15 key difference** likely due to older keys not propagated

## Files Modified (2026-02-11)

### JSON Translation Files (all validated)
- `/public/locales/en/common.json` (159 keys)
- `/public/locales/it/common.json` (159 keys)
- `/public/locales/es/common.json` (144 keys)
- `/public/locales/fr/common.json` (144 keys)
- `/public/locales/de/common.json` (144 keys)
- `/public/locales/zh/common.json` (144 keys)
- `/public/locales/ar/common.json` (144 keys)
- `/public/locales/ro/common.json` (144 keys)

### TypeScript Translation Files
- `/translations/en.ts` (537 lines, updated with Press Kit + additional keys)

## Next Steps

1. Identify 15 missing keys in es, fr, de, zh, ar, ro common.json files
2. Complete dashboard.json translations for 6 missing languages
3. Audit components for remaining hardcoded strings
4. Consider consolidating dual translation system
5. Document which components use which translation hook

## RTL CSS Patterns (for Arabic)

### Logical Properties to Use
- `margin-inline-start` instead of `margin-left`
- `padding-inline-end` instead of `padding-right`
- `text-align: start` instead of `text-align: left`

### Current Implementation
- LanguageContext handles dir attribute automatically
- CSS should use logical properties (needs audit)
- Icons/buttons may need mirroring (check for issues)
