# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PawPrintFind is an AI-powered pet finder web app built with React 18 + TypeScript + Firebase. It's a single-page application (Vite build) deployed to Firebase Hosting and Google App Engine.

## Commands

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # TypeScript check + Vite production build → dist/
npm run lint       # Type-check only (tsc --noEmit)
npm run test       # Run all tests once (vitest run)
npx vitest run components/Foo.test.tsx   # Run a single test file
npx vitest --watch                       # Watch mode
npm run deploy     # Deploy to Firebase (runs build first via predeploy)
firebase deploy --only hosting           # Deploy frontend only
firebase deploy --only functions         # Deploy Cloud Functions only
```

## Architecture

### Routing (no React Router)

The app uses a custom view-based routing system with string-literal view names (not URL paths). `App.tsx` manages the current view via state. Role-based routers delegate rendering:

- `AppRouter` → dispatches to role-specific routers
- `PublicRouter`, `UserRouter`, `VetRouter`, `ShelterRouter`, `AdminRouter` in `components/routers/`
- Deep linking for `/pet/{petId}` is handled via URL parsing in App

### Service Layer (Facade Pattern)

`services/firebase.ts` exports a `dbService` object that acts as the main API facade. It delegates to specialized services:

- `authService.ts` – authentication (email/password, Google, phone, magic link, anonymous)
- `petService.ts` – pet CRUD, sightings
- `vetService.ts` – vet clinics, verification
- `adminService.ts` – admin operations, audit logs, AI settings
- `searchService.ts` – pet matching and search
- `aiBridgeService.ts` – AI provider abstraction (Gemini ↔ OpenRouter)
- `loggerService.ts` – centralized logging to Firestore
- `validationService.ts` – Zod-based runtime validation
- `sanitizationService.ts` – DOMPurify XSS prevention

### State Management

No Redux/Zustand. Uses React Context + hooks:
- `useAppState` hook – global data fetching with Firestore `onSnapshot` subscriptions
- `LanguageContext`, `ThemeContext`, `SnackbarContext` – app-wide contexts
- Local state and custom hooks for component-level concerns

### Type System

Central `types.ts` file (~50+ interfaces, Zod schemas, UserRole enum). All Firestore document types, form types, and service interfaces live here.

**Important**: `UserSchema` in `types.ts` includes `displayName` and `photoURL` as optional fields. These MUST remain in the schema or Zod validation will strip them, breaking the Navbar user display.

### Internationalization

i18next with react-i18next. 8 languages (en, it, es, fr, de, zh, ar, ro).

**Two-layer translation system:**
- `src/translations/{lang}.ts` — TypeScript objects used as the `common` namespace for non-English languages (loaded via `loadLanguage()` in i18n.ts)
- `public/locales/{lang}/common.json` — JSON files loaded by HttpBackend (primary source for English; also present for all languages as fallback)
- `public/locales/{lang}/auth.json` and `dashboard.json` — loaded for ALL languages via HttpBackend

**When adding new translation keys**: add to ALL of the following:
1. `public/locales/en/common.json` (English JSON, used as HTTP primary)
2. `src/translations/en.ts` (English TS, used as fallback resource)
3. `src/translations/{it,es,fr,de,zh,ar,ro}.ts` (non-English TS)
4. `public/locales/{it,es,fr,de,zh,ar,ro}/common.json` (non-English JSON)

Use `python3` with `json.load/dump` to safely update JSON files — never use sed/awk on JSON.

The `dashboard:register.*` namespace refers to keys in `public/locales/{lang}/dashboard.json` under the `register` object.

### Authentication & Authorization

Firebase Auth with multiple providers. Roles: `owner`, `vet`, `shelter`, `volunteer`, `super_admin`. Admin access controlled by email whitelist in Firestore rules + custom claims + Firestore user doc check.

`syncUserProfile` in `authService.ts` merges Firebase Auth's `displayName`/`photoURL` into the returned profile — this ensures the Navbar always shows the latest avatar even for Google sign-in users.

### Testing

Vitest + @testing-library/react + vitest-axe (accessibility). Setup in `vitest.setup.ts` globally mocks Firebase SDK, react-i18next (key-passthrough), crypto.subtle, IntersectionObserver, and loggerService. Test files: `*.test.tsx` alongside components.

### PWA

Configured via vite-plugin-pwa with Workbox caching (network-first for Firestore API, cache-first for assets). Service worker in `dev-dist/sw.js`.

### Project Tracking

`conductor/tracks.md` indexes implementation tracks. Each track has its own directory under `conductor/tracks/` with plan.md, spec.md, and metadata.

## z-index Scale

Maintain this layering hierarchy to avoid stacking conflicts:

| Layer | z-index | Components |
|-------|---------|------------|
| Background | 0 | Page content |
| Sticky elements | 10-50 | Sticky headers in content |
| Mobile nav | 9999 | `MobileNavigation` (bottom bar) |
| App navbar | 1000 | `Navbar` (fixed top) |
| Dev marquee | 250 | `DevMarquee` |
| Admin banner | 300 | Admin browsing mode bar |
| Modals/drawers | 5000 | Auth modal, chat modal |
| Toasts/snackbars | **10000** | `Snackbar`, `NotificationToast` |
| Loading screen | 200 | `LoadingScreen` |

**Rule**: Snackbars and toasts MUST be above mobile nav (`z-[10000]`). Use `bottom: calc(env(safe-area-inset-bottom, 0px) + 90px)` for bottom-positioned toasts to clear the mobile nav bar.

## Key Conventions

- Firebase project ID: `pawprint-50`
- Node >=22 required
- Firestore rules in `firestore.rules` – read carefully before changing security model
- Environment: `GEMINI_API_KEY` in `.env.local`, Firebase config is hardcoded in `services/firebase.ts`
- All AI features route through `aiBridgeService.ts` which abstracts over Gemini and OpenRouter
- Cloud Functions source is in `functions/` (separate package.json)

## Specialized Agents

Use these Claude Code agent types for common tasks in this project:

### `futuristic-ui-builder`
For: new UI components, glassmorphism cards, animations, theme system changes, command palettes, page transitions. This project uses Tailwind + Framer Motion + Material Design 3 with custom glassmorphism.

### `i18n-copy-optimizer`
For: adding new UI text/labels/buttons/errors that need translation, setting up new i18n keys, reviewing microcopy, RTL support for Arabic. Always invoke AFTER creating components with user-facing text.

### `translation-completeness-checker`
For: verifying all 8 languages have consistent keys after any UI change. Run proactively after significant feature work. Checks both `src/translations/*.ts` and `public/locales/*/common.json`.

### `backend-logic-optimizer`
For: Firestore rules/indexes, Cloud Functions, caching strategies, validation layers, audit logging, karma/gamification logic, search scoring.

### `guardian-security-monitor`
For: security audits before deployment, checking Firestore rules, reviewing new auth flows, scanning for XSS/injection risks. Run weekly or before major releases.

### `dashboard-analytics-builder`
For: admin dashboard metrics, charts, KPI widgets, real-time data visualizations in AdminDashboard tabs.

### `performance-optimizer`
For: bundle size analysis, lazy loading, image optimization, Core Web Vitals. Run after adding heavy dependencies or large UI sections.

### `project-orchestrator`
For: sprint planning, task prioritization when multiple features need coordination, resolving conflicts between development efforts.

## Common Patterns

### Adding a new view
1. Add the view name to the `View` type in `types.ts`
2. Add routing in the appropriate router (`UserRouter`, `VetRouter`, etc.)
3. Create the component in `src/components/`
4. Add navigation links in `Navbar.tsx` and `MobileNavigation.tsx`
5. Add translation keys in all 16 translation files (8 TS + 8 JSON)

### Adding new Firestore collection
1. Add TypeScript interface + Zod schema in `types.ts`
2. Add service methods in the appropriate service file
3. Export via `dbService` in `firebase.ts`
4. Update `firestore.rules` with appropriate security rules
5. Update `firestore.indexes.json` if composite indexes needed

### Fixing translation key missing (raw key shown in UI)
Raw key names in the UI means the key is undefined in the active locale. Check:
1. Is the key in `public/locales/en/common.json`? (primary for English)
2. Is the key in `src/translations/en.ts`? (fallback)
3. If using `dashboard:` prefix, check `public/locales/en/dashboard.json`
4. Add to ALL 16 files if missing

### Profile photo / displayName not showing in Navbar
`UserSchema` in `types.ts` must include `displayName?: string` and `photoURL?: string`. If missing, Zod strips them during `syncUserProfile` validation. Also ensure `syncUserProfile` merges `fbUser.displayName` and `fbUser.photoURL` into the final user object.
