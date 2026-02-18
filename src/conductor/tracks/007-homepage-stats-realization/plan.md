# Implementation Plan: 007-homepage-stats-realization

## Phase 1: Service Layer Update
**Goal:** Enhance the `adminService.getPublicStats` function in Firestore to provide more comprehensive public statistics.

- [x] Task: Update `adminService.getPublicStats` in `src/services/adminService.ts`
    - [x] Calculate "Pets Protected" (Total Pets count).
    - [x] Calculate "Successful Matches" (Pets with `isLost: false` that were previously lost - or just total pets for now, proxying if history is missing).
    - [x] Calculate "Community Members" (Total Users count).
    - [x] Calculate "Vet Partners" (Total Clinics count).
    - [x] Calculate "Active Cities" (Unique cities in `pets` and `vet_clinics` collections).
- [x] Task: Ensure public read access for stats aggregation if necessary.

## Phase 2: UI Integration
**Goal:** Replace hardcoded values in `Home.tsx` with dynamic data from the service layer.

- [x] Task: Update `src/components/Home.tsx` to fetch stats.
    - [x] Call `dbService.getPublicStats()` within a `useEffect` hook.
    - [x] Replace hardcoded values in `StatCard` components with the fetched state.
    - [x] Maintain the `useCountUp` animation for visual consistency.
- [x] Task: Add a loading state for the stats section to avoid empty values on initial render.

## Phase 3: Final Verification & Refinement
**Goal:** Verify the accuracy of the displayed data and ensure no performance regressions.

- [x] Task: Verify stats against manual database queries.
- [x] Task: Ensure the "Average Response Time" (12 minutes) is either dynamically calculated or remains as a justified system constant.
- [x] Task: Conductor - User Manual Verification (Protocol in workflow.md)
