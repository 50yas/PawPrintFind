# Implementation Plan: OpenRouter Integration & Admin AI Dashboard

## Phase 1: Foundation & Data Layer
**Goal:** Establish the configuration schema and the basic structure for the new AI service.

- [x] Task: Create Firestore schema for `system_config/ai_settings`
    - [x] Define types for `AISettings` in `types.ts`.
    - [x] Create a migration or initialization script to set default values (Gemini as primary).
- [x] Task: Secure AI Settings with Firestore Rules
    - [x] Update `firestore.rules` to restrict access to `system_config` only to `super_admin`.
- [x] Task: Create AI Service Bridge (`services/aiBridgeService.ts`)
    - [x] Implement a class/module that reads from `AISettings`.
    - [x] Implement methods for `analyzeImage`, `generateHealthCheck`, `getChatResponse`, and `rankPets`.
    - [x] These methods should delegate to either `geminiService.ts` or a new `openRouterService.ts`.
- [x] Task: Conductor - User Manual Verification 'Foundation & Data Layer' (Protocol in workflow.md)

## Phase 2: OpenRouter Integration
**Goal:** Implement the OpenRouter-specific logic and ensure it matches existing behavior.

- [x] Task: Create `services/openRouterService.ts`
    - [x] Implement OpenAI-compatible fetch calls to OpenRouter.
    - [x] Implement `fetchAvailableModels` method.
    - [x] Map OpenRouter responses to the app's internal types.
- [x] Task: Write unit tests for OpenRouter service
    - [x] Mock API responses for various tasks.
    - [x] Verify error handling and timeout scenarios.
- [x] Task: Conductor - User Manual Verification 'OpenRouter Integration' (Protocol in workflow.md)

## Phase 3: Admin AI Management UI
**Goal:** Build the interface for admins to manage AI providers and models.

- [x] Task: Create `AdminAISettings` component
    - [x] Implement provider toggle.
    - [x] Implement secure credential input fields (masking keys).
    - [x] Implement task-to-model mapping fields.
    - [x] Implement dynamic "Refresh Models" functionality.
- [x] Task: Integrate `AdminAISettings` into `AdminDashboard.tsx`
    - [x] Add a new "AI" category/tab in the sidebar.
    - [x] Ensure settings persist to Firestore on save.
- [x] Task: Conductor - User Manual Verification 'Admin AI Management UI' (Protocol in workflow.md)

## Phase 4: Integration & Refactoring
**Goal:** Replace the old Gemini-only calls with the new AI Bridge across the app.

- [x] Task: Refactor components to use `aiBridgeService`
    - [x] Update `FoundPet.tsx` (Vision).
    - [x] Update `AIHealthCheckModal.tsx` (Triage).
    - [x] Update `LiveAssistant.tsx` (Chat).
    - [x] Update `AdoptionCenter.tsx` / `LostPetsCenter.tsx` (Matching).
- [x] Task: Update AI Usage & Telemetry
    - [x] Modify `AIUsageTable.tsx` to display the provider and model used.
- [x] Task: Final end-to-end integration tests
    - [x] Verify switching providers in Admin UI correctly affects the entire app.
- [~] Task: Conductor - User Manual Verification 'Integration & Refactoring' (Protocol in workflow.md)
