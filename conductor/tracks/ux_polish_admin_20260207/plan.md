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

## Phase 2: Auth Flow Redesign [checkpoint: f4fc1bc]
**Goal:** Implement the premium, responsive side-split authentication experience.

- [x] Task: Create responsive Vitest tests for `Auth.tsx` [f4fc1bc]
    - Write failing tests that verify the presence of the side-split container on desktop (>1024px).
    - Verify centered card positioning on mobile (<768px).
- [x] Task: Refactor `Auth.tsx` JSX for Side-Split & Centered Card [f4fc1bc]
    - Implement the cinematic 3D background wrapper on one side.
    - Implement the centered glassmorphic card for the form interaction.
    - Use `framer-motion` for smooth transitions between Login and Register states.
- [x] Task: Polish Auth Form Details [f4fc1bc]
    - Replace short/incomplete strings with new localized keys.
    - Ensure input focus states match "Material You" primary colors.
    - Optimize vertical padding for mobile "Thumb Zone" accessibility.
- [x] Task: Conductor - User Manual Verification 'Auth Flow Redesign' (Protocol in workflow.md) [f4fc1bc]

## Phase 3: Admin Command Center Reorganization [checkpoint: d378d23]
**Goal:** Refactor the Admin Dashboard into a highly organized, technical "Cyber HUD" interface.

- [x] Task: Create Vitest navigation tests for `AdminDashboard.tsx` [d378d23]
    - Verify that tabs are grouped into collapsible categories.
    - Verify that the sidebar can be toggled/collapsed.
- [x] Task: Refactor Sidebar into Thematic Groups [d378d23]
    - Group existing tabs into:
        - **Operations:** Pets, Clinics, Verifications, Adoption Requests.
        - **Community:** Users, Gamification, Social Discovery.
        - **System:** Logs, AI Tuning, Config, Translation Health.
    - Add Lucide technical icons for each category.
- [x] Task: Implement Live Status Indicators & High-Density Styling [d378d23]
    - Add pulsing status dots next to headers (e.g., Amber for pending verifications).
    - Apply technical "Cyber HUD" styling (glowing borders, monospaced status text).
    - Implement the collapsible sidebar toggle to expand data tables.
- [x] Task: Conductor - User Manual Verification 'Admin Command Center Reorganization' (Protocol in workflow.md) [d378d23]

## Phase 4: Global Copy Audit & Refinement [checkpoint: 4df7c30]
**Goal:** Final pass to eliminate all "incomplete copy" and ensure responsive perfection.

- [x] Task: Audit and fix Pet/Clinic cards [4df7c30]
    - Update `AdoptionCenter.tsx`, `FindVet.tsx`, and `AdoptionMap.tsx`.
    - Fix truncated titles or descriptions using flexible flexbox layouts or tooltips.
- [x] Task: Refactor "..." loading states in buttons [4df7c30]
    - Replace `...` with descriptive localized strings (e.g., `Processing...`, `Locating...`) or accessible spinners.
- [x] Task: Final Responsive & Accessibility Verification [4df7c30]
    - Test all new components across 375px, 768px, and 1440px widths.
    - Verify ARIA labels for the new Admin categories and collapsible states.
- [x] Task: Conductor - User Manual Verification 'Global Copy Audit & Refinement' (Protocol in workflow.md) [4df7c30]
