# Technology Stack

This document outlines the core technologies used in the Paw Print application.

## 1. Frontend

-   **Framework:** React 18+
    -   **Description:** A declarative, component-based JavaScript library for building user interfaces.
-   **Build Tool:** Vite
    -   **Description:** A fast build tool that provides an extremely quick development experience.
-   **Language:** TypeScript
    -   **Description:** A strongly typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and developer experience.
    -   **Configuration:** Strict Mode enabled for robust type safety.
- **Styling:** Tailwind CSS v4
    - **Description:** A utility-first CSS framework used with the @tailwindcss/postcss plugin for high-performance "Glassmorphism 2.0" styling.
- **UI Utilities:** @material/material-color-utilities
    - **Description:** Official Google library for generating dynamic Material Design 3 (Material You) palettes (Primary, Secondary, Tertiary, Surface, Error).
- **Internationalization:** react-i18next / i18next
    - **Description:** Industry-standard i18n framework supporting namespace separation, browser language detection, and dynamic loading.
- **Validation:** Zod
    - **Description:** TypeScript-first schema declaration and validation library for runtime data integrity.

## 2. Backend & Database


-   **Platform:** Firebase
    -   **Description:** Google's mobile and web application development platform.
    -   **Services Used:**
        -   **Firestore:** A NoSQL cloud database to store and sync data.
        -   **Authentication:** Provides backend services, easy-to-use SDKs, and ready-made UI libraries to authenticate users.
        -   **Performance Monitoring:** Real-time insight into the app's performance and latency.

## 3. AI / Machine Learning

-   **API:** Google Gemini API
    -   **Description:** Utilized for integrating advanced generative AI capabilities, including various Gemini models for tasks such as pet health assessments, content generation, and automated multilingual content translation.

## 4. Graphics & Mapping

- **3D Graphics:** Three.js / React Three Fiber

    - **Description:** Core components of the "Cinematic" UI, providing interactive 3D backgrounds and biometric scanning effects.

- **Math Utilities:** maath
    - **Description:** A collection of useful math helpers, used for generating random particle distributions (spheres, helixes) in the 3D environment.


-   **Mapping:** Leaflet
    -   **Description:** An open-source JavaScript library for mobile-friendly interactive maps.

## 5. Testing & Quality
- **Unit & Integration Testing:** Vitest
- **Accessibility Audit:** vitest-axe / axe-core
    - **Description:** Integrated automated accessibility testing to ensure WCAG 2.1 AA compliance across all components.
