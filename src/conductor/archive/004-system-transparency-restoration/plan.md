# Implementation Plan: System Transparency Restoration

## Phase 1: Localization & Configuration [DONE]
- [x] Task: Add `devModeMarquee` key to all translation files (`en`, `it`, `es`, `fr`, `de`, `zh`, `ar`, `ro`).
- [x] Task: Update `i18n.ts` to use TypeScript-based translations instead of `HttpBackend`.

## Phase 2: UI Implementation & Verification
- [x] Task: Define `animate-marquee` keyframes and class in `index.css`.
- [x] Task: Verify `DevMarquee` component presence in `App.tsx` and ensure correct rendering logic.
- [ ] Task: Test marquee visibility across multiple languages and screen sizes.
- [ ] Task: Verify z-index and layout padding consistency.

## Phase 3: Final Polish
- [ ] Task: Conductor - User Manual Verification 'System Transparency Restoration'.
