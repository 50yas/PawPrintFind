# Implementation Plan: Accessibility, Performance & Deep Localization

## Phase 1: Deep Localization
- [x] Task: Auth Localization [d4e7fd4]
    - [ ] Sub-task: Extract all strings from `Auth.tsx`, `AddVetModal.tsx`, etc., into `public/locales/en/auth.json`.
    - [ ] Sub-task: Update components to use `useTranslation('auth')`.
    - [ ] Sub-task: Use Gemini to translate `auth.json` into all supported languages.
- [x] Task: Global Translation Audit [15943b3]
    - [ ] Sub-task: Run a regex search for hardcoded strings in `src/`.
    - [ ] Sub-task: Fix identified gaps and add keys to `common.json` or `dashboard.json`.

## Phase 2: Accessibility & Compliance
- [x] Task: WCAG Audit & Fixes [f4ad3c3]
    - [x] Sub-task: Install `axe-core` or similar dev tool to audit pages.
    - [x] Sub-task: Fix semantic HTML issues (missing `alt`, bad heading hierarchy).
    - [x] Sub-task: Ensure focus trapping works correctly in all Modals.

## Phase 3: Performance & PWA
- [x] Task: Code Splitting [9b2c7f1]
    - [x] Sub-task: Refactor `App.tsx` routes to use `React.lazy`.
    - [x] Sub-task: Create a `LoadingScreen` fallback for Suspense boundaries.
- [x] Task: PWA Implementation [8b55ccf]
    - [x] Sub-task: Install and configure `vite-plugin-pwa`.
    - [x] Sub-task: Configure `manifest.json` (icons, theme color, name).
    - [x] Sub-task: Verify Service Worker registration and offline caching in production build.
- [~] Task: Conductor - User Manual Verification 'Accessibility & PWA' (Protocol in workflow.md)
