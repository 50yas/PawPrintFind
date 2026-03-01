<div align="center">

[← English](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**Platformă de găsire a animalelor de companie și salvare comunitară, alimentată de inteligență artificială**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Reunim animalele de companie pierdute cu familiile lor prin puterea inteligenței artificiale și a comunității.*

</div>

---

## Ce este PawPrintFind?

PawPrintFind este o platformă comunitară în timp real care utilizează inteligența artificială pentru a ajuta la localizarea și recuperarea animalelor de companie pierdute. Utilizatorii pot raporta animale dispărute, înregistra avizări cu coordonate GPS, beneficia de potriviri automate prin IA și coordona eforturile de salvare — totul într-un singur loc.

**Disponibil la:** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**Site oficial:** [https://pawprintfind.com](https://pawprintfind.com)

---

## Funcționalități

### Pentru Proprietarii de Animale
- **Raportează animale pierdute** cu fotografii, descriere și ultima locație cunoscută
- **Potrivire prin IA** — corelarea automată a avizărilor cu rapoartele de animale dispărute
- **Alerte de avizare în timp real** prin notificări push când cineva vede animalul tău
- **Hartă interactivă** cu grupuri de avizări și hărți termice
- **Suport multilingv** — 8 limbi (EN, IT, ES, FR, DE, ZH, AR, RO)

### Pentru Comunitate
- **Rider Mission Center** — curieri voluntari câștigă Puncte Karma ajutând la salvarea animalelor
- **Mod patrulă** — patrule urmărite prin GPS pentru salvatori voluntari
- **Clasament** — ierarhia de karma a comunității cu insigne și niveluri
- **25 de insigne de realizare** care gamifică eforturile de salvare comunitară

### Pentru Medici Veterinari
- **Tablou de bord Vet Verificat** — interfață dedicată pentru clinicile verificate
- **Abonament VetPro** — instrumente premium prin plată Stripe
- **Înregistrare clinică** cu flux de verificare administrativă

### Pentru Adăposturi și Organizații de Salvare
- **Centru de adopție** — prezentarea animalelor disponibile pentru adopție
- **Tablou de bord de management al adăpostului** cu urmărirea intrărilor și stării animalelor

### Platformă
- **PWA (Progressive Web App)** — instalabilă, funcționează offline
- **Sincronizare Firestore în timp real** — actualizări live pe toate dispozitivele conectate
- **Tablou de bord de administrare** — panou de control enterprise cu 7 file, incluzând analiză, management utilizatori, finanțe, instrumente comunitare, setări IA și jurnale de audit
- **Sistem de cupoane** — coduri promoționale pentru abonamente și insigne
- **Urmărire donații** cu webhook-uri Stripe și suport portofele crypto

---

## Stack Tehnologic

| Strat | Tehnologie |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Stilizare | Tailwind CSS + Framer Motion + Glassmorphism |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Cloud Functions | Node.js 22 + TypeScript |
| IA | Google Gemini + OpenRouter (abstractizat prin aiBridgeService) |
| Plăți | Stripe (Cloud Function personalizată + Extension de rezervă) |
| i18n | i18next + react-i18next (8 limbi) |
| PWA | Vite PWA Plugin + Workbox |
| Testare | Vitest + @testing-library/react |
| Validare | Scheme Zod pentru toate documentele Firestore |

---

## Arhitectură

```
src/
├── components/         # Componente UI
│   ├── admin/          # Filele tabloului de bord de administrare
│   ├── routers/        # Routere de vizualizare bazate pe rol
│   └── ui/             # Componente partajate ale sistemului de design
├── hooks/              # Hook-uri React personalizate
├── services/           # Stratul de servicii (pattern facade Firebase)
│   ├── firebase.ts     # Facade dbService — suprafața API principală
│   ├── authService.ts  # Autentificare multi-furnizor
│   ├── petService.ts   # CRUD animale și avizări
│   ├── vetService.ts   # Clinici veterinare și verificare
│   ├── adminService.ts # Operații de administrare și jurnale de audit
│   ├── searchService.ts# Potrivire animale prin IA
│   └── karmaService.ts # Gamificare și puncte karma
├── contexts/           # Contexte React (Limbă, Temă, Snackbar)
├── translations/       # Obiecte de traducere TypeScript (8 limbi)
└── types.ts            # Definiții de tipuri centrale (~50+ interfețe)

public/locales/         # Fișiere de traducere JSON (HttpBackend)
functions/src/          # Firebase Cloud Functions (Node.js 22)
```

**Rutare:** Sistem personalizat bazat pe vizualizări (fără React Router). `App.tsx` gestionează vizualizarea curentă prin stare, cu routere bazate pe rol pentru `owner`, `vet`, `shelter`, `volunteer`, `super_admin`.

---

## Noțiuni de Bază

### Cerințe Preliminare

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- Un proiect Firebase ([creează unul](https://console.firebase.google.com/))

### Configurare

```bash
# 1. Clonează repository-ul
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. Instalează dependențele
npm install

# 3. Configurează variabilele de mediu
cp .env.example .env.local
# Editează .env.local și completează cheile API (vezi .env.example pentru toate variabilele necesare)

# 4. Pornește serverul de dezvoltare
npm run dev
# Aplicația rulează la http://localhost:3000
```

### Variabile de Mediu

Copiază `.env.example` în `.env.local` și completează credențialele:

| Variabilă | Descriere |
|-----------|-----------|
| `GEMINI_API_KEY` | Cheie API Google Gemini pentru funcțiile IA |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Cheie publică Stripe (test sau producție) |
| `VITE_FIREBASE_API_KEY` | Cheie API proiect Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domeniu de autentificare Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID-ul proiectului Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de stocare Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID expeditor mesaje Firebase |
| `VITE_FIREBASE_APP_ID` | ID aplicație Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID măsurare Firebase Analytics |

---

## Comenzi de Dezvoltare

```bash
npm run dev        # Pornește serverul de dezvoltare (portul 3000)
npm run build      # Verificare TypeScript + build producție Vite → dist/
npm run lint       # Numai verificare tipuri (tsc --noEmit)
npm run test       # Rulează toate testele o dată (vitest run)
npx vitest --watch # Mod watch pentru teste
```

---

## Deployment

```bash
# Deployează totul pe Firebase
npm run deploy

# Deployează doar frontend-ul
firebase deploy --only hosting

# Deployează doar Cloud Functions
firebase deploy --only functions

# Deployează regulile de securitate Firestore
firebase deploy --only firestore:rules

# Deployează indexele Firestore
firebase deploy --only firestore:indexes
```

---

## Susține PawPrintFind

PawPrintFind este un proiect comunitar open source. Menținerea acestei platforme costă aproximativ **€165/lună** în infrastructură și costuri de inferență IA. Dacă PawPrintFind te-a ajutat sau crezi în misiunea noastră, te rugăm să iei în considerare sprijinul tău.

### Costuri Lunare ale Platformei

| Resursă | Cost Lunar |
|---------|-----------|
| Inferență IA (Gemini + OpenRouter) | €120,00 |
| Infrastructură Cloud (Firebase + GCP) | €45,00 |
| **Total** | **€165,00 / lună** |

---

### Donează cu Cardul (Stripe)

Plăți sigure cu cardul prin [Stripe](https://stripe.com). Alege un nivel sau introdu o sumă personalizată pe [pawprint-50.web.app](https://pawprint-50.web.app) (apasă butonul inimă/donație):

| Nivel | Sumă | Beneficii |
|-------|------|-----------|
| ☕ Cafea | €5 | Recunoștință eternă + insignă Susținător al Comunității |
| 🌟 Susținător | €25 | Toate beneficiile de la Cafea + statut Donator Evidențiat + acces anticipat la funcții noi |
| 🦁 Erou | €100 | Toate beneficiile de la Susținător + insignă Eroul Comunității + cereri directe de funcții + mulțumire personală |
| Personalizat | Orice sumă (min. €1) | La alegerea ta |

Toate donațiile cu cardul sunt procesate prin Stripe securizat. Vei primi o chitanță pe email.

---

### Donează în Crypto

Trimite crypto direct la portofelele noastre — fără intermediari, transfer instant:

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

Poți scana codurile QR direct din modalul de donație din aplicație.

> Fiecare donație — indiferent de mărime — ajută la menținerea platformei și sprijină dezvoltarea de noi funcții care reunesc mai multe animale cu familiile lor.

---

## Contribuție

Contribuțiile sunt binevenite! Iată cum să începi:

1. Fork-uiește repository-ul
2. Creează o ramură pentru funcționalitate: `git checkout -b feature/functia-mea`
3. Efectuează modificările și scrie teste
4. Rulează suita de teste: `npm test`
5. Trimite un pull request

### Stilul Codului

- Modul strict TypeScript — fără `any` dacă nu este absolut necesar
- Tot textul vizibil utilizatorului trebuie tradus (adaugă cheile în toate cele 8 fișiere locale)
- Respectă pattern-ul service facade — noua logică backend merge într-un fișier de serviciu, expusă prin `dbService`
- Schemele Zod sunt obligatorii pentru toate tipurile noi de documente Firestore

### Adăugarea unei Funcționalități Noi

Consultă `CLAUDE.md` pentru ghidare detaliată a arhitecturii, convențiile de rutare și documentația sistemului de traducere.

---

## Licență

Licență MIT — consultă [LICENSE](LICENSE) pentru detalii.

---

<div align="center">

Creat cu dragoste pentru fiecare animal care merită să-și găsească drumul spre casă.

**[Live Demo](https://pawprint-50.web.app)** · **[Raportează un Bug](https://github.com/50yas/PawPrintFind/issues)** · **[Solicită o Funcționalitate](https://github.com/50yas/PawPrintFind/issues)**

</div>
