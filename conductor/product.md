# Product Guide: Paw Print - Pet Finder AI

## 1. Vision
Paw Print is a comprehensive, AI-powered platform designed to connect pet lovers with animals in need, and to provide ongoing support for pet owners. It aims to be a one-stop solution for pet adoption, pet health, and community-driven pet safety.

## 2. Target Users
- **Prospective Pet Owners:** Individuals and families looking to adopt a pet from a shelter or rescue organization.
- **Current Pet Owners:** Users seeking AI-driven health insights, veterinary support, and a community to engage with.
- **Animal Shelters & Rescue Organizations:** Groups looking to manage their adoptable pets, reach a wider audience, and streamline the adoption process.
- **Veterinarians:** Professionals offering their services and managing patient information through the platform.
- **Community Members:** Individuals who want to help find lost pets and support local animal welfare.

## 3. Core Features & Design
Based on the file structure, the application includes the following features:
- **Glassmorphism 2.0 & Material You:** A refined, futuristic aesthetic combining translucency and depth with a dynamic "Material You" (Material 3) color system derived from a "Paw Print Teal" seed color.
- **Pet Adoption:** A central hub (`AdoptionCenter.tsx`) for users to browse and find pets available for adoption, featuring an interactive map (`AdoptionMap.tsx`), high-performance cinematic image loading, and localized smart templates for secure inquiries.
- **AI Health Check:** An AI-powered tool (`AIHealthCheckModal.tsx`) to provide preliminary health assessments for pets.
- **Lost & Found Pets:**
    - A system for reporting lost pets (`ReportLostModal.tsx`).
    - A map-based view (`MissingPetsMap.tsx`, `SightingsMap.tsx`) to track lost pet sightings and reports.
    - Community alerts (`CommunityAlerts.tsx`) to notify users of missing pets in their area.
- **Veterinary Services:**
    - A directory to find veterinarians (`FindVet.tsx`, `Vets.tsx`).
    - A dashboard for veterinarians (`VetDashboard.tsx`) to manage their clinic and patients (`MyClinic.tsx`, `MyPatients.tsx`).
    - **Professional Management:** An administrative "Command Center" for manual clinic registration, professional credential verification, and unlinked vet tracking.
- **Audit & Intelligence:**
    - **System Audit Logs:** Comprehensive logging of administrative actions for transparency and security.
    - **Growth Analytics:** Real-time visual tracking of user and pet registration velocity.
- **Community & Engagement:**
    - **Dynamic Interaction:** Full support for Material 3 state layers (ripples, elevation, focus states) across all interactive components.
    - A community forum or social space (`Community.tsx`).
    - **Smart Blog:** A content hub featuring real-time engagement metrics (view counters), estimated reading times, and trending article analytics.
- **Cinematic Backgrounds:** High-performance, interactive 3D neural network and "Biometric Data Stream" scenes powered by Three.js, featuring adaptive particle systems, DNA-to-Paw morphing, and mouse-reactive parallax effects.
- **User & Role Management & Navigation:**
    - Authentication for different user roles (`Auth.tsx`).
    - Dashboards tailored to different roles (Admin, Shelter, Vet, Volunteer).
    - **Cyber HUD Aesthetic:** A specialized, high-density administrative interface featuring glowing borders, animated status indicators, and advanced data filtering.
    - **Unified Access:** Authenticated users can access all public-facing pages (Home, Adoption Center, Blog) without logging out.
    - **Enhanced Mobile Experience:** A mobile-first navigation system featuring a fixed glass-effect bottom sheet and optimized "Thumb Zone" controls.

## 4. Technology Stack
- **Frontend:** React, TypeScript, Vite
- **Backend & Database:** Firebase (Firestore, Authentication)
- **AI:** Google Gemini API
- **Mapping:** Leaflet
- **3D Graphics:** Three.js / React Three Fiber