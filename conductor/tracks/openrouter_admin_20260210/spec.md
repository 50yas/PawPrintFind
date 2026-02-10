# Specification: OpenRouter Integration & Admin AI Dashboard

## Overview
Implement OpenRouter as an alternative AI provider to Google Gemini. Refactor the existing AI service into a provider-agnostic bridge and add a comprehensive AI Management interface within the Admin Command Center. This allows for real-time provider switching, model selection, and credential management without code changes.

## Goals
- Integrate OpenRouter API to handle all current AI tasks (Vision, Chat, Triage, Matching).
- Create an "AI System" tab in the Admin Dashboard for provider and model configuration.
- Implement secure storage for AI credentials in a restricted Firestore collection.
- Support dynamic model fetching from OpenRouter alongside manual model ID entry.

## Functional Requirements
### 1. Admin AI Configuration Dashboard
- **Provider Switch**: A master toggle to select between `Google Gemini` and `OpenRouter`.
- **Credential Management**: Secure input fields for API Keys (Google API Key, OpenRouter Key).
- **Task-to-Model Mapping**: Granular fields to define which model ID to use for:
    - **Vision Protocol**: Image analysis and description generation.
    - **Triage Protocol**: AI Health checks and symptom analysis.
    - **Neural Chat**: The Live Assistant interaction.
    - **Matching Protocol**: Ranking and explaining pet matches.
- **Model Selector**:
    - A "Refresh Models" button to dynamically fetch available models from OpenRouter.
    - A searchable dropdown for fetched models.
    - A manual text override for custom/new model IDs.

### 2. AI Bridge Architecture
- Refactor `services/geminiService.ts` into a unified `services/aiService.ts`.
- The new service must detect the active provider from Firestore configuration.
- Standardize the input/output formats so features work seamlessly regardless of the provider.

### 3. Monitoring & Telemetry
- Update the **AI Usage Table** to include a "Provider" column.
- Display the active provider and model ID in the AI Insights cards.

## Technical Requirements
- **Storage**: Store configuration in a `system_config/ai_settings` Firestore document.
- **API**: Use standard Fetch/Axios for OpenRouter calls (OpenAI-compatible format).
- **Security**: Implement strict Firestore rules to ensure only `super_admin` users can read/write the `system_config` collection.

## Acceptance Criteria
- [ ] Admin can switch the provider to OpenRouter and the app immediately begins using it.
- [ ] OpenRouter successfully processes a "Found Pet" photo and returns a valid description.
- [ ] The Live Assistant maintains conversation context when running on an OpenRouter model.
- [ ] AI Health checks produce valid triage data through OpenRouter.
- [ ] The Admin can manually type a model ID not in the fetched list.

## Out of Scope
- Support for using multiple providers simultaneously (load balancing).
- User-facing selection of AI providers.
- Local execution of models (on-device AI).
