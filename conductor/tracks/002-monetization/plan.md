# Monetization & Subscription System

## 1. Foundation & Payments
- [x] **Data Model:** Update User schema for subscription status.
- [x] **Service Layer:** Implement `subscriptionService` for Stripe Checkout & Portal.
- [x] **Cloud Functions:** Implement `onStripePaymentSuccess` and `onSubscriptionChange` handlers. [ad46b5b]
- [x] **Security:** Harden Firestore rules for donations and subscriptions. [ad46b5b]

## 2. Feature Gating & UI [checkpoint: 638a156]
- [x] **Pricing Modal:** Create `VetPremiumModal` with pricing (18€/mo). [ad46b5b]
- [x] **Feature Gate:** Enforce patient limits in `MyPatients` component. [ad46b5b]
- [x] **Billing Portal:** Add "Manage Subscription" button in Vet Dashboard/Settings. [d2f1cc9]

## 3. Advanced Pro Features [checkpoint: 411dcfa]
- [x] **AI Health Analytics:** Implement the AI analysis view for Pro vets. [718d731]
- [x] **Priority Support:** Add a dedicated support channel. [de6f69f]
