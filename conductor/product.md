# Product Guide: Paw Print - Pet Finder AI

## 1. Vision
Paw Print is a comprehensive, AI-powered platform designed to connect pet lovers with animals in need, and to provide ongoing support for pet owners. It aims to be a one-stop solution for pet adoption, pet health, and community-driven pet safety.

## 2. Target Users
- **Prospective Pet Owners:** Individuals and families looking to adopt a pet from a shelter or rescue organization.
- **Current Pet Owners:** Users seeking AI-driven health insights, veterinary support, and a community to engage with.
- **Animal Shelters & Rescue Organizations:** Groups looking to manage their adoptable pets, reach a wider audience, and streamline the adoption process.
- **Veterinarians:** Professionals offering their services and managing patient information through the platform.
- **Community Members:** Individuals who want to help find lost pets and support local animal welfare.

## 3. Core Features
Based on the file structure, the application includes the following features:
- **Pet Adoption:** A central hub (`AdoptionCenter.tsx`) for users to browse and find pets available for adoption.
- **AI Health Check:** An AI-powered tool (`AIHealthCheckModal.tsx`) to provide preliminary health assessments for pets.
- **Lost & Found Pets:**
    - A system for reporting lost pets (`ReportLostModal.tsx`).
    - A map-based view (`MissingPetsMap.tsx`, `SightingsMap.tsx`) to track lost pet sightings and reports.
    - Community alerts (`CommunityAlerts.tsx`) to notify users of missing pets in their area.
- **Veterinary Services:**
    - A directory to find veterinarians (`FindVet.tsx`, `Vets.tsx`).
    - A dashboard for veterinarians (`VetDashboard.tsx`) to manage their clinic and patients (`MyClinic.tsx`, `MyPatients.tsx`).
- **Community & Engagement:**
    - A community forum or social space (`Community.tsx`).
    - A blog (`Blog.tsx`) for sharing articles and information.
- **User & Role Management:**
    - Authentication for different user roles (`Auth.tsx`).
    - Dashboards tailored to different roles (Admin, Shelter, Vet, Volunteer).

## 4. Technology Stack
- **Frontend:** React, TypeScript, Vite
- **Backend & Database:** Firebase (Firestore, Authentication)
- **AI:** Google Gemini API
- **Mapping:** Leaflet
- **3D Graphics:** Three.js / React Three Fiber