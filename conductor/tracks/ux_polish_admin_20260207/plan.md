# Implementation Plan: UX Polish & Admin Organization

## Phase 1: Foundation & Localization (Infrastructure) [checkpoint: cd301cf]
**Goal:** Prepare the localization layer and design system tokens for the new UI structure.

- [x] Task: Audit `translations.ts` and `i18n.ts` for truncated strings [cd301cf]
    - Search for keys ending in `...` or with vague names like `loading`.
    - Create new, descriptive keys for all Auth labels, placeholders, and error messages.
    - Add keys for Admin categories: `operations`, `community`, `system`.
- [x] Task: Define new CSS/Tailwind utility classes for Glassmorphism 2.0 Side-Split [cd301cf]
    - Ensure classes for `glass-card-premium` and `cinematic-split` are defined in `index.css`.
- [x] Task: Conductor - User Manual Verification 'Foundation & Localization' (Protocol in workflow.md) [cd301cf]

## Phase 2: Auth Flow Redesign
**Goal:** Implement the premium, responsive side-split authentication experience.

- [ ] Task: Create responsive Vitest tests for `Auth.tsx`
    - Write failing tests that verify the presence of the side-split container on desktop (>1024px).
    - Verify centered card positioning on mobile (<768px).
- [ ] Task: Refactor `Auth.tsx` JSX for Side-Split & Centered Card
    - Implement the cinematic 3D background wrapper on one side.
    - Implement the centered glassmorphic card for the form interaction.
    - Use `framer-motion` for smooth transitions between Login and Register states.
- [ ] Task: Polish Auth Form Details
    - Replace short/incomplete strings with new localized keys.
    - Ensure input focus states match "Material You" primary colors.
    - Optimize vertical padding for mobile "Thumb Zone" accessibility.
- [ ] Task: Conductor - User Manual Verification 'Auth Flow Redesign' (Protocol in workflow.md)

## Phase 3: Admin Command Center Reorganization
**Goal:** Refactor the Admin Dashboard into a highly organized, technical "Cyber HUD" interface.

- [ ] Task: Create Vitest navigation tests for `AdminDashboard.tsx`
    - Verify that tabs are grouped into collapsible categories.
    - Verify that the sidebar can be toggled/collapsed.
- [ ] Task: Refactor Sidebar into Thematic Groups
    - Group existing tabs into:
        - **Operations:** Pets, Clinics, Verifications, Adoption Requests.
        - **Community:** Users, Gamification, Social Discovery.
        - **System:** Logs, AI Tuning, Config, Translation Health.
    - Add Lucide technical icons for each category.
- [ ] Task: Implement Live Status Indicators & High-Density Styling
    - Add pulsing status dots next to headers (e.g., Amber for pending verifications).
    - Apply technical "Cyber HUD" styling (glowing borders, monospaced status text).
    - Implement the collapsible sidebar toggle to expand data tables.
- [ ] Task: Conductor - User Manual Verification 'Admin Command Center Reorganization' (Protocol in workflow.md)

## Phase 4: Global Copy Audit & Refinement
**Goal:** Final pass to eliminate all "incomplete copy" and ensure responsive perfection.

- [ ] Task: Audit and fix Pet/Clinic cards
    - Update `AdoptionCenter.tsx`, `FindVet.tsx`, and `AdoptionMap.tsx`.
    - Fix truncated titles or descriptions using flexible flexbox layouts or tooltips.
- [ ] Task: Refactor "..." loading states in buttons
    - Replace `...` with descriptive localized strings (e.g., `Processing...`, `Locating...`) or accessible spinners.
- [ ] Task: Final Responsive & Accessibility Verification
    - Test all new components across 375px, 768px, and 1440px widths.
    - Verify ARIA labels for the new Admin categories and collapsible states.
- [ ] Task: Conductor - User Manual Verification 'Global Copy Audit & Refinement' (Protocol in workflow.md)
