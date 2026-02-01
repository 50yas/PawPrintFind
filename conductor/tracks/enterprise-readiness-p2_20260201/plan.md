# Implementation Plan: Enterprise Readiness Phase 2

This plan outlines the steps to secure the Paw Print infrastructure, migrate sensitive AI logic to a backend proxy, and establish a robust CI pipeline with comprehensive usage tracking.

## Phase 1: Continuous Integration Setup [checkpoint: 38336ee]
- [x] Task: Create GitHub Actions Workflow [fb909fa]
    - [x] Create `.github/workflows/ci.yml`.
    - [x] Define steps for `npm install`, `npm run lint`, `npm test`, and `npm run build`.
    - [x] Verify workflow triggers on PRs to `main`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Continuous Integration Setup' (Protocol in workflow.md) [38336ee]

## Phase 2: Cloud Functions Proxy & Secret Management
- [x] Task: Initialize Firebase Functions [c078ca6]
    - [x] Set up the `functions/` directory with TypeScript.
    - [x] Configure `firebase.json` for functions deployment.
- [x] Task: Implement Usage Tracking Helpers [589af7a]
    - [x] Create a helper function `trackUsage(userId, featureName)` in Cloud Functions to increment Firestore counters.
- [x] Task: Migrate Gemini AI logic to Functions [308542b]
    - [x] Implement `visionIdentification` function with usage tracking.
    - [x] Implement `smartSearch` function with usage tracking.
    - [x] Implement `healthAssessment` function with usage tracking.
    - [x] Implement `blogGeneration` function with usage tracking.
- [ ] Task: Secure API Keys
    - [ ] Configure Firebase Secrets Manager for `GEMINI_API_KEY`.
    - [ ] Remove `VITE_GEMINI_API_KEY` from client-side `.env` and `services/firebase.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Cloud Functions Proxy' (Protocol in workflow.md)

## Phase 3: Rate Limiting & Admin Dashboard Updates
- [ ] Task: Implement Rate Limiting Middleware
    - [ ] Add logic to check user quotas against Firestore usage stats before executing AI calls.
    - [ ] Return structured errors for quota exceeded.
- [ ] Task: Update Admin Dashboard
    - [ ] Extend `AdminDashboard.tsx` to display a "User Usage" table or modal.
    - [ ] Fetch and display `usageStats` subcollection data for users.
    - [ ] Add a button to reset usage counters for a specific user.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Rate Limiting & Admin Dashboard Updates' (Protocol in workflow.md)

## Phase 4: App Check & Final Security
- [ ] Task: Enable Firebase App Check
    - [ ] Initialize App Check in the React app (`services/firebase.ts`).
    - [ ] Enforce App Check protection on Cloud Functions and Firestore.
- [ ] Task: Frontend Service Refactor
    - [ ] Refactor `services/geminiService.ts` to call the new Cloud Functions.
    - [ ] Handle rate limit errors in the UI (e.g., show a toast/notification).
- [ ] Task: Security Audit
    - [ ] Verify no secrets remain in the client bundle.
    - [ ] Verify admin controls work as expected.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: App Check & Final Security' (Protocol in workflow.md)
