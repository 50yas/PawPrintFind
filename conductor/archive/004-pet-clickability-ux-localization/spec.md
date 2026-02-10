# Specification: Pet Clickability & UX Localization

## Overview
Enhance user interaction reliability and localization accuracy for pet discovery features. This includes hardening touch/click events on pet cards across all views and correcting key Italian menu items to align with user expectations.

## Goals
- Resolve mobile/desktop click inconsistencies on pet cards using `onPointerDown`.
- Correct Italian translations: `adoptionLink` to "Adozioni" and `showLostPets` to "Smarriti".
- Ensure `onViewPet` prop is drilled through all routers (`UserRouter`, `VetRouter`, `ShelterRouter`, `PublicRouter`).
- Synchronize application state with URL history for `/pet/:id` deep-links.

## Functional Requirements
- Clicking/tapping any pet card (Home, Adoption, Lost, Dashboard) must open the detailed pet profile.
- Internal card buttons (Contact, Edit) must not trigger the parent card's navigation.
- The browser back/forward buttons must correctly toggle between the pet profile and the previous list view.

## Technical Requirements
- Propagate `onViewPet` handler from `App.tsx` through `AppRouter` to all leaf components.
- Use `window.history.pushState` and `popstate` events for URL synchronization.
- Implement `onPointerDown` with `closest('button')` filtering in card components.
