# Implementation Plan: Admin Notification System

## Phase 1: Schema & Service [checkpoint: ]
- [x] Task: Define Types
    - Add `NotificationConfig` interface to `types.ts`.
    - Define Zod schema for validation.
- [x] Task: Create Notification Service
    - Create `services/notificationService.ts`.
    - Implement `getSettings`, `saveSettings`, and `sendNotification`.
    - Stub the actual API calls (e.g., `console.log("[Email Sent] to...", body)`).

## Phase 2: Backend Integration [checkpoint: ]
- [x] Task: Update Firestore Rules
    - Restrict access to `config/notifications` to Super Admins only.
- [x] Task: Inject Triggers
    - Update `authService.ts` to call `notificationService.sendNotification` on registration.
    - Update `firebase.ts` (vet verification) to call `notificationService.sendNotification`.

## Phase 3: Admin UI [checkpoint: ]
- [x] Task: Create Settings Component
    - Build `components/AdminNotificationSettings.tsx`.
    - Form fields for Email, WhatsApp, Telegram.
    - Toggles for events.
- [x] Task: Update Admin Dashboard
    - Add "Notifications" tab.
    - Render the settings component.

## Phase 4: Verification [checkpoint: ]
- [x] Task: Manual Test
    - Save settings.
    - Perform a user registration and vet verification.
    - Verify console logs show the notification triggers.
