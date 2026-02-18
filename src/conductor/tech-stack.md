# Technology Stack

This document outlines the core technologies used in the Paw Print application.

## 1. Frontend

-   **Framework:** React 18+
    -   **Description:** A declarative, component-based JavaScript library for building user interfaces.
-   **Build Tool:** Vite
    -   **Description:** A fast build tool that provides an extremely quick development experience.
    -   **PWA:** vite-plugin-pwa (Zero-config Progressive Web App generation).
-   **Language:** TypeScript
    -   **Description:** A strongly typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and developer experience.
    -   **Configuration:** Strict Mode enabled for robust type safety.
- **Styling:** Tailwind CSS v4
    - **Description:** A utility-first CSS framework used with the @tailwindcss/postcss plugin for high-performance "Glassmorphism 2.0" styling.
- **Animation:** framer-motion
    - **Description:** A production-ready motion library for React.
- **UI Utilities:** @material/material-color-utilities
    - **Description:** Official Google library for generating dynamic Material Design 3 (Material You) palettes (Primary, Secondary, Tertiary, Surface, Error).
- **Internationalization:** react-i18next / i18next
    - **Description:** Industry-standard i18n framework supporting namespace separation, browser language detection, and dynamic loading.
- **Validation:** Zod
    - **Description:** TypeScript-first schema declaration and validation library for runtime data integrity.

## 2. Backend & Database


-   **Platform:** Firebase
    -   **Description:** Google's mobile and web application development platform.
        - **Services Used:**
            -   **Firestore:** A NoSQL cloud database to store and sync data.
            -   **Authentication:** Provides backend services, easy-to-use SDKs, and ready-made UI libraries to authenticate users.
            -   **Analytics:** Enterprise-grade user engagement and milestone tracking.
            - **Analytics & Visualization:**
                - **recharts:** A composable charting library built on React components, used for high-density administrative data visualization and system health tracking.
            - **Performance Monitoring:**
             Real-time insight into the app's performance, frame rates (via @react-three/fiber integration), and latency.
            -   **Cloud Functions (v1):** Serverless backend logic used to handle secure operations like Stripe webhook processing and AI proxying.
            -   **Security:** Firebase App Check (reCAPTCHA Enterprise), Firebase Secrets Manager.
    -   **Payments:** Stripe
        -   **Description:** A suite of APIs for processing online payments and managing subscriptions (client-side redirect flow + webhook handling).
    

## 3. AI / Machine Learning

-   **API: AI Service Bridge**
    -   **Description:** A provider-agnostic bridge layer that dynamically routes requests to the configured backend provider.
-   **Provider: Google Gemini API**
    -   **Description:** Utilized for high-performance native multimodal capabilities and low-latency text generation.
    -   **Models:**
        - **Gemini 2.0 Pro Vision:** Primary engine for multimodal pet identification and analysis.
        - **Gemini 2.5 Pro:** Advanced reasoning for health assessments, data querying, and long-form content generation.
        - **Gemini 2.5 Flash:** Low-latency parsing for smart search, chat suggestions, and multilingual translation.
-   **Provider: OpenRouter**
    -   **Description:** Aggregator service used to access alternative high-intelligence models (GPT-4o, Claude 3.5 Sonnet) via a standardized OpenAI-compatible API.
    -   **Usage:** Leveraged for redundancy and task-specific model optimization via the AI Control Center.

- **Discovery Agents:** Stagehand & Browserbase
    - **Description:** Headless browser automation and LLM-powered extraction used for social media scraping and external intelligence discovery.

## 4. Graphics & Mapping

- **3D Graphics:** Three.js / React Three Fiber

    - **Description:** Core components of the "Cinematic" UI, providing interactive 3D backgrounds and biometric scanning effects.

- **Math Utilities:** maath
    - **Description:** A collection of useful math helpers, used for generating random particle distributions (spheres, helixes) in the 3D environment.


-   **Mapping:** Leaflet
    -   **Description:** An open-source JavaScript library for mobile-friendly interactive maps.

## 5. Testing & Quality
- **Unit & Integration Testing:** Vitest
- **CI/CD:** GitHub Actions
- **Accessibility Audit:** vitest-axe / axe-core
    - **Description:** Integrated automated accessibility testing to ensure WCAG 2.1 AA compliance across all components.
