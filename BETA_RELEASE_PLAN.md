# Paw Print Beta Release Plan & Deployment Guide

## 📅 Target: Public Beta Release (Google Cloud / Firebase)

This document outlines the final steps ("clean work") required to publish the first beta version of Paw Print. It addresses security, performance, and deployment configurations.

## 1. Security & Infrastructure (Completed & Pending)

### ✅ Gemini AI Security (COMPLETED)
- **Action:** Migrated from Firestore-stored API keys to **Google Cloud Secret Manager**.
- **Impact:** API keys are no longer exposed in the database.
- **Requirement:** You must set the secret in Google Cloud before deploying.
  ```bash
  firebase functions:secrets:set GEMINI_API_KEY
  ```

### ⏳ Firestore Rules (PENDING)
- **Action:** Review `firestore.rules`. Ensure `system_config` is read-only for admins.
- **Current Status:** Needs verification.
- **Task:** Ensure `match /system_config/{document=**}` allows read only for admins.

### ⏳ OpenRouter Security (PENDING)
- **Current Status:** OpenRouter keys are still read from `system_config/ai_settings` in Firestore.
- **Recommendation:** For Beta, this is acceptable if Firestore rules are tight. For Enterprise, migrate to Secret Manager.

## 2. App Enhancements ("Finely Tuned")

### ✅ AI Engine Upgrade (COMPLETED)
- **Action:** Upgraded `functions` to use the new `@google/genai` SDK (v1.0+).
- **Models:** Configured to use `gemini-2.5-flash` (Speed/Vision) and `gemini-2.5-pro` (Reasoning).
- **Benefit:** Faster inference and better multimodal understanding.

### ⏳ Performance Check
- **Action:** Run a production build locally to verify bundle size.
  ```bash
  npm run build
  npm run preview
  ```
- **Task:** Verify that the 3D background (Three.js) doesn't crash on mobile.

## 3. Configuration & MCP

### MCP (Model Context Protocol)
- **Clarification:** The codebase now uses standard Google GenAI SDKs. No external MCP server is required for the Beta features (Identikit, Search).
- **Future:** If you plan to expose Paw Print data to other AI agents, an MCP Server can be added to `functions/`.

## 4. Deployment Steps (GCloud / Firebase)

### Step 1: Set Secrets
One-time setup for the secure API key.
```bash
firebase functions:secrets:set GEMINI_API_KEY
# Paste your Gemini API Key when prompted
```

### Step 2: Build & Deploy
Deploy both the React App (Hosting) and the Backend (Functions).
```bash
# 1. Build the Frontend
npm run build

# 2. Deploy Everything
firebase deploy
```

### Step 3: Verify
- Visit the hosted URL.
- Test "Pet Identikit" (Vision AI).
- Test "Admin Dashboard" -> "AI Settings" (Note: Gemini Key field in UI is now overridden by Secret Manager).

## 5. Post-Deployment Checklist
- [ ] Monitor **Firebase Console > Functions > Logs** for any `GEMINI_API_KEY` errors.
- [ ] Check **Google Cloud Console > Quotas** to ensure Gemini API limits aren't hit.
- [ ] Verify **Stripe** webhooks (if enabled) in `functions/src/triggers.ts`.

## 6. Admin UI Note
The `AdminAISettings` page currently allows inputting a Gemini API Key. Since we migrated to Secret Manager, the backend will **ignore** the key in Firestore and use the secure Secret. You may want to update the UI to say "Managed via Secret Manager" for the Google provider.
