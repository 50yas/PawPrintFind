# Implementation Plan: Accessibility, Performance & Deep Localization

## Phase 1: Deep Localization
- [x] Task: Auth Localization [d4e7fd4]
    - [ ] Sub-task: Extract all strings from `Auth.tsx`, `AddVetModal.tsx`, etc., into `public/locales/en/auth.json`.
    - [ ] Sub-task: Update components to use `useTranslation('auth')`.
    - [ ] Sub-task: Use Gemini to translate `auth.json` into all supported languages.
- [ ] Task: Global Translation Audit
    - [ ] Sub-task: Run a regex search for hardcoded strings in `src/`.
    - [ ] Sub-task: Fix identified gaps and add keys to `common.json` or `dashboard.json`.

## Phase 2: Accessibility & Compliance
- [ ] Task: WCAG Audit & Fixes
    - [ ] Sub-task: Install `axe-core` or similar dev tool to audit pages.
    - [ ] Sub-task: Fix semantic HTML issues (missing `alt`, bad heading hierarchy).
    - [ ] Sub-task: Ensure focus trapping works correctly in all Modals.

## Phase 3: Performance & PWA
- [ ] Task: Code Splitting
    - [ ] Sub-task: Refactor `App.tsx` routes to use `React.lazy`.
    - [ ] Sub-task: Create a `LoadingScreen` fallback for Suspense boundaries.
- [ ] Task: PWA Implementation
    - [ ] Sub-task: Install and configure `vite-plugin-pwa`.
    - [ ] Sub-task: Configure `manifest.json` (icons, theme color, name).
    - [ ] Sub-task: Verify Service Worker registration and offline caching in production build.
- [ ] Task: Conductor - User Manual Verification 'Accessibility & PWA' (Protocol in workflow.md)
