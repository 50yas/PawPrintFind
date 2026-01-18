# Plan: Advanced Search Features & AI Optimization

## 🚀 1. HPO Engine Implementation

### Core Logic
- [~] **OptunaOptimizer Service:** Create `services/optimizationService.ts`. Implement the TPE-like logic for parameter sampling and trial management.
- [ ] **Firestore Schema:** Define the `optimization_trials` and `search_config` collections in `types.ts` and `services/firebase.ts`.
- [ ] **Search Service Integration:** Refactor `geminiService.ts` or `searchService.ts` to fetch and apply the dynamic weights from `search_config` before executing a query.

### Feedback Loop
- [ ] **Event Tracking:** Create a `recordSearchInteraction` function to log successful user actions (clicks/conversions) associated with the specific search parameters used.
- [ ] **Trial Finalization:** Implement logic to calculate the "score" of a trial based on the recorded interactions and update the optimizer state.

## 📊 2. Advanced Search HUD (Admin)

### UI Components
- [ ] **Dashboard Layout:** Create `components/SearchOptimizationDashboard.tsx` with a high-density "Cyber HUD" layout.
- [ ] **Trial Visualization:** Implement a chart (using Recharts or similar, or custom Canvas) to show trial history and convergence.
- [ ] **Parameter Controls:** Add UI controls to manually override weights or reset the optimizer (The "Kill Switch").

## 💾 3. Persistent Search Filters

### Backend & Data
- [ ] **Saved Search Schema:** Update `types.ts` to include `SavedSearch` interface.
- [ ] **CRUD Operations:** Add methods to `services/userService.ts` (or `searchService.ts`) to save, get, and delete searches.

### Frontend
- [ ] **Save Button:** Add a "Save Search" button to the `AdoptionCenter` and `SmartSearchBar`.
- [ ] **Saved Searches List:** Create a `SavedSearchesList.tsx` component in the user's profile view.
- [ ] **Filter Rehydration:** Ensure clicking a saved search correctly repopulates the search state and filters.

## 🧪 4. Quality Assurance
- [ ] **Unit Tests:** Write comprehensive tests for the `OptunaOptimizer` logic to ensure it converges correctly on mock functions.
- [ ] **Integration Tests:** Verify the flow: Save Search -> Retrieve Search -> Apply Filters.
- [ ] **Performance Benchmarking:** Measure search latency with and without the dynamic parameter fetching.
