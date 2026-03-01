<div align="center">

[← English](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**Plateforme de recherche d'animaux perdus et de sauvetage communautaire propulsée par l'IA**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Retrouver les animaux perdus et les réunir avec leur famille grâce à la puissance de l'IA et de la communauté.*

</div>

---

## Qu'est-ce que PawPrintFind ?

PawPrintFind est une plateforme en temps réel, animée par la communauté, qui utilise l'intelligence artificielle pour aider à localiser et à réunir les animaux perdus avec leurs familles. Les utilisateurs peuvent signaler des animaux disparus, enregistrer des signalements avec des coordonnées GPS, bénéficier d'une mise en correspondance automatique par IA et coordonner les efforts de sauvetage — le tout en un seul endroit.

**Disponible sur :** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**Site officiel :** [https://pawprintfind.com](https://pawprintfind.com)

---

## Fonctionnalités

### Pour les Propriétaires d'Animaux
- **Signalez les animaux perdus** avec photos, description et dernière position connue
- **Mise en correspondance par IA** — corrélation automatique des signalements avec les avis de disparition
- **Alertes de signalement en temps réel** par notifications push lorsque quelqu'un aperçoit votre animal
- **Carte interactive** avec regroupements de signalements et cartes de chaleur
- **Support multilingue** — 8 langues (EN, IT, ES, FR, DE, ZH, AR, RO)

### Pour la Communauté
- **Rider Mission Center** — les livreurs bénévoles gagnent des Points Karma en participant aux sauvetages
- **Mode patrouille** — patrouilles suivies par GPS pour les sauveteurs bénévoles
- **Classement** — palmarès karma de la communauté avec badges et niveaux
- **25 badges de réussite** qui gamifient les efforts de sauvetage communautaire

### Pour les Vétérinaires
- **Tableau de bord Vet Vérifié** — interface dédiée aux cliniques vérifiées
- **Abonnement VetPro** — outils premium via le paiement Stripe
- **Enregistrement de clinique** avec processus de vérification administrative

### Pour les Refuges et les Associations de Sauvetage
- **Centre d'adoption** — vitrine pour les animaux disponibles à l'adoption
- **Tableau de bord de gestion du refuge** avec suivi des entrées et de l'état des animaux

### Plateforme
- **PWA (Progressive Web App)** — installable, fonctionne hors ligne
- **Synchronisation Firestore en temps réel** — mises à jour en direct sur tous les clients connectés
- **Tableau de bord administrateur** — panneau de contrôle entreprise à 7 onglets avec analytics, gestion des utilisateurs, finances, outils communautaires, paramètres IA et journaux d'audit
- **Système de coupons** — codes promotionnels pour abonnements et badges
- **Suivi des dons** avec webhooks Stripe et prise en charge des portefeuilles crypto

---

## Stack Technologique

| Couche | Technologie |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Style | Tailwind CSS + Framer Motion + Glassmorphism |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Cloud Functions | Node.js 22 + TypeScript |
| IA | Google Gemini + OpenRouter (abstraction via aiBridgeService) |
| Paiements | Stripe (Cloud Function personnalisée + Extension de secours) |
| i18n | i18next + react-i18next (8 langues) |
| PWA | Vite PWA Plugin + Workbox |
| Tests | Vitest + @testing-library/react |
| Validation | Schémas Zod pour tous les documents Firestore |

---

## Architecture

```
src/
├── components/         # Composants UI
│   ├── admin/          # Onglets du tableau de bord administrateur
│   ├── routers/        # Routeurs de vues basés sur les rôles
│   └── ui/             # Composants partagés du système de design
├── hooks/              # Hooks React personnalisés
├── services/           # Couche de services (pattern facade Firebase)
│   ├── firebase.ts     # Facade dbService — surface API principale
│   ├── authService.ts  # Authentification multi-fournisseur
│   ├── petService.ts   # CRUD animaux et signalements
│   ├── vetService.ts   # Cliniques vétérinaires et vérification
│   ├── adminService.ts # Opérations d'administration et journaux d'audit
│   ├── searchService.ts# Mise en correspondance d'animaux par IA
│   └── karmaService.ts # Gamification et points karma
├── contexts/           # Contextes React (Langue, Thème, Snackbar)
├── translations/       # Objets de traduction TypeScript (8 langues)
└── types.ts            # Définitions de types centrales (~50+ interfaces)

public/locales/         # Fichiers de traduction JSON (HttpBackend)
functions/src/          # Firebase Cloud Functions (Node.js 22)
```

**Routage :** Système personnalisé basé sur les vues (sans React Router). `App.tsx` gère la vue actuelle via l'état, avec des routeurs basés sur les rôles pour `owner`, `vet`, `shelter`, `volunteer`, `super_admin`.

---

## Démarrage

### Prérequis

- Node.js >= 22
- Firebase CLI : `npm install -g firebase-tools`
- Un projet Firebase ([créez-en un](https://console.firebase.google.com/))

### Configuration

```bash
# 1. Cloner le dépôt
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Modifiez .env.local et renseignez vos clés API (consultez .env.example pour toutes les variables requises)

# 4. Lancer le serveur de développement
npm run dev
# L'application est disponible sur http://localhost:3000
```

### Variables d'Environnement

Copiez `.env.example` dans `.env.local` et renseignez vos identifiants :

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Clé API Google Gemini pour les fonctionnalités IA |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (test ou production) |
| `VITE_FIREBASE_API_KEY` | Clé API du projet Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de stockage Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID de l'expéditeur de messagerie Firebase |
| `VITE_FIREBASE_APP_ID` | ID de l'application Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID de mesure Firebase Analytics |

---

## Commandes de Développement

```bash
npm run dev        # Lancer le serveur de développement (port 3000)
npm run build      # Vérification TypeScript + build production Vite → dist/
npm run lint       # Vérification de types uniquement (tsc --noEmit)
npm run test       # Exécuter tous les tests une fois (vitest run)
npx vitest --watch # Mode watch pour les tests
```

---

## Déploiement

```bash
# Déployer tout sur Firebase
npm run deploy

# Déployer uniquement le frontend
firebase deploy --only hosting

# Déployer uniquement les Cloud Functions
firebase deploy --only functions

# Déployer les règles de sécurité Firestore
firebase deploy --only firestore:rules

# Déployer les index Firestore
firebase deploy --only firestore:indexes
```

---

## Soutenir PawPrintFind

PawPrintFind est un projet communautaire open source. Faire fonctionner cette plateforme coûte environ **€165/mois** en infrastructure et en coûts d'inférence IA. Si PawPrintFind vous a aidé ou si vous croyez en notre mission, pensez à nous soutenir.

### Coûts Mensuels de la Plateforme

| Ressource | Coût Mensuel |
|-----------|-------------|
| Inférence IA (Gemini + OpenRouter) | €120,00 |
| Infrastructure Cloud (Firebase + GCP) | €45,00 |
| **Total** | **€165,00 / mois** |

---

### Faire un Don par Carte (Stripe)

Paiements sécurisés par carte via [Stripe](https://stripe.com). Choisissez un niveau ou entrez un montant personnalisé sur [pawprint-50.web.app](https://pawprint-50.web.app) (cliquez sur le bouton cœur/don) :

| Niveau | Montant | Avantages |
|--------|---------|-----------|
| ☕ Café | €5 | Gratitude éternelle + badge Soutien de la Communauté |
| 🌟 Soutien | €25 | Tous les avantages Café + statut Donateur Mis en Avant + accès anticipé aux nouvelles fonctionnalités |
| 🦁 Héros | €100 | Tous les avantages Soutien + badge Héros de la Communauté + demandes de fonctionnalités directes + remerciement personnel |
| Personnalisé | N'importe quel montant (min. €1) | Votre choix |

Tous les dons par carte sont traités via un paiement Stripe sécurisé. Vous recevrez un reçu par e-mail.

---

### Faire un Don en Crypto

Envoyez des crypto directement à nos portefeuilles — sans intermédiaire, transfert instantané :

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

Vous pouvez également scanner les codes QR directement depuis le modal de don dans l'application.

> Chaque don — quelle qu'en soit la taille — aide à maintenir la plateforme en fonctionnement et soutient le développement de nouvelles fonctionnalités qui permettent de réunir davantage d'animaux avec leur famille.

---

## Contribuer

Les contributions sont les bienvenues ! Voici comment démarrer :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité : `git checkout -b feature/ma-fonctionnalite`
3. Apportez vos modifications et rédigez des tests
4. Exécutez la suite de tests : `npm test`
5. Soumettez une pull request

### Style de Code

- Mode strict TypeScript — pas de `any` sauf si absolument nécessaire
- Tout le texte visible par l'utilisateur doit être traduit (ajoutez les clés aux 8 fichiers de paramètres régionaux)
- Suivez le pattern service facade — la nouvelle logique backend va dans un fichier de service, exposée via `dbService`
- Les schémas Zod sont obligatoires pour tous les nouveaux types de documents Firestore

### Ajouter une Nouvelle Fonctionnalité

Consultez `CLAUDE.md` pour des conseils détaillés sur l'architecture, les conventions de routage et la documentation du système de traduction.

---

## Licence

Licence MIT — consultez [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

Fait avec amour pour chaque animal qui mérite de retrouver le chemin de la maison.

**[Live Demo](https://pawprint-50.web.app)** · **[Signaler un Bug](https://github.com/50yas/PawPrintFind/issues)** · **[Demander une Fonctionnalité](https://github.com/50yas/PawPrintFind/issues)**

</div>
