# Implementation Plan - Track: Mobile UI/UX Overhaul & Cinematic Visuals

## Phase 1: Navigation & Layout Core Fixes
- [x] Task: Enhanced Mobile Navigation - TDD Setup [cf9c5ce]
    - [x] Create test file `components/NavbarMobile.test.tsx`.
    - [x] Write failing tests verifying fixed positioning logic and Z-index layering against modals.
    - [x] Write failing tests for the new "More" button trigger visibility.
- [x] Task: Enhanced Mobile Navigation - Implementation [cf9c5ce]
    - [x] Refactor `components/Navbar.tsx` (and `components/MobileNavigation.tsx`) to use `fixed` positioning.
    - [x] Implement Z-index fixes to ensure Navbar stays above content but below critical overlays if needed (or correct stacking context).
    - [x] Implement the "More Options" trigger button with pulsing animation.
- [x] Task: Glass-Effect Bottom Sheet Navigation [cf9c5ce]
    - [x] Create `components/NavigationBottomSheet.tsx`.
    - [x] Implement the full-grid menu layout (Adoption, Vets, Blog, etc.) inside the sheet.
    - [x] Integrate the bottom sheet with the "More" trigger in `Navbar`.
- [x] Task: Console Output Relocation [1f1c94d]
    - [x] Refactor `components/HeroScene.tsx` (or where the Console widget resides).
    - [x] Change CSS positioning from absolute top-left to a non-obtrusive bottom location for ALL breakpoints (Web & Mobile).
    - [x] Ensure it aligns with the footer area or bottom corners, clear of central content.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Navigation & Layout Core Fixes' (Protocol in workflow.md) [checkpoint: 19664c2]

## Phase 2: Cinematic Background Redesign ("Biometric Data Stream")
- [x] Task: Three.js Scene Setup - TDD
    - [x] Create `components/BiometricBackground.test.tsx` (mocking Three.js/Canvas).
    - [x] Write tests verifying the component renders without crashing and accepts responsiveness props.
- [x] Task: Particle System Implementation [e5b257b]
    - [ ] Create/Update `components/Background.tsx` or `components/BiometricBackground.tsx`.
    - [ ] Implement the "Digital Dust" particle system using `react-three-fiber`.
    - [ ] Add the "DNA Helix <-> Paw Print" morphing logic.
- [x] Task: Performance Optimization [dc603c9]
    - [ ] Implement adaptive particle counts based on device tier (Mobile vs Desktop).
    - [ ] Ensure `useFrame` loops are optimized.
- [ ] Task: Integration & Polish
    - [ ] Replace the old background in `App.tsx` or `components/HeroScene.tsx` with the new Biometric component.
    - [ ] Fine-tune colors to match the "Paw Print Teal" and Cyber HUD aesthetic.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Cinematic Background Redesign' (Protocol in workflow.md)
