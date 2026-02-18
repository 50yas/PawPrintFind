# Implementation Plan: Homepage UX/UI Overhaul & Performance Optimization

## Phase 1: Architectural Refactor
**Goal:** Modularize the homepage codebase to improve maintainability and render performance.

- [ ] Task: Create Atomic Sub-Components
    - [ ] Extract `HeroSection` from `Home.tsx`.
    - [ ] Extract `FeaturesGrid` from `Home.tsx`.
    - [ ] Extract `StatsRow` from `Home.tsx`.
    - [ ] Extract `CallToAction` from `Home.tsx`.
- [ ] Task: Implement `useHomeLogic` Hook
    - [ ] Move state (scroll position, modal visibility, data fetching) from `Home.tsx` to `src/hooks/useHomeLogic.ts`.
- [ ] Task: Conductor - User Manual Verification 'Architectural Refactor' (Protocol in workflow.md)

## Phase 2: Visual & Interactive Polish
**Goal:** Implement "Google-level" motion and responsiveness.

- [ ] Task: Implement Material You Motion
    - [ ] Wrap `HeroSection` and `FeaturesGrid` with `framer-motion` variants for scroll-triggered fade-ins.
    - [ ] Add `whileHover` and `whileTap` scale effects to all buttons.
- [ ] Task: Enhance 3D Hero
    - [ ] Optimize the existing Three.js background for parallax without scroll jank.
    - [ ] Ensure the 3D canvas does not block interaction with overlay buttons.
- [ ] Task: Responsive Grid Audit
    - [ ] Verify `grid-cols-1` to `grid-cols-3` scaling in `FeaturesGrid`.
    - [ ] Enforce min-height 48px for all touch targets on mobile.
- [ ] Task: Conductor - User Manual Verification 'Visual & Interactive Polish' (Protocol in workflow.md)

## Phase 3: Content & Messaging Refinement
**Goal:** Clarify the value proposition and guide the user.

- [ ] Task: Update Hero Copy
    - [ ] Replace generic welcome text with impact-driven headers (e.g., "AI-Powered Pet Protection").
    - [ ] Update `en.ts` and `it.ts` translation files.
- [ ] Task: Enhance Button Labels
    - [ ] Rename CTAs to be action-oriented (e.g., "Start Search", "Secure Profile").
    - [ ] Add contextual tooltips to "Biometric Vision" feature cards.
- [ ] Task: Conductor - User Manual Verification 'Content & Messaging Refinement' (Protocol in workflow.md)

## Phase 4: Performance & Quality Assurance
**Goal:** Ensure the page is fast, accessible, and bug-free.

- [ ] Task: Lighthouse & Bundle Audit
    - [ ] Verify lazy loading of the 3D background.
    - [ ] Run Lighthouse audit and fix LCP/CLS issues.
- [ ] Task: Mobile Responsiveness Verification
    - [ ] Manually test on simulated mobile viewports (iPhone SE, Pixel 7).
- [ ] Task: Conductor - User Manual Verification 'Performance & Quality Assurance' (Protocol in workflow.md)
