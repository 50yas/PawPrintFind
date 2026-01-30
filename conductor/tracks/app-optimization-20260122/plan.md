# Implementation Plan: App Optimization & Feature Overhaul

This plan covers the resolution of the Adoption Page loading issue, complete localization, and the implementation of advanced search, favorites, and AI match features.

## Phase 1: Diagnostics & Core Fixes [checkpoint: 1435717]
Goal: Restore functionality to the Adoption Page and establish a baseline for performance.

- [x] **Task: Debug Adoption Page Loading** <!-- 80b0823 -->
    - [x] Create `AdoptionPageLoad.test.tsx` to simulate Firestore data retrieval failures.
    - [x] Inspect `services/firebase.ts` and `AdoptionCenter.tsx` for query bottlenecks or subscription errors.
    - [x] Implement fix to ensure the pet list renders reliably.
- [x] **Task: Performance Profiling** <!-- 87c7374 -->
    - [x] Verify 60fps for 3D backgrounds during page transitions.
    - [x] Optimize Three.js particle counts if frame drops occur.
- [x] **Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)**

## Phase 2: Full Localization & i18n Audit [checkpoint: 87951b2]
Goal: Eliminate hardcoded strings and ensure dynamic content is localized.

- [x] **Task: Extract Hardcoded Strings** <!-- 452d19b -->
    - [x] Audit `App.tsx`, `AdoptionCenter.tsx`, and `AdminDashboard.tsx` for missing translation keys.
    - [x] Update `translations.ts` and ensure namespaces are balanced across languages.
- [x] **Task: Localize Dynamic AI Content** <!-- 09ffe19 -->
    - [x] Update `AIIdentikitCard.tsx` and `AIHealthCheckModal.tsx` to request localized responses from Gemini.
    - [x] Ensure breed names and health insights translate correctly.
- [x] **Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)**

## Phase 3: Advanced Features & UI Polish [checkpoint: 3b18ae8]
Goal: Implement filters, favorites, and AI matching.

- [x] **Task: Advanced Filtering & Sorting** <!-- b8cef23 -->
    - [x] Write tests for multi-parameter Firestore queries in `AdoptionCenter.test.tsx`.
    - [x] Implement UI for filters (breed, size, age) using Glassmorphism components.
- [x] **Task: Favorites System** <!-- 835ddf7 -->
    - [x] Add `favorites` collection handling to `services/firebase.ts`.
    - [x] Create `FavoriteButton` component and integrate into `AIIdentikitCard.tsx`.
- [x] **Task: AI Match Explanations & Sharing** <!-- 005090e -->
    - [x] Implement Gemini logic to generate match descriptions based on search queries.
    - [x] Add Web Share API integration for pet profiles.
- [x] **Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)**

## Phase 4: Accessibility & Final Polish
Goal: Reach 100% WCAG compliance and final visual refinements.

- [ ] **Task: Accessibility Audit & Remediation**
    - [ ] Run `vitest-axe` on all new components.
    - [ ] Fix contrast issues and ensure keyboard navigation works for all modals.
- [ ] **Task: Final UI/UX Consistency Check**
    - [ ] Verify Material You color harmony across all views.
- [ ] **Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)**

## Phase 5: Enterprise Admin Tools & Social Discovery
Goal: Empower admins with donation management, automated translation enhancement, and social media scraping.

- [x] **Task: Admin Donation Management** <!-- 00f52b9 -->
    - [x] Implement `deleteDonation` in `services/contentService.ts`.
    - [x] Add "Donations" tab to `AdminDashboard.tsx` with list and delete actions.
- [x] **Task: Admin Dashboard UI/UX & Functionality Overhaul** <!-- c69c63b -->
    - [x] Refactor `AdminDashboard.tsx` to use "Glassmorphism 2.0" cards and responsive grid layouts.
    - [x] Enhance "Stats Overview" with real-time charts (using placeholders or simple SVG charts if library constrained).
    - [x] Improve navigation ergonomics within the dashboard.
- [~] **Task: AI-Powered Translation Enhancer**
    - [ ] Create `services/translationService.ts` using Gemini to audit and fill `translations.ts`.
    - [ ] Add "i18n Health" dashboard to Admin tools.
- [ ] **Task: Social Media Scraper Agent**
    - [ ] Implement `scraperService.ts` leveraging Browserbase/Stagehand to discover lost pet announcements.
    - [ ] Create "Social Feed" in Admin Dashboard to review and import scraped sightings.
- [ ] **Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)**