# Monetization & Subscription System

## 1. Foundation & Payments
- [x] **Data Model:** Update User schema for subscription status.
- [x] **Service Layer:** Implement `subscriptionService` for Stripe Checkout & Portal.
- [x] **Cloud Functions:** Implement `onStripePaymentSuccess` and `onSubscriptionChange` handlers. [ad46b5b]
- [x] **Security:** Harden Firestore rules for donations and subscriptions. [ad46b5b]

## 2. Feature Gating & UI
- [x] **Pricing Modal:** Create `VetPremiumModal` with pricing (18€/mo). [ad46b5b]
- [x] **Feature Gate:** Enforce patient limits in `MyPatients` component. [ad46b5b]
- [ ] **Billing Portal:** Add "Manage Subscription" button in Vet Dashboard/Settings.

## 3. Advanced Pro Features
- [ ] **AI Health Analytics:** Implement the AI analysis view for Pro vets.
- [ ] **Priority Support:** Add a dedicated support channel.
