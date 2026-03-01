# Implementation Plan: Homepage UX/UI Overhaul & Performance Optimization

## Phase 1: Architectural Refactor
**Goal:** Modularize the homepage codebase to improve maintainability and render performance.

- [x] Task: Create Atomic Sub-Components
    - [x] Extract `HeroSection` from `Home.tsx`.
    - [x] Extract `FeaturesGrid` from `Home.tsx`.
    - [x] Extract `StatsRow` from `Home.tsx`.
    - [x] Extract `CallToAction` from `Home.tsx`.
- [x] Task: Implement `useHomeLogic` Hook
    - [x] Move state (scroll position, modal visibility, data fetching) from `Home.tsx` to `src/hooks/useHomeLogic.ts`.
- [x] Task: Conductor - User Manual Verification 'Architectural Refactor' (Protocol in workflow.md)

## Phase 2: Visual & Interactive Polish
**Goal:** Implement "Google-level" motion and responsiveness.

- [x] Task: Implement Material You Motion
    - [x] Wrap `HeroSection` and `FeaturesGrid` with `framer-motion` variants for scroll-triggered fade-ins.
    - [x] Add `whileHover` and `whileTap` scale effects to all buttons.
- [x] Task: Enhance 3D Hero
    - [x] Optimize the existing Three.js background for parallax without scroll jank.
    - [x] Ensure the 3D canvas does not block interaction with overlay buttons.
- [x] Task: Responsive Grid Audit
    - [x] Verify `grid-cols-1` to `grid-cols-3` scaling in `FeaturesGrid`.
    - [x] Enforce min-height 48px for all touch targets on mobile.
- [x] Task: Conductor - User Manual Verification 'Visual & Interactive Polish' (Protocol in workflow.md)

## Phase 3: Content & Messaging Refinement
**Goal:** Clarify the value proposition and guide the user.

- [x] Task: Update Hero Copy
    - [x] Replace generic welcome text with impact-driven headers (e.g., "AI-Powered Pet Protection").
    - [x] Update `en.ts` and `it.ts` translation files.
- [x] Task: Enhance Button Labels
    - [x] Rename CTAs to be action-oriented (e.g., "Start Search", "Secure Profile").
    - [x] Add contextual tooltips to "Biometric Vision" feature cards.
- [x] Task: Conductor - User Manual Verification 'Content & Messaging Refinement' (Protocol in workflow.md)

## Phase 4: Performance & Quality Assurance
**Goal:** Ensure the page is fast, accessible, and bug-free.

- [x] Task: Lighthouse & Bundle Audit
    - [x] Verify lazy loading of the 3D background.
    - [x] Run Lighthouse audit and fix LCP/CLS issues.
- [x] Task: Mobile Responsiveness Verification
    - [x] Manually test on simulated mobile viewports (iPhone SE, Pixel 7).
- [x] Task: Conductor - User Manual Verification 'Performance & Quality Assurance' (Protocol in workflow.md)
