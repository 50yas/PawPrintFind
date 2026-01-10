# Implementation Plan: Enterprise Production Readiness & Global i18n Overhaul

This plan outlines the steps to achieve Google-standard production readiness and a comprehensive internationalization overhaul for Paw Print.

## Phase 1: Foundation - Strict Type Safety & Runtime Validation [checkpoint: 65d67d9]
Goal: Establish 100% type safety and robust API boundaries using TypeScript Strict Mode and Zod.

- [x] Task: Enable TypeScript Strict Mode (1502629)
    - [x] Sub-task: Update `tsconfig.json` to set `strict: true`.
    - [x] Sub-task: Fix all resulting type errors project-wide (excluding node_modules).
- [x] Task: Implement Zod for Runtime Validation (1502629)
    - [x] Sub-task: Define Zod schemas for all Firestore data models in `types.ts`.
    - [x] Sub-task: Integrate Zod validation into `services/firebase.ts` (e.g., in `getDoc` and `onSnapshot` wrappers).
    - [x] Sub-task: Create unit tests in `services/validationService.test.ts` to verify Zod schema enforcement.
- [x] Task: Conductor - User Manual Verification 'Foundation - Strict Type Safety & Runtime Validation' (Protocol in workflow.md) (65d67d9)

## Phase 2: Infrastructure - Structured Logging & Observability [checkpoint: 3a6df4d]
Goal: Implement Google-level SRE standards for logging and performance monitoring.

- [x] Task: Implement Structured JSON Logger
    - [x] Sub-task: Create `services/loggerService.ts` with support for NDJSON output and `trace_id`.
    - [x] Sub-task: Add Trace ID generation/propagation logic.
    - [x] Sub-task: Write tests in `services/loggerService.test.ts`.
- [x] Task: Integrate Firebase Performance Monitoring
    - [x] Sub-task: Initialize Firebase Performance SDK in `services/firebase.ts`.
    - [x] Sub-task: Verify automatic traces for network requests and page loads in Firebase Console.
- [x] Task: Global Error Boundary
    - [x] Sub-task: Enhance `components/ErrorBoundary.tsx` to log errors using the new structured logger.
    - [x] Sub-task: Write integration tests to ensure errors are captured and logged correctly.
- [x] Task: Conductor - User Manual Verification 'Infrastructure - Structured Logging & Observability' (Protocol in workflow.md) (3a6df4d)

## Phase 3: Core - i18n Framework Migration [checkpoint: ff8f1a6]
Goal: Migrate from the custom `LanguageContext` to `react-i18next`.

- [x] Task: Install and Initialize `react-i18next` (0354963)
    - [x] Sub-task: Install `i18next`, `react-i18next`, and `i18next-browser-languagedetector`.
    - [x] Sub-task: Create `i18n.ts` configuration with support for namespaces (`common`, `auth`, `dashboard`).
- [x] Task: Refactor `LanguageContext` to use `react-i18next` (9a6d9bb)
    - [x] Sub-task: Replace internal state with `i18next` hooks.
    - [x] Sub-task: Migrate existing translations from `translations/*.ts` to JSON files for better `i18next` integration.
    - [x] Sub-task: Update `LanguageContext.test.tsx` to verify the new implementation.
- [x] Task: Conductor - User Manual Verification 'Core - i18n Framework Migration' (Protocol in workflow.md) (3fe5af4)

## Phase 4: Content - Global Localization Overhaul
Goal: Detect hardcoded strings and fill translation gaps using Gemini AI.

- [x] Task: Hardcoded String Extraction
    - [x] Sub-task: Scan all components for hardcoded UI strings.
    - [x] Sub-task: Move all strings to `en` locale files and replace with `t('key')` calls.
- [x] Task: AI-Powered Translation Gap Filling
    - [x] Sub-task: Use Gemini (via `geminiService.ts`) to identify missing keys in other locales (es, fr, de, zh, ar, it).
    - [x] Sub-task: Generate contextually accurate, gender-neutral, and plural-aware translations for all missing keys.
- [x] Task: Verify RTL Support
    - [x] Sub-task: Perform a UI audit for the `ar` (Arabic) locale to ensure correct layout and alignment.
- [~] Task: Conductor - User Manual Verification 'Content - Global Localization Overhaul' (Protocol in workflow.md)

## Phase 5: Quality & Performance - Bundle Optimization & Final Audit
Goal: Ensure the 90% coverage threshold and optimize performance.

- [~] Task: Performance & Bundle Audit
    - [ ] Sub-task: Analyze bundle size using `vite-bundle-analyzer`.
    - [ ] Sub-task: Implement further lazy loading for large components (e.g., 3D HeroScene, Maps).
- [ ] Task: Enforce 90% Code Coverage
    - [ ] Sub-task: Run coverage reports and identify gaps.
    - [ ] Sub-task: Write additional tests (prioritizing integration tests) to reach the 90% threshold.
    - [ ] Sub-task: Update `vitest.config.ts` to enforce the 90% threshold as a build failure.
- [ ] Task: Final Code Audit
    - [ ] Sub-task: Scan for architectural anti-patterns and performance bottlenecks.
- [ ] Task: Conductor - User Manual Verification 'Quality & Performance - Bundle Optimization & Final Audit' (Protocol in workflow.md)
