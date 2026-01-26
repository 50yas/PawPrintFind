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

## Phase 2: Full Localization & i18n Audit
Goal: Eliminate hardcoded strings and ensure dynamic content is localized.

- [x] **Task: Extract Hardcoded Strings** <!-- 452d19b -->
    - [x] Audit `App.tsx`, `AdoptionCenter.tsx`, and `AdminDashboard.tsx` for missing translation keys.
    - [x] Update `translations.ts` and ensure namespaces are balanced across languages.
- [~] **Task: Localize Dynamic AI Content**
    - [ ] Update `AIIdentikitCard.tsx` and `AIHealthCheckModal.tsx` to request localized responses from Gemini.
    - [ ] Ensure breed names and health insights translate correctly.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)**

## Phase 3: Advanced Features & UI Polish
Goal: Implement filters, favorites, and AI matching.

- [ ] **Task: Advanced Filtering & Sorting**
    - [ ] Write tests for multi-parameter Firestore queries in `AdoptionCenter.test.tsx`.
    - [ ] Implement UI for filters (breed, size, age) using Glassmorphism components.
- [ ] **Task: Favorites System**
    - [ ] Add `favorites` collection handling to `services/firebase.ts`.
    - [ ] Create `FavoriteButton` component and integrate into `AIIdentikitCard.tsx`.
- [ ] **Task: AI Match Explanations & Sharing**
    - [ ] Implement Gemini logic to generate match descriptions based on search queries.
    - [ ] Add Web Share API integration for pet profiles.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)**

## Phase 4: Accessibility & Final Polish
Goal: Reach 100% WCAG compliance and final visual refinements.

- [ ] **Task: Accessibility Audit & Remediation**
    - [ ] Run `vitest-axe` on all new components.
    - [ ] Fix contrast issues and ensure keyboard navigation works for all modals.
- [ ] **Task: Final UI/UX Consistency Check**
    - [ ] Verify Material You color harmony across all views.
- [ ] **Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)**