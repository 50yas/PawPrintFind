# Implementation Plan: Pet Clickability & UX Localization

## Phase 1: UX Localization [DONE]
- [x] Task: Update `translations/it.ts` with "Adozioni" and "Smarriti" values.
- [x] Task: Verify header implementation in `LostPetsCenter.tsx` and `AdoptionCenter.tsx` uses correct keys.

## Phase 2: Navigation Hardening [DONE]
- [x] Task: Update `App.tsx` navigation logic to use direct state updates and `window.history.pushState`.
- [x] Task: Implement robust `popstate` listener in `App.tsx` for deep-linking.
- [x] Task: Ensure `AppRouter.tsx` prioritizes `publicPetDetail` rendering.
- [x] Task: Verify `onViewPet` prop drilling through `UserRouter`, `VetRouter`, and `ShelterRouter`.

## Phase 3: Interaction Hardening [DONE]
- [x] Task: Refactor `LostPetCard` and `AdoptionCard` to use `onPointerDown`.
- [x] Task: Update `PetCard.tsx` variants (`Community`, `Mission`, `Shelter`) with `onPointerDown` and button filtering.
- [x] Task: Make `HeroScanner` in `Home.tsx` clickable via `onViewPet`.

## Phase 4: Final Verification
- [x] Task: Verify card clickability on all views.
- [x] Task: Verify browser back/forward button behavior.
- [x] Task: Conductor - User Manual Verification 'Pet Clickability & UX Localization'.
