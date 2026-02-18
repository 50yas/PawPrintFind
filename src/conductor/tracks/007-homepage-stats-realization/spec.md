# Specification: 007-homepage-stats-realization

## Goal
The goal of this track is to transition the "Impatto della Piattaforma" (Platform Impact) section on the homepage from hardcoded numbers to real, live data fetched from Firestore.

## User Experience (UX)
- The user should see accurate and up-to-date statistics about the platform's impact.
- The "CountUp" animation should remain, but the target values should be dynamic.
- Statistics should load seamlessly without introducing significant latency.

## Key Statistics to Transition
1.  **Animali Protetti (Pets Protected):** Total number of pet profiles registered in the system.
2.  **Match Riusciti (Successful Matches):** Total number of pets marked as "Found" (isLost: false) that were previously "Lost".
3.  **Membri della Community (Community Members):** Total number of registered users.
4.  **Partner Veterinari (Vet Partners):** Total number of registered veterinary clinics.
5.  **Tempo di Risposta Medio (Average Response Time):** Calculated or system-defined average response time for lost pet reports.
6.  **Città Attive (Active Cities):** Count of unique cities/locations represented in the pets and clinics data.

## Technical Architecture
- **Service Layer:** Enhance `adminService.getPublicStats` to return a more comprehensive set of statistics.
- **UI Integration:** Update `src/components/Home.tsx` to call `getPublicStats` within a `useEffect` hook and update the local state.
- **Caching (Optional):** Consider a short-term local cache or a dedicated Firestore document for aggregated stats to minimize read costs if traffic scales.

## Success Criteria
- The "Impatto della Piattaforma" section displays real data from Firestore.
- No regression in homepage performance or visual animations.
- The numbers reflect the actual state of the database.
