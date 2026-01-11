# Specification: Advanced AI Integration & UI Polish

## 1. Overview
This track introduces "Wow" factors to the application. We will implement the "Found Pet" emoji switcher micro-interaction and leverage Gemini for high-value user features: natural language search ("Smart Search") and proactive health monitoring.

## 2. Functional Requirements

### 2.1 "Found Pet" Emoji Switcher
- **UI Element:** A button/toggle in the "Report Sighting" or "Found Pet" flow.
- **Interaction:**
    - The button should display a default pet emoji (🐶).
    - On click/hover, it should animate and cycle through other pet emojis (🐱, 🐰, 🦜, 🐢) to indicate versatility.
    - **Effect:** A subtle particle burst or scale animation on change.

### 2.2 Smart Search (Gemini)
- **Input:** A single search bar that accepts natural language (e.g., "Show me friendly dogs good for apartments").
- **Processing:**
    - Use Gemini to parse the query and extract filters: `species: 'dog'`, `size: 'small'`, `tags: ['friendly', 'apartment']`.
    - Map these extracted filters to a Firestore query.
- **Fallback:** If Gemini fails, fall back to keyword matching.

### 2.3 Proactive Health Alerts
- **Mechanism:** A background job (or triggered on Pet Profile update).
- **AI Analysis:**
    - Analyze the pet's age, breed, and medical history.
    - Generate personalized health tips (e.g., "Senior German Shepherds need hip checks").
- **Notification:** Display these as "AI Insights" on the Pet Detail page.

## 3. Technical Constraints
- **Animation:** Use `framer-motion` for the emoji switcher and UI transitions.
- **AI Model:** Use `gemini-1.5-flash` for low-latency search parsing.

## 4. User Experience
- **Responsiveness:** The search must feel instant. Use optimistic UI or skeleton loaders while Gemini processes.
- **Delight:** The emoji switcher should be playful but functional.
