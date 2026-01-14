# Specification: Accessibility, Performance & Deep Localization

## 1. Overview
This track aims to polish the application for a global, production-ready release. We will focus on ensuring the app is accessible to all users (WCAG AA), performs reliably offline (PWA), and is fully localized—including the critical Login/Signup flows which often get missed.

## 2. Functional Requirements

### 2.1 Deep Localization
- **Auth Flow Translation:** The Login, Register, and Forgot Password forms must be fully translated.
    - All error messages (e.g., "Password too weak", "Email already in use") must use translation keys.
- **Missing Key Audit:** Run a script/tool to scan the codebase for any user-facing strings that are not wrapped in `t()`.
- **Language Switcher:** Ensure the language switcher persists the user's choice across sessions and reloads.

### 2.2 Accessibility (a11y)
- **WCAG Compliance:** Target WCAG 2.1 AA standards.
- **Focus Management:** Ensure keyboard navigation works logically, especially in Modals and the new Admin Dashboard.
- **Screen Readers:** Verify ARIA labels for all icon-only buttons (like the new Emoji switcher).
- **Contrast:** Ensure all text meets the 4.5:1 contrast ratio (building on previous work).

### 2.3 Performance & PWA
- **PWA:**
    - Add a `manifest.json` for "Add to Home Screen" capability.
    - Implement a Service Worker (`sw.js`) via Vite PWA plugin to cache core assets and enable offline read-access.
- **Code Splitting:**
    - Use `React.lazy` and `Suspense` for all major route components (Admin, Maps, 3D Scenes).

## 3. Technical Constraints
- **Library:** Use `vite-plugin-pwa` for PWA generation.
- **i18n:** Continue using `react-i18next` namespaces (add an `auth` namespace if not present).

## 4. User Experience
- **Offline Mode:** Show a friendly "You are offline" banner if the connection drops.
- **Installability:** Show the native install prompt on supported mobile devices.
