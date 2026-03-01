<div align="center">

[← English](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**Piattaforma di ricerca animali domestici e salvataggio comunitario basata sull'intelligenza artificiale**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Riuniamo gli animali domestici smarriti con le loro famiglie grazie all'intelligenza artificiale e alla forza della comunità.*

</div>

---

## Cos'è PawPrintFind?

PawPrintFind è una piattaforma in tempo reale, guidata dalla comunità, che utilizza l'intelligenza artificiale per aiutare a localizzare e ritrovare gli animali domestici smarriti. Gli utenti possono segnalare animali dispersi, registrare avvistamenti con coordinate GPS, ottenere un abbinamento automatico tramite AI e coordinare gli sforzi di salvataggio — tutto in un unico posto.

**Online su:** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**Sito ufficiale:** [https://pawprintfind.com](https://pawprintfind.com)

---

## Funzionalità

### Per i Proprietari di Animali
- **Segnala animali smarriti** con foto, descrizione e ultima posizione nota
- **Abbinamento tramite AI** — correlazione automatica degli avvistamenti con le segnalazioni di animali dispersi
- **Avvisi di avvistamento in tempo reale** tramite notifiche push quando qualcuno vede il tuo animale
- **Mappa interattiva** con cluster di avvistamenti e mappe di calore
- **Supporto multilingua** — 8 lingue (EN, IT, ES, FR, DE, ZH, AR, RO)

### Per la Comunità
- **Rider Mission Center** — i rider volontari guadagnano Punti Karma aiutando nei salvataggi
- **Modalità pattuglia** — pattuglie tracciate via GPS per i soccorritori volontari
- **Classifica** — ranking karma della comunità con badge e livelli
- **25 badge risultato** che gamificano gli sforzi di salvataggio comunitario

### Per i Veterinari
- **Dashboard Vet Verificata** — interfaccia dedicata per le cliniche verificate
- **Abbonamento VetPro** — strumenti premium tramite checkout Stripe
- **Registrazione clinica** con flusso di verifica amministrativa

### Per Rifugi e Associazioni di Salvataggio
- **Centro adozioni** — vetrina per gli animali disponibili all'adozione
- **Dashboard di gestione del rifugio** con monitoraggio degli ingressi e dello stato degli animali

### Piattaforma
- **PWA (Progressive Web App)** — installabile, funziona offline
- **Sincronizzazione Firestore in tempo reale** — aggiornamenti in diretta su tutti i client connessi
- **Dashboard amministrativa** — pannello di controllo enterprise a 7 schede con analytics, gestione utenti, finanza, strumenti per la comunità, impostazioni AI e log di audit
- **Sistema di coupon** — codici promozionali per abbonamenti e badge
- **Tracciamento donazioni** con webhook Stripe e supporto portafogli crypto

---

## Stack Tecnologico

| Livello | Tecnologia |
|---------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Stile | Tailwind CSS + Framer Motion + Glassmorphism |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Cloud Functions | Node.js 22 + TypeScript |
| AI | Google Gemini + OpenRouter (astrazione tramite aiBridgeService) |
| Pagamenti | Stripe (Cloud Function personalizzata + Extension di riserva) |
| i18n | i18next + react-i18next (8 lingue) |
| PWA | Vite PWA Plugin + Workbox |
| Testing | Vitest + @testing-library/react |
| Validazione | Schemi Zod per tutti i documenti Firestore |

---

## Architettura

```
src/
├── components/         # Componenti UI
│   ├── admin/          # Schede dashboard amministrativa
│   ├── routers/        # Router delle viste basati sul ruolo
│   └── ui/             # Componenti condivisi del design system
├── hooks/              # Hook React personalizzati
├── services/           # Service layer (pattern facade Firebase)
│   ├── firebase.ts     # Facade dbService — superficie API principale
│   ├── authService.ts  # Autenticazione multi-provider
│   ├── petService.ts   # CRUD animali e avvistamenti
│   ├── vetService.ts   # Cliniche veterinarie e verifica
│   ├── adminService.ts # Operazioni admin e log di audit
│   ├── searchService.ts# Abbinamento animali tramite AI
│   └── karmaService.ts # Gamification e punti karma
├── contexts/           # Context React (Lingua, Tema, Snackbar)
├── translations/       # Oggetti di traduzione TypeScript (8 lingue)
└── types.ts            # Definizioni dei tipi centrali (~50+ interfacce)

public/locales/         # File di traduzione JSON (HttpBackend)
functions/src/          # Firebase Cloud Functions (Node.js 22)
```

**Routing:** Sistema personalizzato basato sulle viste (senza React Router). `App.tsx` gestisce la vista corrente tramite state, con router basati sul ruolo per `owner`, `vet`, `shelter`, `volunteer`, `super_admin`.

---

## Per Iniziare

### Prerequisiti

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- Un progetto Firebase ([creane uno](https://console.firebase.google.com/))

### Configurazione

```bash
# 1. Clona il repository
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env.local
# Modifica .env.local e inserisci le tue chiavi API (vedi .env.example per tutte le variabili richieste)

# 4. Avvia il server di sviluppo
npm run dev
# L'app è disponibile su http://localhost:3000
```

### Variabili d'Ambiente

Copia `.env.example` in `.env.local` e inserisci le tue credenziali:

| Variabile | Descrizione |
|-----------|-------------|
| `GEMINI_API_KEY` | Chiave API Google Gemini per le funzionalità AI |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Chiave pubblica Stripe (test o live) |
| `VITE_FIREBASE_API_KEY` | Chiave API del progetto Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio di autenticazione Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID del progetto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket di storage Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID mittente messaggi Firebase |
| `VITE_FIREBASE_APP_ID` | ID app Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID misurazione Firebase Analytics |

---

## Comandi di Sviluppo

```bash
npm run dev        # Avvia il server di sviluppo (porta 3000)
npm run build      # Controllo TypeScript + build produzione Vite → dist/
npm run lint       # Solo type-check (tsc --noEmit)
npm run test       # Esegui tutti i test una volta (vitest run)
npx vitest --watch # Modalità watch per i test
```

---

## Deploy

```bash
# Deploy completo su Firebase
npm run deploy

# Deploy solo del frontend
firebase deploy --only hosting

# Deploy solo delle Cloud Functions
firebase deploy --only functions

# Deploy delle regole di sicurezza Firestore
firebase deploy --only firestore:rules

# Deploy degli indici Firestore
firebase deploy --only firestore:indexes
```

---

## Sostieni PawPrintFind

PawPrintFind è un progetto comunitario open source. Mantenere questa piattaforma costa circa **€165/mese** in infrastruttura e costi di inferenza AI. Se PawPrintFind ti ha aiutato o credi nella nostra missione, considera di supportarci.

### Costi Mensili della Piattaforma

| Risorsa | Costo Mensile |
|---------|--------------|
| Inferenza AI (Gemini + OpenRouter) | €120,00 |
| Infrastruttura Cloud (Firebase + GCP) | €45,00 |
| **Totale** | **€165,00 / mese** |

---

### Dona con Carta (Stripe)

Pagamenti sicuri con carta tramite [Stripe](https://stripe.com). Scegli un livello o inserisci un importo personalizzato su [pawprint-50.web.app](https://pawprint-50.web.app) (clicca sul pulsante cuore/donazione):

| Livello | Importo | Vantaggi |
|---------|---------|----------|
| ☕ Caffè | €5 | Gratitudine eterna + badge Sostenitore della Comunità |
| 🌟 Sostenitore | €25 | Tutti i vantaggi Caffè + stato Donatore in Evidenza + accesso anticipato alle nuove funzionalità |
| 🦁 Eroe | €100 | Tutti i vantaggi Sostenitore + badge Eroe della Comunità + richieste di funzionalità dirette + ringraziamento personale |
| Personalizzato | Qualsiasi (min €1) | A tua scelta |

Tutte le donazioni con carta vengono elaborate tramite checkout Stripe sicuro. Riceverai una ricevuta via email.

---

### Dona in Crypto

Invia crypto direttamente ai nostri wallet — nessun intermediario, trasferimento immediato:

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

Puoi anche scansionare i codici QR direttamente dal pannello donazioni nell'app.

> Ogni donazione — indipendentemente dall'importo — aiuta a mantenere attiva la piattaforma e a sviluppare nuove funzionalità che permettono di riunire più animali con le loro famiglie.

---

## Contribuire

I contributi sono benvenuti! Ecco come iniziare:

1. Fai un fork del repository
2. Crea un branch per la funzionalità: `git checkout -b feature/mia-funzionalita`
3. Apporta le modifiche e scrivi i test
4. Esegui la suite di test: `npm test`
5. Invia una pull request

### Stile del Codice

- Modalità strict di TypeScript — nessun `any` se non strettamente necessario
- Tutto il testo visibile all'utente deve essere tradotto (aggiungi le chiavi a tutti gli 8 file locale)
- Segui il pattern service facade — la nuova logica backend va in un file service, esposta tramite `dbService`
- Gli schemi Zod sono obbligatori per tutti i nuovi tipi di documento Firestore

### Aggiungere una Nuova Funzionalità

Consulta `CLAUDE.md` per la guida dettagliata all'architettura, le convenzioni di routing e la documentazione del sistema di traduzione.

---

## Licenza

Licenza MIT — consulta [LICENSE](LICENSE) per i dettagli.

---

<div align="center">

Fatto con amore per ogni animale che merita di ritrovare la strada di casa.

**[Live Demo](https://pawprint-50.web.app)** · **[Segnala un Bug](https://github.com/50yas/PawPrintFind/issues)** · **[Richiedi una Funzionalità](https://github.com/50yas/PawPrintFind/issues)**

</div>
