# Specification: Mobile UI/UX Overhaul & Cinematic Visuals

## 1. Overview
This track focuses on elevating the mobile experience of the Paw Print application. It addresses critical usability issues (menu scrolling, occlusion), implements a new futuristic navigation pattern, and introduces a "Biometric Data Stream" 3D background. The goal is to merge "Glassmorphism 2.0" aesthetics with robust mobile functionality.

## 2. Functional Requirements

### 2.1 Enhanced Mobile Navigation
-   **Fixed Positioning:** The top menu bar must remain fixed (`sticky` or `fixed`) at the top during scroll events on mobile devices.
-   **Z-Index Management:** The menu must not overlap or occlude critical interaction layers like the Login/Auth modal forms.
-   **"More" Options (Bottom Sheet):**
    -   Replace the limited mobile menu items with a "More" or "Grid" trigger button.
    -   Action opens a **Glass-effect Bottom Sheet** containing the full site navigation (Adoption, Vets, Blog, Admin, Settings, etc.).
    -   Maintain the "pulsing" and "Cyber HUD" aesthetic for the trigger button.

### 2.2 Console Output Widget Refactor
-   **Relocation:** Move the "Console Output" component (currently top-left absolute) to the bottom of the screen on mobile devices and find a better spot in the web version that doesn't cover the main text.
-   **Behavior:** Ensure it does not obscure the main hero text or CTA buttons.
-   **Styling:** Maintain the specific code structure provided (HUD style, typewriter effect) but adjust `top/left` positioning classes for mobile (`bottom-4`, etc.).

### 2.3 Cinematic Background Redesign ("Biometric Data Stream")
-   **Concept:** "Biometric Data Stream" – A 3D particle system representing the AI matching process.
-   **Visuals:**
    -   Floating "digital dust" and glowing connection lines.
    -   Abstract shapes morphing (e.g., DNA helix $\leftrightarrow$ Paw Print).
-   **Responsiveness:**
    -   **Mobile:** Reduced particle count for performance (60fps target).
    -   **Desktop:** Full-fidelity rendering with depth-of-field effects.

## 3. Non-Functional Requirements
-   **Performance:** Background animation must not cause scroll jank on mid-range mobile devices.
-   **Aesthetic:** Adhere strictly to the "Glassmorphism 2.0" (translucency, blur, deep gradients) and "Cyber HUD" design systems.
-   **Browser Support:** Ensure Safari mobile compatibility (fix specific "jumping" nav bar issues).

## 4. Out of Scope
-   Backend API changes (unless required for new menu items).
-   Redesign of the Desktop Sidebar (focus is Mobile/Tablet).
