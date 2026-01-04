# Plan: Unified Access & Enhanced Adoption Logic

## Phase 1: Unified Navigation & Routing [checkpoint: ]
- [x] Task: Update `translations.ts` and locale files with new navigation and chat template strings. 86b989a
- [x] Task: Write unit tests for the `Navbar` to ensure "Home" and "Adoption Center" links appear for authenticated users. a4df805
- [x] Task: Refactor `Navbar.tsx` to display public navigation links for all user roles. 7a75543
- [x] Task: Refactor `UserRouter.tsx`, `ShelterRouter.tsx`, `VetRouter.tsx`, and `VolunteerRouter.tsx` to handle the `adoptionCenter` and `home` views. e3f25fe
- [~] Task: Conductor - User Manual Verification 'Unified Navigation & Routing' (Protocol in workflow.md)

## Phase 2: Adoption Center Map Integration [checkpoint: ]
- [x] Task: Create a new `AdoptionMap.tsx` component (reusing logic from `MissingPetsMap.tsx`) tailored for adoptable pets. c240feb
- [x] Task: Write tests for `AdoptionMap` to verify it correctly filters and displays only pets with `status: "forAdoption"`. c240feb
- [x] Task: Implement the "Locate Me" functionality using the `useGeolocation` hook within the map. c240feb
- [x] Task: Update `AdoptionCenter.tsx` to render the `AdoptionMap` and handle the "Adopt Me" callback from markers. c240feb
- [~] Task: Conductor - User Manual Verification 'Adoption Center Map Integration' (Protocol in workflow.md)

## Phase 3: Secure Chat & Smart Templates [checkpoint: ]
- [x] Task: Write unit tests for the localized "Smart Template" generator. f460e39
- [x] Task: Implement a utility function in `services/petService.ts` or similar to generate adoption inquiry templates based on the user's locale. f460e39
- [x] Task: Enhance the `handleStartChat` logic in `App.tsx` to support automated initial messages using the smart templates. f460e39
- [x] Task: Update the "Adopt Me" button in both the `AdoptionCenter` cards and the Map markers to trigger the enhanced chat protocol. f460e39
- [~] Task: Conductor - User Manual Verification 'Secure Chat & Smart Templates' (Protocol in workflow.md)

## Phase 4: Final Polish & UX Audit [checkpoint: ]
- [x] Task: Conduct a mobile responsiveness audit for the new map and navigation elements. f6da426
- [x] Task: Ensure zero layout shifts when switching between the dashboard and the adoption map. f6da426
- [x] Task: Verify that unauthenticated users can still access all public pages as before. f6da426
- [x] Task: Conductor - User Manual Verification 'Final Polish & UX Audit' (Protocol in workflow.md) f6da426

## Phase 5: Global Translation Enhancement [checkpoint: ]
- [x] Task: Review and refine all strings in `translations/` (it, en, es, fr, de, ar, zh, ro) to ensure premium, natural phrasing. f6da426
- [x] Task: Ensure consistency in terminology (e.g., "Adopt" vs "Rescue") across all languages. f6da426
- [x] Task: Use the Gemini AI to verify cultural nuances and right-to-left (RTL) formatting for Arabic. f6da426
- [x] Task: Conductor - User Manual Verification 'Global Translation Enhancement' (Protocol in workflow.md) f6da426
