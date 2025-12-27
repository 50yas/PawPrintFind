
# Paw Print Project Manifesto

## 1. Vision & Mission
**Paw Print** is an AI-powered ecosystem designed to create a "Visual Passport" for pets. Our mission is to eliminate the need for physical microchip scanners by using computer vision and AI to identify lost pets instantly via smartphone cameras. We connect Owners, Finders, Veterinarians, Shelters, and Urban Riders in a seamless, real-time network.

## 2. Core Principles (The "Google Standard")
1.  **AI First:** Every major interaction (identification, health checks, scheduling) should be assisted by AI.
2.  **Privacy by Design:** Owners' data is protected. Communication happens via secure, anonymous proxies until trust is established.
3.  **Gamified Engagement:** Incentivize community participation (Riders/Volunteers) through XP and reputation systems to ensure active searching.
4.  **Resilience:** The app must degrade gracefully. If AI fails, manual entry works. If the network is slow, offline mode kicks in.

## 3. Implemented Features Registry

### A. User/Owner Ecosystem
*   **Visual Identity Creation:** Upload photos, AI analysis of breed/marks, manual tagging of unique features.
*   **Smart Dashboard:** "Google Home" style control center for pets.
*   **Emergency Mode:** One-tap "Report Lost" triggering geo-fenced alerts.
*   **Medical Vault:** Digitized vaccination records and AI Health Check.
*   **Community Hub:** Leaderboards, friend requests, and sharing pets.

### B. Veterinarian Ecosystem
*   **Vet Registration Flow:** Dedicated entry point for clinics with profile verification.
*   **Verified Practice Profile:** Public profile sync with Google Maps data.
*   **Smart Calendar:** AI-assisted appointment scheduling and conflict detection.
*   **Patient Management:** Accept/Decline connection requests from owners.
*   **Clinical Dashboard:** Overview of pending requests and daily schedule.

### C. Shelter/Association Ecosystem (Centro Adozioni)
*   **Partner Login:** Dedicated portal for Shelters and Associations.
*   **Adoption Center:** Management of adoptable pets visible to the public.
*   **Partnership Status:** Verified badges for registered associations.
*   **Finder AI Scanner:** Comparing found pet photos against the lost database (Vector/Visual Matching).
*   **Secure Chat:** Anonymous communication between Finder and Owner.

### D. Urban Guardians (Volunteers/Riders)
*   **Gamified Dashboard:** Cyberpunk-inspired interface for night patrols.
*   **Patrol Mode:** GPS tracking of search routes to earn XP.
*   **Active Missions:** Real-time feed of lost pets within 5km radius with XP bounties.
*   **Leaderboard:** Competitive ranking for top searchers.

### E. Super Admin Console ("God Mode") - *ENHANCED*
*   **Live Operations Center:** Real-time monitoring of all user registrations, pet alerts, and donations.
*   **Biometric Analytics:** Visual charts deriving insights from real user data (Growth, Pet Types, Revenue).
*   **AI Content Engine:** Simplified "One-Click" blog generation using Gemini to keep community engagement high.
*   **Global Oversight:** Ability to verify vets, approve donations, and manage user roles directly from the UI.
*   **System Health:** Latency monitoring and error log aggregation.

### F. Technical Architecture
*   **Authentication:** Firebase Auth (Google + Email Link/Passwordless) + **Anonymous Auth** for guest donations.
*   **Database:** Firestore (Real-time updates) with optimistic UI updates.
*   **Storage:** Firebase Storage (Images/Media) for optimized performance.
*   **AI Engine:** Google Gemini (Multimodal: Vision, Text, Audio).
*   **Map Engine:** Leaflet with **CartoDB Voyager** tiles across ALL maps.

### G. Payment & Donations Architecture (Hybrid Flow)
*   **Dual Mode:** Supports both traditional Card payments and Crypto transfers.
*   **Stripe via Firebase Extension:**
    *   *Frontend:* Creates session docs in `customers/{uid}/checkout_sessions` (works with Anonymous UIDs).
    *   *Backend:* Extension listens to document creation -> Generates Stripe Checkout URL -> Client Redirects.
    *   *Config:* Region `europe-west1`, syncing to `customers` collection.
*   **Crypto Wallet:** Manual display of BTC/ETH addresses with QR code for decentralized support.
*   **Public Ticker:** Real-time scrolling ticker of approved donors.

## 4. UI/UX Guidelines
*   **Palette:** Teal (Primary), Slate (Neutral), Red/Green (Status), Neon Accents (Volunteer Mode).
*   **Typography:** Plus Jakarta Sans (UI), Space Mono (Data/Tech).
*   **Components:** Glassmorphism panels, floating action buttons (FAB), skeleton loaders.
*   **Animation Standard (Tech-Card):**
    *   Cards must behave like "Holographic Data Slates".
    *   Hover states should trigger a "Scan" effect (laser line or digital noise).
    *   Information reveals should slide up like a HUD (Heads-Up Display).
*   **Login & Loading Experience:**
    *   **Loading:** Cinematic 3D Hero Scene background with a "Lens Zoom" logo reveal.
    *   **Login:** Quad-state access (Owner, Vet, Shelter, Volunteer) with polished "Zoom & Focus" entry animation.

## 5. Future Roadmap (To Be Built)
*   **Dashcam Integration:** Auto-scanning streets for stray dogs/cats using edge computing.
*   **IoT Collar Integration:** Real-time GPS sync via Bluetooth LE.
*   **Biometric Nose Print:** Higher accuracy identification using contrast enhancement.
