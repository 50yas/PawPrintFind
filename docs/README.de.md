<div align="center">

[← English](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**KI-gestützte Plattform zur Suche nach vermissten Haustieren und gemeinschaftlicher Rettung**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Vermisste Haustiere mit ihren Familien wieder vereinen — durch die Kraft der KI und der Gemeinschaft.*

</div>

---

## Was ist PawPrintFind?

PawPrintFind ist eine Echtzeit-Plattform, die von der Gemeinschaft getragen wird und künstliche Intelligenz einsetzt, um vermisste Haustiere zu finden und mit ihren Besitzern wiederzuvereinen. Nutzerinnen und Nutzer können vermisste Tiere melden, Sichtungen mit GPS-Koordinaten erfassen, KI-gestützte Treffervorschläge erhalten und Rettungseinsätze koordinieren — alles an einem Ort.

**Online unter:** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**Offizielle Website:** [https://pawprintfind.com](https://pawprintfind.com)

---

## Funktionen

### Für Tierbesitzer
- **Vermisste Haustiere melden** mit Fotos, Beschreibung und letztem bekannten Aufenthaltsort
- **KI-gestütztes Matching** — automatische Zuordnung von Sichtungen zu Vermisstmeldungen
- **Echtzeit-Sichtungsbenachrichtigungen** per Push-Benachrichtigung, wenn jemand Ihr Tier gesichtet hat
- **Interaktive Karte** mit Sichtungs-Clustern und Heatmaps
- **Mehrsprachige Unterstützung** — 8 Sprachen (EN, IT, ES, FR, DE, ZH, AR, RO)

### Für die Gemeinschaft
- **Rider Mission Center** — freiwillige Lieferboten sammeln Karma-Punkte für ihre Unterstützung bei Tierrettungen
- **Patrouillenmodus** — GPS-verfolgte Patrouillen für freiwillige Retter
- **Bestenliste** — Gemeinschafts-Karma-Rangliste mit Abzeichen und Stufen
- **25 Erfolgsabzeichen**, die Gemeinschaftsrettungsaktionen spielerisch gestalten

### Für Tierärzte
- **Verifiziertes Tierarzt-Dashboard** — dedizierte Oberfläche für verifizierte Kliniken
- **VetPro-Abonnement** — Premium-Tools über Stripe-Checkout
- **Klinikregistrierung** mit administrativem Verifizierungsablauf

### Für Tierheime und Rettungsorganisationen
- **Adoptionszentrum** — Präsentation von Tieren, die zur Adoption bereitstehen
- **Tierheim-Verwaltungsdashboard** mit Tier-Eingangs- und Statusverfolgung

### Plattform
- **PWA (Progressive Web App)** — installierbar, funktioniert offline
- **Echtzeit-Firestore-Synchronisierung** — Live-Updates auf allen verbundenen Clients
- **Admin-Dashboard** — unternehmenstaugliches 7-Tab-Kontrollzentrum mit Analytics, Benutzerverwaltung, Finanzen, Community-Tools, KI-Einstellungen und Audit-Logs
- **Gutscheinsystem** — Aktionscodes für Abonnements und Abzeichen
- **Spendentracking** mit Stripe-Webhooks und Krypto-Wallet-Unterstützung

---

## Technologie-Stack

| Schicht | Technologie |
|---------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Gestaltung | Tailwind CSS + Framer Motion + Glassmorphism |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Cloud Functions | Node.js 22 + TypeScript |
| KI | Google Gemini + OpenRouter (abstrahiert über aiBridgeService) |
| Zahlungen | Stripe (benutzerdefinierte Cloud Function + Extension als Fallback) |
| i18n | i18next + react-i18next (8 Sprachen) |
| PWA | Vite PWA Plugin + Workbox |
| Tests | Vitest + @testing-library/react |
| Validierung | Zod-Schemas für alle Firestore-Dokumente |

---

## Architektur

```
src/
├── components/         # UI-Komponenten
│   ├── admin/          # Tabs des Admin-Dashboards
│   ├── routers/        # Rollenbasierte View-Router
│   └── ui/             # Gemeinsame Design-System-Komponenten
├── hooks/              # Benutzerdefinierte React-Hooks
├── services/           # Service-Schicht (Firebase-Facade-Muster)
│   ├── firebase.ts     # dbService-Facade — Haupt-API-Oberfläche
│   ├── authService.ts  # Multi-Provider-Authentifizierung
│   ├── petService.ts   # Tier-CRUD und Sichtungen
│   ├── vetService.ts   # Tierkliniken und Verifizierung
│   ├── adminService.ts # Admin-Operationen und Audit-Logs
│   ├── searchService.ts# KI-gestütztes Tier-Matching
│   └── karmaService.ts # Gamification und Karma-Punkte
├── contexts/           # React-Contexts (Sprache, Theme, Snackbar)
├── translations/       # TypeScript-Übersetzungsobjekte (8 Sprachen)
└── types.ts            # Zentrale Typdefinitionen (~50+ Interfaces)

public/locales/         # JSON-Übersetzungsdateien (HttpBackend)
functions/src/          # Firebase Cloud Functions (Node.js 22)
```

**Routing:** Benutzerdefiniertes ansichtsbasiertes System (ohne React Router). `App.tsx` verwaltet die aktuelle Ansicht über den State, mit rollenbasierten Routern für `owner`, `vet`, `shelter`, `volunteer`, `super_admin`.

---

## Erste Schritte

### Voraussetzungen

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- Ein Firebase-Projekt ([erstellen Sie eines](https://console.firebase.google.com/))

### Einrichtung

```bash
# 1. Repository klonen
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
# Bearbeiten Sie .env.local und tragen Sie Ihre API-Schlüssel ein (alle erforderlichen Variablen finden Sie in .env.example)

# 4. Entwicklungsserver starten
npm run dev
# Die App ist unter http://localhost:3000 erreichbar
```

### Umgebungsvariablen

Kopieren Sie `.env.example` nach `.env.local` und tragen Sie Ihre Zugangsdaten ein:

| Variable | Beschreibung |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API-Schlüssel für KI-Funktionen |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Öffentlicher Stripe-Schlüssel (Test oder Live) |
| `VITE_FIREBASE_API_KEY` | Firebase-Projekt-API-Schlüssel |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase-Authentifizierungsdomäne |
| `VITE_FIREBASE_PROJECT_ID` | Firebase-Projekt-ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase-Speicher-Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase-Messaging-Absender-ID |
| `VITE_FIREBASE_APP_ID` | Firebase-App-ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics-Mess-ID |

---

## Entwicklungsbefehle

```bash
npm run dev        # Entwicklungsserver starten (Port 3000)
npm run build      # TypeScript-Prüfung + Vite-Produktionsbuild → dist/
npm run lint       # Nur Typprüfung (tsc --noEmit)
npm run test       # Alle Tests einmalig ausführen (vitest run)
npx vitest --watch # Watch-Modus für Tests
```

---

## Deployment

```bash
# Alles auf Firebase deployen
npm run deploy

# Nur das Frontend deployen
firebase deploy --only hosting

# Nur Cloud Functions deployen
firebase deploy --only functions

# Firestore-Sicherheitsregeln deployen
firebase deploy --only firestore:rules

# Firestore-Indizes deployen
firebase deploy --only firestore:indexes
```

---

## PawPrintFind unterstützen

PawPrintFind ist ein Open-Source-Gemeinschaftsprojekt. Der Betrieb dieser Plattform kostet ungefähr **€165/Monat** an Infrastruktur- und KI-Inferenzkosten. Wenn PawPrintFind Ihnen geholfen hat oder Sie an unsere Mission glauben, freuen wir uns über Ihre Unterstützung.

### Monatliche Plattformkosten

| Ressource | Monatliche Kosten |
|-----------|--------------------|
| KI-Inferenz (Gemini + OpenRouter) | €120,00 |
| Cloud-Infrastruktur (Firebase + GCP) | €45,00 |
| **Gesamt** | **€165,00 / Monat** |

---

### Spenden per Karte (Stripe)

Sichere Kartenzahlungen über [Stripe](https://stripe.com). Wählen Sie eine Stufe oder geben Sie einen individuellen Betrag auf [pawprint-50.web.app](https://pawprint-50.web.app) ein (klicken Sie auf die Herz-/Spendetaste):

| Stufe | Betrag | Vorteile |
|-------|--------|----------|
| ☕ Kaffee | €5 | Ewige Dankbarkeit + Community-Unterstützer-Abzeichen |
| 🌟 Unterstützer | €25 | Alle Kaffee-Vorteile + Status als hervorgehobener Spender + Frühzugang zu neuen Funktionen |
| 🦁 Held | €100 | Alle Unterstützer-Vorteile + Held-der-Community-Abzeichen + direkte Funktionsanfragen + persönliches Dankeschön |
| Individuell | Beliebiger Betrag (min. €1) | Nach Wahl |

Alle Kartenzahlungen werden über einen sicheren Stripe-Checkout abgewickelt. Sie erhalten eine Zahlungsbestätigung per E-Mail.

---

### Per Krypto spenden

Senden Sie Krypto direkt an unsere Wallets — kein Mittelsmann, sofortige Übertragung:

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

Sie können die QR-Codes auch direkt aus dem Spendenmodal in der App scannen.

> Jede Spende — egal wie groß — hilft dabei, die Plattform am Laufen zu halten und die Entwicklung neuer Funktionen zu unterstützen, die mehr Haustiere mit ihren Familien wieder zusammenbringen.

---

## Mitwirken

Beiträge sind willkommen! So können Sie starten:

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch: `git checkout -b feature/mein-feature`
3. Nehmen Sie Ihre Änderungen vor und schreiben Sie Tests
4. Führen Sie die Testsuite aus: `npm test`
5. Reichen Sie einen Pull Request ein

### Code-Stil

- TypeScript Strict-Modus — kein `any`, es sei denn, es ist absolut notwendig
- Alle benutzerseitig sichtbaren Texte müssen übersetzt werden (Schlüssel zu allen 8 Locale-Dateien hinzufügen)
- Das Service-Facade-Muster einhalten — neue Backend-Logik gehört in eine Service-Datei, zugänglich über `dbService`
- Zod-Schemas sind für alle neuen Firestore-Dokumenttypen erforderlich

### Eine neue Funktion hinzufügen

Weitere Informationen zu Architektur, Routing-Konventionen und der Dokumentation des Übersetzungssystems finden Sie in `CLAUDE.md`.

---

## Lizenz

MIT-Lizenz — siehe [LICENSE](LICENSE) für Details.

---

<div align="center">

Mit Liebe gemacht für jedes Tier, das seinen Weg nach Hause verdient.

**[Live Demo](https://pawprint-50.web.app)** · **[Fehler melden](https://github.com/50yas/PawPrintFind/issues)** · **[Funktion anfragen](https://github.com/50yas/PawPrintFind/issues)**

</div>
