<div align="center">

<img width="1200" height="475" alt="PawPrintFind Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# PawPrintFind

**AI-powered pet finder & community rescue platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Reuniting lost pets with their families through the power of AI and community.*

</div>

---

## What is PawPrintFind?

PawPrintFind is a real-time, community-driven platform that uses AI to help locate and reunite lost pets. Users can report missing pets, log sightings with GPS coordinates, get AI-powered matching, and coordinate rescue efforts — all in one place.

**Live at:** [https://pawprint-50.web.app](https://pawprint-50.web.app)

---

## Features

### For Pet Owners
- **Report lost pets** with photos, description, and last known location
- **AI-powered matching** — automatically correlates sightings with missing pet reports
- **Real-time sighting alerts** via push notifications when someone spots your pet
- **Interactive map** with pet sighting clusters and heatmaps
- **Multi-language support** — 8 languages (EN, IT, ES, FR, DE, ZH, AR, RO)

### For the Community
- **Rider Mission Center** — volunteer delivery riders earn Karma Points for assisting in pet rescues
- **Patrol mode** — GPS-tracked patrols for volunteer rescuers
- **Leaderboard** — community karma rankings with badges and tiers
- **25 achievement badges** gamifying community rescue efforts

### For Veterinarians
- **Verified Vet Dashboard** — dedicated interface for verified clinics
- **VetPro subscription** — premium tools via Stripe checkout
- **Clinic registration** with admin verification workflow

### For Shelters & Rescues
- **Adoption center** — showcase adoptable pets
- **Shelter management dashboard** with pet intake and status tracking

### Platform
- **PWA (Progressive Web App)** — installable, works offline
- **Real-time Firestore sync** — live updates across all connected clients
- **Admin dashboard** — 7-tab enterprise control panel with analytics, user management, finance, community tools, AI settings, and audit logs
- **Coupon system** — promotional codes for subscriptions and badges
- **Donation tracking** with Stripe webhooks and crypto wallet support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion + Glassmorphism |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Cloud Functions | Node.js 22 + TypeScript |
| AI | Google Gemini + OpenRouter (abstracted via aiBridgeService) |
| Payments | Stripe (custom Cloud Function + Extension fallback) |
| i18n | i18next + react-i18next (8 languages) |
| PWA | Vite PWA Plugin + Workbox |
| Testing | Vitest + @testing-library/react |
| Validation | Zod schemas for all Firestore documents |

---

## Architecture

```
src/
├── components/         # UI components
│   ├── admin/          # Admin dashboard tabs
│   ├── routers/        # Role-based view routers
│   └── ui/             # Shared design system components
├── hooks/              # Custom React hooks
├── services/           # Service layer (Firebase facade pattern)
│   ├── firebase.ts     # dbService facade — main API surface
│   ├── authService.ts  # Multi-provider authentication
│   ├── petService.ts   # Pet CRUD & sightings
│   ├── vetService.ts   # Vet clinics & verification
│   ├── adminService.ts # Admin operations & audit logs
│   ├── searchService.ts# AI-powered pet matching
│   └── karmaService.ts # Gamification & karma points
├── contexts/           # React contexts (Language, Theme, Snackbar)
├── translations/       # TypeScript translation objects (8 languages)
└── types.ts            # Central type definitions (~50+ interfaces)

public/locales/         # JSON translation files (HttpBackend)
functions/src/          # Firebase Cloud Functions (Node.js 22)
```

**Routing:** Custom view-based system (no React Router). `App.tsx` manages the current view via state, with role-based routers for `owner`, `vet`, `shelter`, `volunteer`, `super_admin`.

---

## Getting Started

### Prerequisites

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project ([create one](https://console.firebase.google.com/))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in your API keys (see .env.example for all required vars)

# 4. Start the development server
npm run dev
# App runs at http://localhost:3000
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test or live) |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |

---

## Development Commands

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # TypeScript check + Vite production build → dist/
npm run lint       # Type-check only (tsc --noEmit)
npm run test       # Run all tests once (vitest run)
npx vitest --watch # Watch mode for tests
```

---

## Deployment

```bash
# Deploy everything to Firebase
npm run deploy

# Deploy only the frontend
firebase deploy --only hosting

# Deploy Cloud Functions only
firebase deploy --only functions

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

## Support PawPrintFind

PawPrintFind is an open-source community project. Running this platform costs approximately **€165/month** in infrastructure and AI inference costs. If PawPrintFind has helped you or you believe in our mission, please consider supporting us.

### Monthly Platform Costs

| Resource | Monthly Cost |
|----------|-------------|
| AI Inference (Gemini + OpenRouter) | €120.00 |
| Cloud Infrastructure (Firebase + GCP) | €45.00 |
| **Total** | **€165.00 / month** |

---

### Donate via Card (Stripe)

Secure card payments powered by [Stripe](https://stripe.com). Choose a tier or enter a custom amount at [pawprint-50.web.app](https://pawprint-50.web.app) (click the heart/donate button):

| Tier | Amount | Perks |
|------|--------|-------|
| ☕ Coffee | €5 | Eternal gratitude + Community Supporter badge |
| 🌟 Supporter | €25 | All Coffee perks + Featured Donor status + Early access to new features |
| 🦁 Hero | €100 | All Supporter perks + Hero of the Community badge + Direct feature requests + Personal thank you |
| Custom | Any (min €1) | Your choice |

All card donations go through a secure Stripe checkout. You'll receive an email receipt.

---

### Donate via Crypto

Send crypto directly to our wallets — no middleman, instant transfer:

**Bitcoin (BTC)**
```
bc1qwyyjx9xcf23h04rwd34ptepqurn2c6h4zqme55
```

**Ethereum (ETH)**
```
0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04
```

**Solana (SOL)**
```
4Gt3VPbwWXsRWjMJxGgjuX8sVd7b2LX3nzzbbH7Hp7Uy
```

**BNB Chain (BNB)**
```
0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04
```

You can also scan the QR codes directly from the donation modal inside the app.

> Every donation — no matter the size — helps keep the platform running and supports the development of new features that reunite more pets with their families.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and write tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- All user-facing text must be translated (add keys to all 8 locale files)
- Follow the service facade pattern — new backend logic goes in a service file, exposed via `dbService`
- Zod schemas required for all new Firestore document types

### Adding a New Feature

See `CLAUDE.md` for detailed architecture guidance, routing conventions, and the translation system documentation.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with love for every pet that deserves to find their way home.

**[Live Demo](https://pawprint-50.web.app)** · **[Report a Bug](https://github.com/50yas/PawPrintFind/issues)** · **[Request a Feature](https://github.com/50yas/PawPrintFind/issues)**

</div>
