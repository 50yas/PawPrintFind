# Implementation Plan: Homepage Storytelling & Technical Performance Audit

## Phase 1: Technical Audit & Performance Optimization
**Goal:** Clean up legacy code, optimize hooks, and improve initial load performance.

- [ ] Task: Audit and Refactor React Hooks
    - [ ] Identify redundant or cascading `useEffect` calls in `App.tsx`, `Home.tsx`, and `Dashboard.tsx`.
    - [ ] Consolidate state management to minimize unnecessary re-renders.
- [ ] Task: Optimize Firestore Read/Write Patterns
    - [ ] Review `services/firebase.ts` and `services/adminService.ts` for duplicate fetching logic.
    - [ ] Implement efficient `onSnapshot` listeners to replace manual `getDocs` calls where appropriate.
- [ ] Task: Bundle Optimization & Code Splitting
    - [ ] Audit `App.tsx` and `Home.tsx` for large component imports.
    - [ ] Implement `React.lazy` and `Suspense` for heavy modules (Maps, 3D Scenes, Charts).
- [ ] Task: Consolidate UI Components
    - [ ] Identify duplicate "Card" or "Modal" patterns.
    - [ ] Extract shared logic into reusable, high-performance base components.
- [ ] Task: Conductor - User Manual Verification 'Technical Audit & Performance Optimization' (Protocol in workflow.md)

## Phase 2: Homepage Narrative & Problem-Solution UX
**Goal:** Implement the high-impact "Problem-Solution" storytelling section on the homepage.

- [ ] Task: Implement "Problem" Visualization
    - [ ] Create a new `ProblemStats` component with high-tech "Cyber HUD" styling.
    - [ ] Implement pulsing red/amber animations for global lost pet statistics.
- [ ] Task: Implement "Solution" Narrative Transition
    - [ ] Create a smooth scroll/fade transition between the "Problem" and "Our Solution" sections.
    - [ ] Add interactive tooltips explaining how specific app features solve specific parts of the problem.
- [ ] Task: Visual Polish & Responsive Audit
    - [ ] Ensure the new narrative section is fully responsive (mobile-first).
    - [ ] Optimize 3D background interactivity within the new layout.
- [ ] Task: Conductor - User Manual Verification 'Homepage Narrative & Problem-Solution UX' (Protocol in workflow.md)

## Phase 3: Ecosystem Discovery Hub (Command Center)
**Goal:** Build a centralized interactive "map" of all available app functions.

- [ ] Task: Create Ecosystem Hub Component
    - [ ] Design and implement the "Ecosystem Command Center" view with interactive cards.
    - [ ] Map all modules (AI Vision, Triage, Social Scraper, Vet Network) to specific cards.
- [ ] Task: Integrate Hub into Navigation
    - [ ] Add a dedicated entry point for the "Ecosystem Hub" in the main navigation and homepage.
- [ ] Task: Write Integration Tests for Ecosystem Hub
    - [ ] Verify that all cards correctly link to their respective modules.
- [ ] Task: Conductor - User Manual Verification 'Ecosystem Discovery Hub (Command Center)' (Protocol in workflow.md)

## Phase 4: Interactive Onboarding & System Tour
**Goal:** Implement the guided system tour for new users.

- [ ] Task: Implement Guided Tour Logic
    - [ ] Integrate a lightweight onboarding library or custom stylized overlay.
    - [ ] Create steps for the tour pointing to key modules (Vision, Triage, Search).
- [ ] Task: Visual Integration with 3D Background
    - [ ] Ensure the tour overlays interact correctly with the active 3D scenes.
- [ ] Task: Final End-to-End Verification
    - [ ] Verify the entire "First Time User" flow from landing to tour completion.
- [ ] Task: Conductor - User Manual Verification 'Interactive Onboarding & System Tour' (Protocol in workflow.md)
