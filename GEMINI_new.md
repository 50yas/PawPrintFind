# GEMINI Project: Paw Print - Pet Finder AI

## Project Overview

This is a comprehensive web application designed to help find lost pets, facilitate pet adoption, and provide veterinary services. It's built with a modern tech stack including React, TypeScript, and Vite, with Firebase for backend services and Google Gemini for AI-powered features. The application has a sophisticated role-based access control system, providing tailored experiences for different user types such as pet owners, veterinarians, shelter staff, and administrators.

## Key Technologies

*   **Frontend:** React 18+, TypeScript, Vite
*   **Styling:** Tailwind CSS (inferred from file structure and typical React projects)
*   **Backend:** Firebase (Authentication, Firestore, Storage)
*   **AI:** Google Gemini (`@google/genai`)
*   **Maps:** Leaflet
*   **3D:** Three.js, React Three Fiber

## Building and Running

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

3.  **Build for Production:**
    ```bash
    npm run build
    ```
    The production-ready files will be in the `dist` directory.

4.  **Deploy to Firebase:**
    ```bash
    npm run deploy
    ```

## Development Conventions

*   **Component-Based:** The application follows a component-based architecture with a clear separation of concerns.
*   **State Management:** State is managed using React Hooks (`useState`, `useEffect`) and custom hooks for more complex state logic.
*   **Routing:** The application uses a custom router implementation based on the user's role and the `currentView` state.
*   **Firebase Integration:** All backend interactions are handled through the `dbService` module, which encapsulates Firebase services.
*   **AI Integration:** AI features are integrated through the `@google/genai` library.
*   **Role-Based Access Control (RBAC):** The application has a robust RBAC system that tailors the user experience based on the user's role (`super_admin`, `vet`, `shelter`, `user`).
*   **File Structure:** The project is organized by feature, with components, services, hooks, and contexts in their respective directories.
