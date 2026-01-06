# Plan: UI Enhancement & Contrast Audit

## Phase 1: Contrast Audit & Global Theme Update [checkpoint: 35c66a8]
- [x] Task: Audit and update Tailwind config for accessible color palette [d090c7c]
    - [ ] Sub-task: Create a new test file `tailwind.contrast.test.ts` to programmatically check contrast ratios of defined colors.
    - [ ] Sub-task: Implement the contrast check logic using a library like `tinycolor2` or custom logic to ensure WCAG 2.1 AA compliance (4.5:1).
    - [ ] Sub-task: Run tests and verify they fail for existing low-contrast combinations.
    - [ ] Sub-task: Update `tailwind.config.js` and CSS variables to adjust "Paw Print Teal" and surface colors for higher contrast.
    - [ ] Sub-task: Rerun tests to ensure all color combinations now pass.
- [x] Task: Apply global text color fixes [d5aacbf]
- [x] Task: Fix Day Theme regression [e0b2e00]
    - [ ] Sub-task: Revert forced `dark` class in `App.tsx` to restore Light Mode capability.
    - [ ] Sub-task: Verify `index.css` Dark Mode variables are correctly applied when `html` has `dark` class.
- [x] Task: Conductor - User Manual Verification 'Contrast Audit & Global Theme Update' (Protocol in workflow.md) [bccd342]

## Phase 2: "Cinematic" Background Refinement
- [x] Task: Refine 3D Particles & Motion [372d482]
    - [ ] Sub-task: Create `Background.test.tsx` to test the existence and basic properties of the Three.js scene.
    - [ ] Sub-task: Update `Background.tsx` (or equivalent Three.js component) to use smoother gradients and organic motion.
    - [ ] Sub-task: Verify 60fps performance target using a performance monitoring utility or test.
- [x] Task: Implement Interactive Background [fa491e8]
    - [ ] Sub-task: Add tests in `Background.test.tsx` for mouse movement event listeners.
    - [ ] Sub-task: Implement parallax effects and particle attraction/repulsion in `Background.tsx`.
- [ ] Task: Conductor - User Manual Verification '"Cinematic" Background Refinement' (Protocol in workflow.md)

## Phase 3: Component-Specific Visibility Fixes
- [ ] Task: Fix visibility in Dashboard components
    - [ ] Sub-task: Create `DashboardVisibility.test.tsx` to check text visibility in `Dashboard.tsx`, `VetDashboard.tsx`, etc.
    - [ ] Sub-task: Apply glassmorphism overlays or text shadows to ensuring readability.
- [ ] Task: Fix visibility in Adoption Center
    - [ ] Sub-task: Create `AdoptionCenterVisibility.test.tsx` to check text visibility in `AdoptionCenter.tsx` and `AdoptionMap.tsx`.
    - [ ] Sub-task: specific overrides for map labels and card text.
- [ ] Task: Conductor - User Manual Verification 'Component-Specific Visibility Fixes' (Protocol in workflow.md)

## Phase 4: Final Polish & Accessibility Review
- [ ] Task: Material 3 State Layers
    - [ ] Sub-task: Create `InteractiveElements.test.tsx` to verify hover/focus states on buttons and links.
    - [ ] Sub-task: Implement proper Material 3 state layer styles (ripples, elevation changes) across all shared UI components.
- [ ] Task: Final Accessibility Audit
    - [ ] Sub-task: Run a full accessibility audit using a tool like `axe-core` in a test suite `Accessibility.test.tsx`.
    - [ ] Sub-task: Fix any remaining WCAG 2.1 AA violations.
- [ ] Task: Conductor - User Manual Verification 'Final Polish & Accessibility Review' (Protocol in workflow.md)