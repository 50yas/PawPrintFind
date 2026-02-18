# Track 002: Monetization & Subscription System

## Goal
Implement a robust subscription model for Vets to monetize the platform, ensuring secure payments, automatic status syncing, and clear feature gating.

## Core Features
1.  **Stripe Integration:** Use "Run Payments with Stripe" extension.
2.  **Subscription Management:**
    -   Plan: "Vet Pro" (€18.00/month).
    -   Features: Unlimited Patients, AI Analytics.
3.  **Role-Based Access Control (RBAC):**
    -   Free Vets: Max 5 patients.
    -   Pro Vets: Unlimited.

## Tech Stack
-   **Frontend:** React, Stripe Checkout (Client-side redirect).
-   **Backend:** Firebase Cloud Functions (v1), Firestore.
-   **Payments:** Stripe.
