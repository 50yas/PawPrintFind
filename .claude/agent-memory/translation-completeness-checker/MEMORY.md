# Translation Completeness Checker - Agent Memory

## Project Structure

- **Translation Files Location**: `/public/locales/{lang}/common.json`
- **Supported Languages**: 8 total - en, it, es, fr, de, zh, ar, ro
- **Primary Source**: English (en) is the source of truth
- **File Format**: Single `common.json` file per language (no namespace splitting yet)

## Key Translation Sections

### Homepage Content Structure
All homepage content is nested under specific keys:
- `beta.*` - Beta program information (7 keys)
- `features.*` - Feature cards with nested title/description (8 keys)
- `stats.*` - Platform statistics (8 keys)
- `testimonials.*` - User testimonials section (4 keys)
- `faq.*` - FAQ with nested q1-q6 structure (14 keys)

### Common Missing Keys Pattern
When new features are added to the homepage, these sections are commonly missed:
1. Profile-related: `profileSettings`, `notifications`, `myAchievements`
2. User roles: `finder`, `owner`, `protectedPets`
3. AI features: `aiAutofillTitle`, `aiAutofillDesc`, `aiAutofillButton`, `aiAutofillSuccess`, `aiAutofillError`
4. Pet fields: `unnamedOperative`, `classified`, `petProfilePhoto`, `behaviorPlaceholder`

## Translation Quality Standards

### Language-Specific Considerations

**Italian (it)**
- Use informal "tu" form for user-facing text
- Technical terms: "AI" remains "AI", "beta" becomes "beta"
- Pet terminology: "animale" for pet, "impronte" for pawprint

**Spanish (es)**
- Use informal "tú" form
- "Mascota" for pet is preferred over "animal"
- Q2 2026 translates to "Q2 2026" (keep English quarter notation)

**French (fr)**
- Formal "vous" form throughout
- "Animal" or "animal de compagnie" for pet
- Accents are critical: "Félicitations" not "Felicitations"

**German (de)**
- Formal "Sie" form
- "Haustier" for pet, "Tier" for animal
- Compound words: "Haustiersicherheit" (pet safety)

**Chinese (zh)**
- Simplified Chinese characters
- "宠物" for pet
- Q2 2026 remains as "2026年第二季度"
- Watch for proper Chinese punctuation (！ not !)

**Arabic (ar)**
- Right-to-left considerations for UI
- "حيوان أليف" or just "حيوان" for pet
- Proper Arabic numerals in context

**Romanian (ro)**
- "Animal de companie" or "animal" for pet
- Diacritics important: "ă", "â", "î", "ș", "ț"

## Common Pitfalls

1. **Nested Object Structure**: FAQ and features use nested objects - easy to miss nested translations
2. **Interpolation Variables**: `{{count}}`, `{{petName}}`, `{{clinicName}}` must remain unchanged
3. **Technical Terms**: "AI", "Beta", brand names stay in English across languages
4. **Punctuation**: Chinese uses ！？ instead of !?, watch for this in error messages
5. **Character Encoding**: Arabic and Chinese require proper UTF-8 encoding

## Completed Work (2026-02-12)

### Major Translation Gap Fixed
- Added 41+ missing translation keys to all 7 non-English languages
- Completed homepage beta, features, stats, testimonials, and faq sections
- Added missing profile and AI autofill keys
- All languages now have complete parity with English source

### Files Updated
- `/public/locales/it/common.json` - Italian (260 lines)
- `/public/locales/es/common.json` - Spanish (244 lines)
- `/public/locales/fr/common.json` - French (245 lines)
- `/public/locales/de/common.json` - German (245 lines)
- `/public/locales/zh/common.json` - Chinese (244 lines)
- `/public/locales/ar/common.json` - Arabic (244 lines)
- `/public/locales/ro/common.json` - Romanian (245 lines)

## Testing Checklist

When verifying translations:
- [ ] All 8 language files have identical key structure
- [ ] No English fallbacks in non-English files
- [ ] Interpolation variables like `{{count}}` are preserved
- [ ] Special characters are properly encoded (Chinese, Arabic)
- [ ] JSON syntax is valid (no trailing commas, proper escaping)
- [ ] Nested objects maintain structure across languages
- [ ] Cultural appropriateness of translations

## Future Considerations

- Consider splitting common.json into namespaces (homepage, profile, admin, etc.)
- Add automated tests to detect missing translation keys
- Implement translation key usage tracking to identify unused keys
- Consider using a translation management platform for larger scale
