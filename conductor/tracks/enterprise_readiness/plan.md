# Implementation Plan: Enterprise Production Readiness

## Phase 1: Security Audit & Hardening
- [~] Task: Firestore Rules Audit
    - [~] Sub-task: Update `pets` rules to restrict editing to owners/guardians or admins.
    - [ ] Sub-task: Secure `donations` collection (admin-only read/update/delete).
    - [ ] Sub-task: Secure `chats` collection (participant-only access).
    - [ ] Sub-task: Secure `vet_clinics` collection (vet-only or admin-only write).
- [ ] Task: Input Validation
    - [ ] Sub-task: Audit `firebase.ts` and `petService.ts` to ensure all writes use Zod validation.

## Phase 2: Performance Optimization
- [ ] Task: Bundle Optimization
    - [ ] Sub-task: Implement lazy loading for all route components.
    - [ ] Sub-task: Audit `package.json` for unused dependencies.
- [ ] Task: 3D Graphics Polish
    - [ ] Sub-task: Optimize the Three.js render loop in `Background.tsx` for mobile.

## Phase 3: Observability & Monitoring
- [ ] Task: Analytics Service
    - [ ] Sub-task: Create `services/analyticsService.ts`.
    - [ ] Sub-task: Instrument "Wow" features (Smart Search, Health Alerts) with event tracking.
- [ ] Task: Error Handling
    - [ ] Sub-task: Update `ErrorBoundary` to support remote logging.
