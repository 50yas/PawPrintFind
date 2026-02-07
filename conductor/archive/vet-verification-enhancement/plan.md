# Implementation Plan: Vet Verification Enhancement

## Phase 1: Security & Schema [checkpoint: fd7fa76]
- [x] Task: Update Firestore Rules [abfdbe0]
    - Add rules for `vet_verification_requests`.
    - Ensure only owners can read/create their requests.
    - Ensure admins can read/update all requests.
- [x] Task: Define Zod Schema for Verification Request [fd7fa76]
    - Create `VetVerificationRequestSchema` in `types.ts`.
    - Update `dbService.submitVetVerification` to use validation.

## Phase 2: Verification UI Refactor [checkpoint: abfdbe0]
- [x] Task: Enhance `VetVerificationModal.tsx` [abfdbe0]
    - Add document type selection.
    - Improve upload progress UI.
    - Add better error handling and success states.
- [x] Task: Unify Frontend Flow [abfdbe0]
    - Remove `VetVerification.tsx`.
    - Update `VetDashboard.tsx` to use `VetVerificationModal.tsx`.
    - Ensure the dashboard shows current status (Pending/Rejected).

## Phase 3: Administrative Tools [checkpoint: abfdbe0]
- [x] Task: Create Admin Verification HUD [abfdbe0]
    - Implement a component to list pending `vet_verification_requests`.
    - Add Approve/Reject actions with audit logging.
- [x] Task: Integrate HUD into Admin Dashboard [abfdbe0]
    - Add a new tab or section in `AdminDashboard.tsx` for Vet Verifications.

## Phase 4: Final Polish & Audit [checkpoint: abfdbe0]
- [x] Task: Audit Vet Section [abfdbe0]
    - Review `MyClinic.tsx` and `AddClinicModal.tsx` for consistency.
    - Ensure all Vet-related service calls are properly handled and logged.
- [x] Task: Verification & Testing [abfdbe0]
    - Write unit tests for the new verification logic.
    - Verify the full flow from Vet submission to Admin approval.