# Implementation Plan: Advanced AI Integration & UI Polish

## Phase 1: UI Polish - Emoji Switcher
- [x] Task: Create `EmojiSwitcher` Component [77161c4]
    - [ ] Sub-task: Implement the state logic to cycle through emojis.
    - [ ] Sub-task: Add `framer-motion` animations for the transition (scale/pop).
    - [x] Sub-task: Integrate this into the "Report Sighting" modal/button.

## Phase 2: Smart Search
- [~] Task: Backend Logic
    - [~] Sub-task: Create `geminiService.parseSearchQuery(query: string)`.
    - [ ] Sub-task: Define the JSON schema for the AI response (filters object).
- [ ] Task: Frontend Integration
    - [ ] Sub-task: Create a `SmartSearchBar` component.
    - [ ] Sub-task: Connect it to the existing `AdoptionCenter` filter logic.

## Phase 3: Proactive Health Alerts
- [ ] Task: AI Analysis Integration
    - [ ] Sub-task: Create `geminiService.generateHealthInsights(petData: Pet)`.
    - [ ] Sub-task: Add an `aiInsights` array field to the `Pet` Firestore model.
- [ ] Task: UI Display
    - [ ] Sub-task: Create an `AIInsightCard` component on the `PatientDetail` or `MyClinic` page.
    - [ ] Sub-task: Trigger the analysis when a pet profile is updated (or manually via a "Check Health" button).
- [ ] Task: Conductor - User Manual Verification 'AI Integration & UI Polish' (Protocol in workflow.md)
