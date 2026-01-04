# Specification: Unified Access & Enhanced Adoption Logic

## 1. Overview
This track aims to unify the application experience by allowing authenticated users (Volunteers, Owners, Shelters, Vets) to access all public-facing pages without logging out. Additionally, it enhances the Adoption Center with an interactive map of available pets and a localized "Smart Template" system for secure adoption inquiries.

## 2. Functional Requirements

### 2.1 Unified Navigation & Routing
- Update `Navbar` and `MobileNavigation` to show links to "Home", "Adoption Center", and "Blog" for all authenticated roles.
- Modify `UserRouter`, `ShelterRouter`, `VetRouter`, and `VolunteerRouter` to include shared public views (Home, Adoption Center, etc.) while maintaining access to role-specific dashboards.
- Ensure the `PublicRouter` remains the default for unauthenticated users.

### 2.2 Adoption Center Map
- Integrate the existing map logic (`MissingPetsMap`) into the `AdoptionCenter` to show pets with `status: "forAdoption"`.
- Implement a "Locate Me" button to center the map on the user's current GPS coordinates.
- Marker popups must include:
    - Pet name and thumbnail.
    - An "Adopt Me" button that initiates the Secure Chat protocol.

### 2.3 Enhanced Secure Chat (Smart Templates)
- Implement localized initial messages for adoption inquiries in all supported languages (`it`, `en`, `es`, `fr`, `de`, `ar`, `zh`, `ro`).
- Example template: "Hello! I am very interested in adopting [Pet Name]. Could you provide more information about the adoption process?"
- Clicking "Adopt Me" on the map or pet card should create a new `ChatSession` (if one doesn't exist) and pre-fill the input or send an initial automated message.

## 3. Non-Functional Requirements
- **Performance:** Map rendering should be optimized to handle multiple markers without lag.
- **UX:** Transitions between the dashboard and public pages must be seamless (no page reloads).
- **Internationalization:** All new UI strings and chat templates must be added to `translations.ts` and individual locale files.

## 4. Acceptance Criteria
- [ ] Users can navigate from their Dashboard to the Homepage and back without re-authenticating.
- [ ] The Adoption Center displays a map showing only pets available for adoption.
- [ ] The "Locate Me" button correctly centers the map on the user's position.
- [ ] Clicking "Adopt Me" starts a secure chat with a localized greeting.
- [ ] Volunteers and Shelters can browse the Adoption Center while logged in.

## 5. Out of Scope
- Redesigning the core 3D Hero Scene.
- Modifying the AI Health Check logic.
