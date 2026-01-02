# Plan: Google-Level UI/UX Enhancement (Material You)

## Phase 1: Foundation - Dynamic Color & Theme Setup [checkpoint: af61382]
- [x] Task: Create a new `theme.ts` utility that generates a dynamic color palette (Primary, Secondary, Tertiary, Surface, Error) from a single seed color ("Paw Print Teal": `#008080`). 1970a01
- [x] Task: Update `tailwind.config.js` to extend the theme with these new dynamic color tokens (e.g., `primary`, `on-primary`, `surface-container`). 0ddfa0a
- [x] Task: Refactor `index.css` to define CSS variables for the color tokens, ensuring dark mode compatibility. c1df8ac
- [x] Task: Conductor - User Manual Verification 'Foundation - Dynamic Color & Theme Setup' (Protocol in workflow.md) 24077f0

## Phase 2: Component Refactor - Glassmorphism & Interaction [checkpoint: 9a57ced]
- [x] Task: Refactor the `GlassCard` component to use the new `surface-container-low` tokens and add a subtle border/shadow for better accessibility. 9a57ced
- [x] Task: Refactor the `GlassButton` component to implement Material 3 state layers (hover, focus, press ripples) and dynamic elevation. 9a57ced
- [x] Task: Create a reusable `Snackbar` component for system notifications (success, error, info) using the new design system. 9a57ced
- [x] Task: Conductor - User Manual Verification 'Component Refactor - Glassmorphism & Interaction' (Protocol in workflow.md) 9a57ced

## Phase 3: Core Experience - Home & Maps
- [x] Task: Optimize the `HeroScene` to ensure smooth 3D rendering and transitions, aligning with the new color palette. e009bba
- [x] Task: Update the `MissingPetsMap` and `SightingsMap` to use custom map markers that match the Material You theme. e009bba
- [ ] Task: Implement "Skeleton Loaders" for the map sidebar and adoption center cards to prevent layout shifts during data loading.
- [ ] Task: Conductor - User Manual Verification 'Core Experience - Home & Maps' (Protocol in workflow.md)

## Phase 4: Polish & Performance
- [ ] Task: Conduct a responsive design audit on the Landing Page and fix layout issues on small screens (375px width).
- [ ] Task: Replace standard browser alerts with the new `Snackbar` component throughout the application.
- [ ] Task: Optimize image loading strategy (implement lazy loading and proper sizing) to improve LCP.
- [ ] Task: Conductor - User Manual Verification 'Polish & Performance' (Protocol in workflow.md)