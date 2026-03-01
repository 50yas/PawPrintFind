<div align="center">

[← English](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**Plataforma de búsqueda de mascotas y rescate comunitario impulsada por IA**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Reuniendo a las mascotas perdidas con sus familias a través del poder de la IA y la comunidad.*

</div>

---

## ¿Qué es PawPrintFind?

PawPrintFind es una plataforma en tiempo real impulsada por la comunidad que utiliza inteligencia artificial para ayudar a localizar y reunir a las mascotas perdidas con sus dueños. Los usuarios pueden reportar mascotas desaparecidas, registrar avistamientos con coordenadas GPS, obtener coincidencias automáticas mediante IA y coordinar los esfuerzos de rescate — todo en un solo lugar.

**Disponible en:** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**Sitio web oficial:** [https://pawprintfind.com](https://pawprintfind.com)

---

## Funcionalidades

### Para Dueños de Mascotas
- **Reporta mascotas perdidas** con fotos, descripción y última ubicación conocida
- **Coincidencia mediante IA** — correlación automática de avistamientos con reportes de mascotas desaparecidas
- **Alertas de avistamiento en tiempo real** por notificaciones push cuando alguien ve a tu mascota
- **Mapa interactivo** con agrupaciones de avistamientos y mapas de calor
- **Soporte multiidioma** — 8 idiomas (EN, IT, ES, FR, DE, ZH, AR, RO)

### Para la Comunidad
- **Rider Mission Center** — los mensajeros voluntarios ganan Puntos de Karma por ayudar en rescates de mascotas
- **Modo patrulla** — patrullas con seguimiento GPS para rescatistas voluntarios
- **Clasificación** — ranking de karma de la comunidad con insignias y niveles
- **25 insignias de logro** que gamifican los esfuerzos de rescate comunitario

### Para Veterinarios
- **Panel Vet Verificado** — interfaz dedicada para clínicas verificadas
- **Suscripción VetPro** — herramientas premium mediante checkout de Stripe
- **Registro de clínica** con flujo de verificación administrativa

### Para Refugios y Rescatistas
- **Centro de adopciones** — exhibición de mascotas disponibles para adopción
- **Panel de gestión del refugio** con seguimiento de ingresos y estado de animales

### Plataforma
- **PWA (Progressive Web App)** — instalable, funciona sin conexión
- **Sincronización Firestore en tiempo real** — actualizaciones en vivo en todos los clientes conectados
- **Panel de administración** — panel de control empresarial de 7 pestañas con analytics, gestión de usuarios, finanzas, herramientas para la comunidad, configuración de IA y registros de auditoría
- **Sistema de cupones** — códigos promocionales para suscripciones e insignias
- **Seguimiento de donaciones** con webhooks de Stripe y soporte para monederos crypto

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + Framer Motion + Glassmorphism |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Cloud Functions | Node.js 22 + TypeScript |
| IA | Google Gemini + OpenRouter (abstracción mediante aiBridgeService) |
| Pagos | Stripe (Cloud Function personalizada + Extension de respaldo) |
| i18n | i18next + react-i18next (8 idiomas) |
| PWA | Vite PWA Plugin + Workbox |
| Pruebas | Vitest + @testing-library/react |
| Validación | Esquemas Zod para todos los documentos Firestore |

---

## Arquitectura

```
src/
├── components/         # Componentes de UI
│   ├── admin/          # Pestañas del panel de administración
│   ├── routers/        # Routers de vistas basados en roles
│   └── ui/             # Componentes compartidos del sistema de diseño
├── hooks/              # Hooks de React personalizados
├── services/           # Capa de servicios (patrón facade de Firebase)
│   ├── firebase.ts     # Facade dbService — superficie principal de la API
│   ├── authService.ts  # Autenticación multi-proveedor
│   ├── petService.ts   # CRUD de mascotas y avistamientos
│   ├── vetService.ts   # Clínicas veterinarias y verificación
│   ├── adminService.ts # Operaciones de administración y registros de auditoría
│   ├── searchService.ts# Coincidencia de mascotas mediante IA
│   └── karmaService.ts # Gamificación y puntos de karma
├── contexts/           # Contextos de React (Idioma, Tema, Snackbar)
├── translations/       # Objetos de traducción TypeScript (8 idiomas)
└── types.ts            # Definiciones de tipos centrales (~50+ interfaces)

public/locales/         # Archivos de traducción JSON (HttpBackend)
functions/src/          # Firebase Cloud Functions (Node.js 22)
```

**Enrutamiento:** Sistema personalizado basado en vistas (sin React Router). `App.tsx` gestiona la vista actual mediante estado, con routers basados en roles para `owner`, `vet`, `shelter`, `volunteer`, `super_admin`.

---

## Comenzar

### Requisitos Previos

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- Un proyecto de Firebase ([crea uno](https://console.firebase.google.com/))

### Configuración

```bash
# 1. Clona el repositorio
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. Instala las dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env.local
# Edita .env.local y rellena tus claves API (consulta .env.example para todas las variables requeridas)

# 4. Inicia el servidor de desarrollo
npm run dev
# La aplicación está disponible en http://localhost:3000
```

### Variables de Entorno

Copia `.env.example` a `.env.local` y rellena tus credenciales:

| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY` | Clave API de Google Gemini para funciones de IA |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe (prueba o producción) |
| `VITE_FIREBASE_API_KEY` | Clave API del proyecto Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente de mensajería Firebase |
| `VITE_FIREBASE_APP_ID` | ID de la aplicación Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID de medición de Firebase Analytics |

---

## Comandos de Desarrollo

```bash
npm run dev        # Inicia el servidor de desarrollo (puerto 3000)
npm run build      # Comprobación TypeScript + build de producción Vite → dist/
npm run lint       # Solo verificación de tipos (tsc --noEmit)
npm run test       # Ejecuta todos los tests una vez (vitest run)
npx vitest --watch # Modo watch para tests
```

---

## Despliegue

```bash
# Despliega todo en Firebase
npm run deploy

# Despliega solo el frontend
firebase deploy --only hosting

# Despliega solo las Cloud Functions
firebase deploy --only functions

# Despliega las reglas de seguridad de Firestore
firebase deploy --only firestore:rules

# Despliega los índices de Firestore
firebase deploy --only firestore:indexes
```

---

## Apoya PawPrintFind

PawPrintFind es un proyecto comunitario de código abierto. Mantener esta plataforma cuesta aproximadamente **€165/mes** en infraestructura y costes de inferencia de IA. Si PawPrintFind te ha ayudado o crees en nuestra misión, considera apoyarnos.

### Costes Mensuales de la Plataforma

| Recurso | Coste Mensual |
|---------|--------------|
| Inferencia de IA (Gemini + OpenRouter) | €120,00 |
| Infraestructura Cloud (Firebase + GCP) | €45,00 |
| **Total** | **€165,00 / mes** |

---

### Dona con Tarjeta (Stripe)

Pagos seguros con tarjeta a través de [Stripe](https://stripe.com). Elige un nivel o introduce una cantidad personalizada en [pawprint-50.web.app](https://pawprint-50.web.app) (haz clic en el botón de corazón/donación):

| Nivel | Cantidad | Ventajas |
|-------|----------|----------|
| ☕ Café | €5 | Gratitud eterna + insignia de Colaborador de la Comunidad |
| 🌟 Colaborador | €25 | Todas las ventajas de Café + estado de Donante Destacado + acceso anticipado a nuevas funciones |
| 🦁 Héroe | €100 | Todas las ventajas de Colaborador + insignia Héroe de la Comunidad + solicitudes de funciones directas + agradecimiento personal |
| Personalizado | Cualquier cantidad (mín. €1) | A tu elección |

Todas las donaciones con tarjeta se procesan a través de un checkout seguro de Stripe. Recibirás un recibo por correo electrónico.

---

### Dona en Crypto

Envía crypto directamente a nuestras carteras — sin intermediarios, transferencia instantánea:

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

También puedes escanear los códigos QR directamente desde el modal de donación dentro de la aplicación.

> Cada donación — sin importar el monto — ayuda a mantener la plataforma en funcionamiento y apoya el desarrollo de nuevas funciones que reúnen a más mascotas con sus familias.

---

## Contribuir

¡Las contribuciones son bienvenidas! Así es como puedes empezar:

1. Haz un fork del repositorio
2. Crea una rama para la función: `git checkout -b feature/mi-funcion`
3. Realiza tus cambios y escribe pruebas
4. Ejecuta la suite de pruebas: `npm test`
5. Envía una pull request

### Estilo de Código

- Modo estricto de TypeScript — sin `any` a menos que sea absolutamente necesario
- Todo el texto visible al usuario debe estar traducido (agrega las claves a los 8 archivos de configuración regional)
- Sigue el patrón service facade — la nueva lógica de backend va en un archivo de servicio, expuesta mediante `dbService`
- Los esquemas Zod son obligatorios para todos los nuevos tipos de documentos Firestore

### Añadir una Nueva Función

Consulta `CLAUDE.md` para obtener orientación detallada sobre la arquitectura, las convenciones de enrutamiento y la documentación del sistema de traducción.

---

## Licencia

Licencia MIT — consulta [LICENSE](LICENSE) para más detalles.

---

<div align="center">

Hecho con amor por cada mascota que merece encontrar el camino a casa.

**[Live Demo](https://pawprint-50.web.app)** · **[Reportar un Error](https://github.com/50yas/PawPrintFind/issues)** · **[Solicitar una Función](https://github.com/50yas/PawPrintFind/issues)**

</div>
