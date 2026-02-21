# Specification: Vet Verification Hardening & Admin Audit System

## Overview
This track focuses on making the Veterinarian verification process fully functional, from the Vet's submission to the Admin's review, while also introducing a system-wide "Functionality Map" within the Admin Dashboard for auditing. Additionally, it addresses several critical Firebase and CORS-related technical bugs that impede development and deployment.

## Functional Requirements
1.  **Functional Vet Verification Lifecycle:**
    -   **Submission:** Ensure Vet document uploads are correctly recorded in Firestore and visible to Admins.
    -   **Pending State:** Once submitted, the Vet's verification UI is replaced by a "Verification Pending" status banner. The submission form is hidden to prevent duplicate requests.
    -   **Admin Review:** Admins must be able to view, approve, or decline verification requests from the Admin Dashboard.
    -   **Decline Workflow:** If declined, the Admin provides a reason (`rejectionReason`) which is stored in the User's document.
    -   **Resubmission:** If declined, the Vet's "Verification" section reappears, displaying the Admin's reason and allowing the Vet to update and resubmit their documents.

2.  **Admin Functionality Map & Audit Suite:**
    -   Implement a new **Admin Test Suite UI** tab within the Admin Dashboard.
    -   This suite will serve as an interactive "Map" of all application functionalities (e.g., AI Search, Pet Registration, Vet Verification, etc.).
    -   Each functionality will have a status check/test button for Admins to manually or automatically verify its operational state.

3.  **Technical Bug Fixes & Hardening:**
    -   **Firestore Permission Fix:** Resolve `permission-denied` on `RunAggregationQuery` (count queries) for the `users` collection by updating `firestore.rules`.
    -   **Cloud Function CORS Fix:** Correct the CORS configuration for the `smartSearch` function to allow requests from both `localhost` and production origins.
    -   **AI Protocol Fix:** Debug and resolve the `functions/internal` error during AI system initialization.
    -   **Auth COOP Resolution:** Address the `Cross-Origin-Opener-Policy` warnings in Firebase Auth to ensure smooth window-based authentication flows.

## Acceptance Criteria
- [ ] Vets can submit verification documents and see a "Pending" banner.
- [ ] Admins can see pending Vet requests and either Approve or Decline with a reason.
- [ ] Declined Vets can see the reason and re-submit their documents.
- [ ] A new "Test Suite" tab exists in the Admin Dashboard with a mapped list of app features.
- [ ] `RunAggregationQuery` on `users` no longer throws permission errors.
- [ ] `smartSearch` Cloud Function is accessible from the frontend without CORS errors.
- [ ] The application initializes AI systems without `internal` Firebase errors.

## Out of Scope
- Integration with third-party automated credential verification services.
- Advanced automated E2E testing within the Admin Test Suite (manual/proxy checks only for this phase).
