# PawPrintFind — App Status

> **Auto-updated** by `scripts/bump-version.js` on every `npm run build`.
> For live version, see `version.json` at the project root.

---

## Current Build

| Field | Value |
|---|---|
| **Version** | 1.1.0 |
| **Build #** | 413 |
| **Commit** | `0cb219f` |
| **Branch** | `master` |
| **Build date** | 2026-02-23 |
| **Environment** | development → production on deploy |
| **Live URL** | https://pawprint-50.web.app |
| **Firebase project** | `pawprint-50` |

---

## Architecture

```
React 18 + TypeScript + Vite
├── Firebase Hosting          (frontend, CDN)
├── Cloud Firestore           (database)
├── Firebase Auth             (multi-provider auth)
├── Cloud Functions v2        (12 deployed functions)
├── Firebase Storage          (photos, uploads)
└── PWA (Workbox)             (offline support, 125 precached entries)
```

---

## Feature Map

### Core Platform

| Feature | Status | Notes |
|---|---|---|
| Lost pet registration | ✅ Live | Photo upload, AI autofill, identikit |
| Pet sighting reports | ✅ Live | GPS coordinates, photo, description |
| AI photo autofill | ✅ Live | Gemini / OpenRouter vision |
| Smart search (NLP) | ✅ Live | Natural language → Firestore filters |
| Interactive map | ✅ Live | Leaflet + MarkerCluster, mobile controls |
| Adoption center | ✅ Live | Shelter listings, filter by species |
| Multi-language (8) | ✅ Live | en, it, es, fr, de, zh, ar, ro |
| PWA install | ✅ Live | Offline, push-ready, 125 precached assets |

### Authentication

| Provider | Status |
|---|---|
| Email + password | ✅ |
| Google OAuth | ✅ |
| Phone (OTP) | ✅ |
| Magic link (email) | ✅ |
| Anonymous (guest) | ✅ |

### User Roles

| Role | Dashboard | Notes |
|---|---|---|
| `owner` | Dashboard | Full user features |
| `vet` | VetDashboard | Clinic mgmt, verification |
| `shelter` | ShelterDashboard | Pet listings, adoption |
| `volunteer` | Dashboard + Missions | Patrol, karma |
| `super_admin` | AdminDashboard | Full control |

### Gamification & Karma

| Feature | Status | Notes |
|---|---|---|
| Karma points | ✅ Live | karmaService.ts singleton |
| 5 rider types | ✅ Live | 1.1x–1.5x multipliers |
| 25 badges | ✅ Live | 7 categories, SVG inline graphics |
| 5 karma tiers | ✅ Live | Scout → Legend |
| Streak bonus | ✅ Live | Up to 2x at 30-day streak |
| Leaderboard | ✅ Live | Leaderboard.tsx |
| Rider Mission Center | ✅ Live | RiderMissionCenter.tsx |
| Patrol GPS mode | ✅ Live | usePatrol.ts |
| Waiting mode (delivery) | ✅ Live | useWaitingMode.ts |

### AI / ML

| Feature | Provider | Model (default) | Status |
|---|---|---|---|
| Pet vision / autofill | OpenRouter | nvidia/nemotron-nano-12b-v2-vl:free | ✅ |
| Smart search | OpenRouter | qwen/qwen3-next-80b-a3b-instruct:free | ✅ |
| Health assessment | OpenRouter | qwen/qwen3-next-80b-a3b-instruct:free | ✅ |
| Blog generation | OpenRouter | qwen/qwen3-coder:free | ✅ |
| Fallback provider | Google Gemini | gemini-2.0-flash | ✅ |
| AI settings admin | Admin > AI tab | Live model switching | ✅ |

### Admin Dashboard (7 tabs, 22 sub-sections)

| Tab | Features |
|---|---|
| Overview | Real-time KPIs, revenue, pet stats, activity feed |
| Users | User table, roles, ban, karma adjust, badge award |
| Operations | Moderation queue, vet verification HUD, audit logs |
| Finance | Donations, Stripe webhooks, coupon manager, VetPro subscriptions |
| Community | Social media scheduler, karma stats, leaderboard |
| AI Settings | Provider toggle (Gemini ↔ OpenRouter), per-task model config |
| System | Notification test, i18n sync, optimization, test suite, cache |

### Payments (Stripe)

| Feature | Status | Notes |
|---|---|---|
| One-off donations | ✅ Live | Checkout session → webhook → Firestore |
| VetPro monthly | ✅ Live | `https://buy.stripe.com/test_5kQaEQ...` |
| Stripe webhook | ✅ Live | `/stripeWebhook` Cloud Function |
| Donation approval | ✅ Live | Requires `status='paid'` AND `approved=true` |

### User Profile

| Feature | Status |
|---|---|
| Profile photo upload | ✅ (Firebase Storage) |
| Display name + bio | ✅ |
| Badges showcase | ✅ (BadgeCard / BadgeShowcase) |
| Notifications toggle | ✅ |
| Password change | ✅ (reauthentication required) |

### Vet Verification System

| Feature | Status |
|---|---|
| Clinic self-registration | ✅ |
| Admin HUD (AdminVetVerificationHUD) | ✅ |
| Evidence upload | ✅ |
| Tiered evidence scoring | ✅ |
| Audit log on every action | ✅ |
| Fraud detection | ✅ |

---

## Cloud Functions (12 deployed)

| Function | Trigger | Description |
|---|---|---|
| `visionIdentification` | onCall | Pet photo → AI breed/color/size/identikit |
| `smartSearch` | onCall | NLP query → structured search params |
| `healthAssessment` | onCall | Symptoms → AI triage report |
| `blogGeneration` | onCall | Topic → formatted blog JSON |
| `callGemini` | onCall | Generic Gemini passthrough (legacy) |
| `callOpenRouter` | onCall | Generic OpenRouter passthrough |
| `fetchOpenRouterModels` | onCall | Returns available OpenRouter models |
| `createDonationCheckout` | onCall | Creates Stripe checkout session |
| `stripeWebhook` | onRequest | Confirms payment, marks donation paid |
| `onUserCreated` | Firestore trigger | New user doc init |
| `onStripePaymentSuccess` | Firestore trigger | Post-payment workflows |
| `onSubscriptionChange` | Firestore trigger | VetPro subscription state machine |

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles, roles, karma balance |
| `pets` | Lost/found/adoption pet records |
| `sightings` | Sighting reports with GPS |
| `vet_clinics` | Clinic registry + verification state |
| `donations` | Donation records (Stripe-confirmed) |
| `karma_transactions` | Individual karma events |
| `karma_balances` | Aggregated balances per user |
| `patrol_sessions` | GPS patrol tracks |
| `missions` | Available rider missions |
| `leaderboard` | Aggregated karma rankings |
| `partner_stores` | Karma redemption partners |
| `karma_redemptions` | Redemption history |
| `rider_profiles` | Rider type, stats, level |
| `promo_codes` | Admin-managed discount codes |
| `audit_logs` | Admin action audit trail |
| `system_config` | AI settings, feature flags |
| `blog_posts` | AI-generated / scheduled content |
| `social_scheduled` | Social media post queue |

---

## Version History

| Version | Build | Date | Highlights |
|---|---|---|---|
| 1.1.0 | 413 | 2026-02-23 | OpenRouter AI, SVG badges, user profile, role tutorials, karma fixes, admin scroll fix |
| 1.0.0-beta.1 | 22 | 2026-02-12 | i18n, Footer, Admin Console |
| 1.0.0-alpha | — | 2026-01 | Initial platform, auth, maps, search |

---

## How Version Is Generated

`version.json` is **auto-generated** on every `npm run build` by `scripts/bump-version.js`:

```
npm run build
  └── prebuild: node scripts/bump-version.js
        ├── reads package.json → version
        ├── git rev-list --count HEAD → buildNumber
        ├── git rev-parse --short=7 HEAD → commitHash
        ├── git log -1 --format=%s → commitMessage
        └── writes version.json
```

To build for production with the correct `environment` flag:
```bash
npm run build:prod
```

---

## Known Limitations / TODO

- [ ] Push notifications not yet wired to FCM device tokens
- [ ] Social media scheduler posts are queued but not auto-published
- [ ] OpenRouter free-tier models may have rate limits (upgrade to paid if needed)
- [ ] Guest (anonymous) users cannot access Karma features
