# Implementation Plan: Homepage Storytelling & Technical Performance Audit

## Phase 1: Technical Audit & Performance Optimization
**Goal:** Clean up legacy code, optimize hooks, and improve initial load performance.

- [x] Task: Audit and Refactor React Hooks
    - [x] Identify redundant or cascading `useEffect` calls in `App.tsx`, `Home.tsx`, and `Dashboard.tsx`.
    - [x] Consolidate state management to minimize unnecessary re-renders.
- [x] Task: Optimize Firestore Read/Write Patterns
    - [x] Review `services/firebase.ts` and `services/adminService.ts` for duplicate fetching logic.
    - [x] Implement efficient `onSnapshot` listeners to replace manual `getDocs` calls where appropriate.
- [x] Task: Bundle Optimization & Code Splitting
    - [x] Audit `App.tsx` and `Home.tsx` for large component imports.
    - [x] Implement `React.lazy` and `Suspense` for heavy modules (Maps, 3D Scenes, Charts).
- [x] Task: Consolidate UI Components
    - [x] Identify duplicate "Card" or "Modal" patterns.
    - [x] Extract shared logic into reusable, high-performance base components.
- [x] Task: Conductor - User Manual Verification 'Technical Audit & Performance Optimization' (Protocol in workflow.md)

## Phase 2: Homepage Narrative & Problem-Solution UX
**Goal:** Implement the high-impact "Problem-Solution" storytelling section on the homepage.

- [x] Task: Implement "Problem" Visualization
    - [x] Create a new `ProblemStats` component with high-tech "Cyber HUD" styling.
    - [x] Implement pulsing red/amber animations for global lost pet statistics.
- [x] Task: Implement "Solution" Narrative Transition
    - [x] Create a smooth scroll/fade transition between the "Problem" and "Our Solution" sections.
    - [x] Add interactive tooltips explaining how specific app features solve specific parts of the problem.
- [x] Task: Visual Polish & Responsive Audit
    - [x] Ensure the new narrative section is fully responsive (mobile-first).
    - [x] Optimize 3D background interactivity within the new layout.
- [x] Task: Conductor - User Manual Verification 'Homepage Narrative & Problem-Solution UX' (Protocol in workflow.md)

## Phase 3: Ecosystem Discovery Hub (Command Center)
**Goal:** Build a centralized interactive "map" of all available app functions.

- [x] Task: Create Ecosystem Hub Component
    - [x] Design and implement the "Ecosystem Command Center" view with interactive cards.
    - [x] Map all modules (AI Vision, Triage, Social Scraper, Vet Network) to specific cards.
- [x] Task: Integrate Hub into Navigation
    - [x] Add a dedicated entry point for the "Ecosystem Hub" in the main navigation and homepage.
- [x] Task: Write Integration Tests for Ecosystem Hub
    - [x] Verify that all cards correctly link to their respective modules.
- [x] Task: Conductor - User Manual Verification 'Ecosystem Discovery Hub (Command Center)' (Protocol in workflow.md)

## Phase 4: Interactive Onboarding & System Tour
**Goal:** Implement the guided system tour for new users.

- [x] Task: Implement Guided Tour Logic
    - [x] Integrate a lightweight onboarding library or custom stylized overlay.
    - [x] Create steps for the tour pointing to key modules (Vision, Triage, Search).
- [x] Task: Visual Integration with 3D Background
    - [x] Ensure the tour overlays interact correctly with the active 3D scenes.
- [x] Task: Final End-to-End Verification
    - [x] Verify the entire "First Time User" flow from landing to tour completion.
- [x] Task: Conductor - User Manual Verification 'Interactive Onboarding & System Tour' (Protocol in workflow.md)
