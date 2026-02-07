# Specification: Vet Verification Enhancement & Professional Section Hardening

## 1. Overview
This track aims to professionalize the Veterinary section of Paw Print by unifying the verification process, improving certificate handling, and ensuring robust administrative oversight. We will replace fragmented verification components with a single, high-fidelity multi-step flow.

## 2. Functional Requirements

### 2.1 Unified Verification Flow
- **Single Source of Truth:** Replace `VetVerification.tsx` with an enhanced `VetVerificationModal.tsx`.
- **Request Pattern:** Ensure all verifications create a document in the `vet_verification_requests` collection.
- **Status Persistence:** Users should be able to see their current verification status (Pending, Approved, Rejected) in their dashboard.

### 2.2 Certificate & Document Handling
- **Categorization:** Allow vets to specify what type of document they are uploading (e.g., Medical License, Clinic Accreditation, Identity Document).
- **Multiple Uploads:** Support uploading multiple documents per request.
- **Feedback:** Provide real-time upload progress and success/failure notifications.

### 2.3 Administrative Oversight
- **Admin Review HUD:** A specialized view in the Admin Dashboard to list, review, and act on pending verification requests.
- **Decision Logic:** Admins can Approve (optionally granting "Pro" status) or Reject (with a reason) requests.

### 2.4 Security & Validation
- **Firestore Rules:** Explicitly define read/write permissions for `vet_verification_requests`.
- **Zod Validation:** Implement server-side (and client-side) validation for the verification form data.
- **Storage Protection:** Ensure documents are stored in user-specific, restricted paths in Firebase Storage.

## 3. Non-Functional Requirements
- **UX/UI:** Maintain the "Glassmorphism 2.0" aesthetic.
- **Robustness:** Handle network failures during multi-file uploads gracefully.
- **Traceability:** Log all verification decisions in the Admin Audit Logs.

## 4. Acceptance Criteria
- Vets can successfully submit multiple documents for verification.
- The `vet_verification_requests` collection correctly reflects the submitted data.
- Admins can approve/reject requests from the Admin Dashboard.
- Users receive appropriate UI feedback based on their verification status.
- Firestore rules block unauthorized access to verification documents.
