# Specification: Admin Notification System

## 1. Overview
This track introduces a system for Administrators to manage notification channels (Email, WhatsApp, Telegram) and configure alerts for critical system events (New User Registration, Vet Verification Request).

## 2. Functional Requirements

### 2.1 Notification Configuration Schema
- **Storage:** Persist configuration in a secured Firestore document (e.g., `config/notifications`).
- **Channels:**
    - **Email:** Enable/Disable, Target Email(s).
    - **WhatsApp:** Enable/Disable, Phone Number, API Key (placeholder/stub).
    - **Telegram:** Enable/Disable, Bot Token, Chat ID.

### 2.2 Admin Dashboard Integration
- **New Tab:** Add a "Notifications" tab to `AdminDashboard.tsx`.
- **Management UI:** A form to toggle channels and input credentials/targets.
- **Security:** Ensure these settings are only visible and editable by Super Admins.

### 2.3 Event Triggers (Service Layer)
- **Trigger Points:**
    - `authService.registerUser` -> Trigger "New User" alert.
    - `dbService.submitVetVerification` -> Trigger "Verification" alert.
- **Implementation:** Create a `notificationService` to handle the logic. *Note: Actual sending will be stubbed or logged for now, as client-side sending is insecure for secrets. Future work will move this to Cloud Functions.*

## 3. Non-Functional Requirements
- **Security:** API keys must be stored in Firestore but should ideally be moved to Secret Manager in a future backend refinement. For now, restricted Firestore rules are essential.
- **Extensibility:** The system should be easily extensible to add more event types later.

## 4. Acceptance Criteria
- Admin can save and retrieve notification settings.
- "New User" and "Verification" events log a "Notification Triggered" message to the console/logger with the correct config.
