# Specification: Enterprise Readiness Phase 2 - Infrastructure & Security

## 1. Overview
This track focuses on elevating Paw Print's security and infrastructure to professional standards. We will move sensitive AI and payment logic to a secure backend proxy, implement rate limiting to protect against API abuse, and establish a robust Continuous Integration (CI) pipeline. Additionally, we will implement an administrative dashboard to monitor individual user API usage.

## 2. Functional Requirements

### 2.1 Continuous Integration (CI)
- Implement a GitHub Actions workflow that triggers on all Pull Requests and pushes to `main`.
- **Steps:**
    - Linting (Tailwind, TypeScript).
    - Unit and Integration tests (Vitest).
    - Build verification (Vite).

### 2.2 Secure Backend Proxy (Firebase Cloud Functions)
- **AI Shield:** Move all Gemini API interactions (Smart Search, Health Check, Vision ID, Blog generation) to Firebase Cloud Functions. The client will invoke these functions via HTTPS/Callable triggers instead of calling Gemini directly.
- **Payment Shield:** Ensure Stripe initialization and sensitive metadata handling occur within Cloud Functions.
- **Secret Management:** Store API keys (GEMINI_API_KEY, STRIPE_SECRET_KEY) exclusively in Firebase Secrets Manager or environment variables within the Functions environment.

### 2.3 Rate Limiting, Tracking & Admin Control
- **Usage Tracking:** Every AI function execution must increment a usage counter for the requesting user in Firestore (e.g., `users/{uid}/usageStats/aiRequests`).
- **Rate Limits:** Implement per-user rate limiting for all Cloud Functions wrapping AI features. Define quotas (e.g., 5 Health Checks per day, 20 Smart Searches per hour).
- **Admin Visibility:** Update the **Admin Command Center** (`AdminDashboard.tsx` or similar) to view a user's current usage counts vs. their limits.
- **Admin Overrides:** Allow admins to manually reset a user's usage counters or adjust their tier (if applicable) from the dashboard.

### 2.4 Firebase App Check
- Integrate Firebase App Check (using reCAPTCHA Enterprise or similar) to ensure that only the authorized Paw Print web application can call Cloud Functions and Firestore.

## 3. Non-Functional Requirements
- **Security:** Zero exposure of sensitive API keys in the client-side bundle.
- **Performance:** Minimal latency overhead introduced by the Cloud Function proxy.
- **Scalability:** Functions should be configured to handle traffic spikes within Firebase's free/pay-as-you-go limits.

## 4. Acceptance Criteria
- GitHub Actions successfully flags failing tests or linting errors on PRs.
- AI features continue to function correctly without `VITE_GEMINI_API_KEY` being present in the `.env` or client bundle.
- Admin dashboard displays real-time (or near real-time) API usage counts for selected users.
- Users exceeding the defined rate limits receive a clear `429 Too Many Requests` error message.

## 5. Out of Scope
- Automated production deployment (Manual deployment preferred as per user choice).
- Complete migration of all database logic to the backend (keeping Firestore client-side for performance where secure).
