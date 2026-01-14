# Implementation Plan: Advanced AI Integration & UI Polish

## Phase 1: UI Polish - Emoji Switcher
- [x] Task: Create `EmojiSwitcher` Component [77161c4]
    - [ ] Sub-task: Implement the state logic to cycle through emojis.
    - [ ] Sub-task: Add `framer-motion` animations for the transition (scale/pop).
    - [x] Sub-task: Integrate this into the "Report Sighting" modal/button.

## Phase 2: Smart Search
- [x] Task: Backend Logic [abc7525]
    - [x] Sub-task: Create `geminiService.parseSearchQuery(query: string)`.
    - [x] Sub-task: Define the JSON schema for the AI response (filters object).
- [x] Task: Frontend Integration [6bd81a2]
    - [x] Sub-task: Create a `SmartSearchBar` component.
    - [x] Sub-task: Connect it to the existing `AdoptionCenter` filter logic.

## Phase 3: Proactive Health Alerts
- [x] Task: AI Analysis Integration [abc7525]
    - [x] Sub-task: Create `geminiService.generateHealthInsights(petData: Pet)`.
    - [x] Sub-task: Add an `aiInsights` array field to the `Pet` Firestore model.
- [~] Task: UI Display
    - [~] Sub-task: Create an `AIInsightCard` component on the `PatientDetail` or `MyClinic` page.
    - [ ] Sub-task: Trigger the analysis when a pet profile is updated (or manually via a "Check Health" button).
- [ ] Task: Conductor - User Manual Verification 'AI Integration & UI Polish' (Protocol in workflow.md)
