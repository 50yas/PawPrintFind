# Vet Integration & CRM Manual

## Overview
The Vet Integration module allows veterinary clinics to register, verify their identity, and use the Paw Print platform as a lightweight CRM.

## Key Features

### 1. Vet Verification
- **Flow:** User registers as Vet -> Uploads License (PDF/Image) -> `VetVerification` component uploads to `verifications/{uid}` -> Admin sees alert in `AdminDashboard` -> Admin clicks "Approve" -> User `isVerified` becomes `true`.
- **Status:** Fully Implemented.

### 2. Vet Dashboard (CRM)
- **Access:** Restricted to verified vets.
- **Components:**
    - `StatWidget`: Key metrics (Pending Requests, Appointments).
    - `TodaysAppointments`: Daily schedule view.
    - `ActionCard`: Navigation to sub-modules.

### 3. Patient Management
- **My Patients:** Vets can manage their patient list.
- **Add Patient:** Vets can manually add patients and invite owners via email.
- **Limits:** Free tier limited to 5 patients. Pro tier is unlimited.

### 4. Subscription System
- **Pro Tier:** Unlocks "AI Analytics" and "Priority Support".
- **Integration:** Uses `subscriptionService` (Stripe).
- **Badge:** "PRO" badge displayed in Dashboard and Admin view.

## Verification Steps
1.  Log in as a new Vet.
2.  Navigate to Dashboard -> See Verification Form.
3.  Upload document.
4.  Log in as Admin.
5.  Go to "Verifications" tab -> Approve.
6.  Log in as Vet -> See Dashboard.
