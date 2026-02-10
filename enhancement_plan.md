# PawPrintFind Technical Enhancement Plan

This document outlines prioritized technical improvements to elevate the codebase to production standards.

## 1. 🚨 Critical Refactoring (DRY & Structure)
*   **Unify Pet Cards:** Consolidate `PetCard` (Dashboard), `MissionCard` (Volunteer), and adoption cards into a single, polymorphic `<PetCard />` component with variant props (e.g., `variant="owner" | "adoption" | "mission"`).
*   **Service Layer Cleanup:** The `firebase.ts` service is becoming a "God Object". Split it into dedicated domain services:
    *   `services/auth.ts`
    *   `services/pet.ts`
    *   `services/vet.ts`
    *   `services/admin.ts`
*   **Router Logic:** Move route-based rendering logic from `App.tsx` into a dedicated `AppRouter.tsx` to declutter the main entry point.

## 2. 🛡️ Type Safety & Security
*   **Eliminate `any`:** There are ~236 instances of `any`. Replace these with strict Zod schemas or TypeScript interfaces, especially in:
    *   `services/firebase.ts` (API responses)
    *   `components/ui` (Props)
*   **Zod Integration:** Enforce Zod validation on all form inputs (Auth, Pet Registration) before data reaches the service layer.

## 3. ⚡ Performance Optimization
*   **Code Splitting:** Implement `React.lazy` for heavy routes (e.g., `AdoptionMap`, `ThreeJS` scenes) to reduce initial bundle size.
*   **Image Optimization:** Replace standard `<img>` tags with a smart `<Image />` component that handles lazy loading, blur-up placeholders, and WebP format selection.
*   **Memoization:** Audit `useMemo` and `useCallback` usage in `Dashboard.tsx` and map components to prevent unnecessary re-renders during state updates.

## 4. ♿ Accessibility (a11y)
*   **ARIA Attributes:** Add `aria-label`, `aria-expanded`, and `role` attributes to all custom "Glass" buttons and interactive cards.
*   **Keyboard Navigation:** Ensure the new "Cinematic Split" Auth screen and Modals trap focus correctly and support `Esc` to close.
*   **Contrast Audit:** Verify that the "Paw Print Teal" text on dark backgrounds meets WCAG AA standards.

## 5. 🌍 Localization & Copy
*   **Hardcoded String Audit:** Scan for remaining hardcoded strings (e.g., "Order Safe Paw NFC Tag") and move them to `translations/*.ts`.
*   **Dynamic Plurals:** Ensure "matches found" and "users active" strings use proper i18next pluralization support.

## 6. 🎨 UI/UX Polish
*   **Loading Skeletons:** Replace spinners with UI skeletons that match the shape of the content (Cards, Lists) to reduce layout shift (CLS).
*   **Scroll Management:** Ensure all modal and split-screen layouts handle overflow gracefully on small vertical screens (fixed in `Auth.tsx`).
