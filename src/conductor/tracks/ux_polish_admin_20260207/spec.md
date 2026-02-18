# Track Specification: UX Polish & Admin Organization

## 1. Overview
This track focuses on enhancing the visual polish and usability of the application, specifically addressing "incomplete copy" (truncated text, placeholders) across key views. It also introduces a major reorganization of the Admin Command Center to improve navigation efficiency and implements a premium, responsive redesign of the Authentication flows (Login/Register).

## 2. Functional Requirements

### 2.1 Authentication Flow Redesign (`Auth.tsx`)
- **Desktop Layout:** Implement a **Side-Split** design.
    - **Left/Right Split:** One half displays the cinematic 3D background/branding; the other half hosts the interaction area.
    - **Centered Glass Card:** Within the interaction area, the login/register form is contained in a centered, glassmorphic card to maintain focus and aesthetic consistency.
- **Mobile Layout:** Fully responsive, full-height design.
    - Ensure input fields and buttons fit comfortably within the "Thumb Zone" without requiring scrolling on standard devices.
- **Form Polish:**
    - Update all input labels and placeholders to be descriptive and fully localized.
    - Ensure error messages are clear, helpful, and do not truncate.

### 2.2 Global Copy & UI Audit
- **Objective:** Eliminate "incomplete copy" such as button text ending in "..." or vague labels.
- **Scope:**
    - **Auth Forms:** As detailed above.
    - **Admin Dashboards:** Ensure action buttons (e.g., "Verify", "Suspend", "Edit") and status badges have full, meaningful text and utilize tooltips if space is strictly limited.
    - **Public Views:** Review `FindVet.tsx`, `AdoptionCenter.tsx`, and `AdoptionMap.tsx` (Pet/Clinic cards) to ensure descriptions and titles wrap correctly and are not prematurely truncated.

### 2.3 Admin Command Center Reorganization (`AdminDashboard.tsx`)
- **Sidebar Structure:** Refactor the flat list into collapsible **Thematic Groups**:
    - **Operations:** Pet Management, Clinic Verifications, Adoption Requests.
    - **Community:** User Management, Gamification/Badges, Social Discovery.
    - **System:** System Logs, AI Tuning HUD, Configuration.
- **Visual Style:** Adhere to the "Cyber HUD" aesthetic.
    - **High-Density Mode:** Use compact rows and technical iconography.
    - **Status Indicators:** Add live status dots (Green/Red/Amber) next to group headers or tabs where applicable (e.g., "Verifications" shows a dot if pending items exist).
- **Interactivity:**
    - Implement a **Collapsible Sidebar** toggle to allow the data tables to expand and occupy the full width of the screen.

## 3. Non-Functional Requirements
- **Responsiveness:** All changes must be verified on Mobile (375px+), Tablet, and Desktop resolutions.
- **Accessibility:** Ensure the new Admin sidebar is keyboard navigable and screen-reader friendly (aria-expanded attributes).
- **Localization:** All new text labels and categories must be added to `translations.ts`.

## 4. Out of Scope
- Backend logic changes (unless required for new data grouping, though mostly UI organization).
- Adding new major features not listed (e.g., new AI models).
