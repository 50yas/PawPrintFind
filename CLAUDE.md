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

### Internationalization

i18next with react-i18next. 8 languages (en, it, es, fr, de, zh, ar, ro). Translation files in `translations/*.ts` and `public/locales/{lang}/*.json`. Access via `useTranslation()` hook.

### Authentication & Authorization

Firebase Auth with multiple providers. Roles: `owner`, `vet`, `shelter`, `volunteer`, `super_admin`. Admin access controlled by email whitelist in Firestore rules + custom claims + Firestore user doc check.

### Testing

Vitest + @testing-library/react + vitest-axe (accessibility). Setup in `vitest.setup.ts` globally mocks Firebase SDK, react-i18next (key-passthrough), crypto.subtle, IntersectionObserver, and loggerService. Test files: `*.test.tsx` alongside components.

### PWA

Configured via vite-plugin-pwa with Workbox caching (network-first for Firestore API, cache-first for assets). Service worker in `dev-dist/sw.js`.

### Project Tracking

`conductor/tracks.md` indexes implementation tracks. Each track has its own directory under `conductor/tracks/` with plan.md, spec.md, and metadata.

## Key Conventions

- Firebase project ID: `pawprint-50`
- Node >=22 required
- Firestore rules in `firestore.rules` – read carefully before changing security model
- Environment: `GEMINI_API_KEY` in `.env.local`, Firebase config is hardcoded in `services/firebase.ts`
- All AI features route through `aiBridgeService.ts` which abstracts over Gemini and OpenRouter
- Cloud Functions source is in `functions/` (separate package.json)
