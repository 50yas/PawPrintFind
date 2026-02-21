# Implementation Plan: Vet Verification Hardening & Admin Audit System

## Phase 1: Technical Infrastructure & Bug Fixes [checkpoint: 5864fd1]
Goal: Resolve immediate technical blockers (CORS, COOP, Firestore Rules) to stabilize the development environment.

- [x] **Task: Fix Firestore Permission Denied on Aggregation Queries**
    - [x] Sub-task: Update `firestore.rules` to allow `get` and `list` (and thus `runAggregationQuery`) on the `users` collection for authenticated Admins.
    - [x] Sub-task: Verify `RunAggregationQuery` no longer throws `permission-denied` in the browser console.
- [x] **Task: Fix Cloud Function CORS Policy for `smartSearch`**
    - [x] Sub-task: Modify `functions/src/index.ts` (or the specific file where `smartSearch` is defined) to include correct CORS headers (using `cors` middleware or manual header setting).
    - [x] Sub-task: Ensure the allowed origins include both `http://localhost:3000`, `http://localhost:3001`, and the production domain.
- [x] **Task: Resolve AI Protocol Initialization Failure**
    - [x] Sub-task: Investigate the `functions/internal` error in `App.tsx`'s `initAISystem` and `functions/src/usage.ts`.
    - [x] Sub-task: Fix potential configuration or initialization order issues in the AI startup protocol.
- [x] **Task: Address Auth COOP Warnings**
    - [x] Sub-task: Check Firebase Auth configuration and ensure proper headers are set (if manageable via Firebase Console or hosting config) to resolve the `Cross-Origin-Opener-Policy` warnings.
- [x] **Task: Conductor - User Manual Verification 'Technical Infrastructure & Bug Fixes' (Protocol in workflow.md)**

## Phase 2: Vet Verification Hardening (Data & Service)
Goal: Update the backend logic and data models to support the full verification lifecycle.

- [ ] **Task: Update User Type and Schema**
    - [ ] Sub-task: Add `verificationStatus` ('none', 'pending', 'approved', 'declined'), `verificationSubmittedAt`, and `rejectionReason` to the `User` interface in `src/types.ts`.
    - [ ] Sub-task: Update Zod schema for `User` validation in `src/types.ts`.
- [ ] **Task: Implement Admin Verification Actions in `adminService`**
    - [ ] Sub-task: Create or update `approveVet(uid: string)` and `declineVet(uid: string, reason: string)` methods in `src/services/adminService.ts`.
    - [ ] Sub-task: Ensure these methods correctly update the user's `verificationStatus` and `role` (if applicable).
- [ ] **Task: Conductor - User Manual Verification 'Vet Verification Hardening (Data & Service)' (Protocol in workflow.md)**

## Phase 3: Vet Verification UI (Client)
Goal: Implement the conditional UI for Vets to submit, track, and resubmit their verification.

- [ ] **Task: Implement "Pending" Banner and UI Locking**
    - [ ] Sub-task: Update `VetDashboard.tsx` or the relevant verification component to check `user.verificationStatus`.
    - [ ] Sub-task: If `pending`, hide the submission form and display a high-visibility "Under Review" banner.
- [ ] **Task: Implement Decline/Rejection Feedback UI**
    - [ ] Sub-task: If `declined`, show the verification form again with a prominent alert box displaying the `rejectionReason` provided by the Admin.
- [ ] **Task: Conductor - User Manual Verification 'Vet Verification UI (Client)' (Protocol in workflow.md)**

## Phase 4: Admin Audit Suite & Functionality Map
Goal: Create a centralized "Command Center" for Admins to monitor and test all system features.

- [ ] **Task: Create Admin Test Suite Component**
    - [ ] Sub-task: Create `src/components/admin/TestSuiteTab.tsx` with a mapped list of all app functionalities.
    - [ ] Sub-task: Implement "Quick Check" buttons for each feature (e.g., checking if Gemini API is responding, Firestore rules are active, etc.).
- [ ] **Task: Integrate Test Suite into `AdminDashboard.tsx`**
    - [ ] Sub-task: Add a new "Test Suite" tab to the Admin Dashboard navigation.
- [ ] **Task: Conductor - User Manual Verification 'Admin Audit Suite & Functionality Map' (Protocol in workflow.md)**
