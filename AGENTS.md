# AGENTS.md

This file provides guidance to agentic coding agents working in this repository.

## Project Overview

PawPrintFind is an AI-powered pet finder web app built with React 18 + TypeScript + Firebase. It's a single-page application (Vite build) deployed to Firebase Hosting and Google App Engine.

## Build/Lint/Test Commands

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # TypeScript check + Vite production build → dist/
npm run lint       # Type-check only (tsc --noEmit)
npm run test       # Run all tests once (vitest run)
npm run test:watch # Run tests in watch mode
npx vitest run <file>   # Run a single test file (e.g., npx vitest run components/Foo.test.tsx)
npm run deploy     # Deploy to Firebase (runs build first via predeploy)
firebase deploy --only hosting           # Deploy frontend only
firebase deploy --only functions         # Deploy Cloud Functions only
```

## Code Style Guidelines

### Imports and Formatting
- Use ES6 import/export syntax
- Group imports in this order: React, third-party libraries, local services/hooks/components
- Use absolute imports for services (`../services/...`) and relative imports for components (`./components/...`)
- Use `vi.mock()` for Firebase SDK mocks in vitest setup
- Use `lazy()` for code splitting large components

### TypeScript Conventions
- Use strict TypeScript configuration
- Define all Firestore document types in `types.ts`
- Use Zod schemas for runtime validation (`validationService.ts`)
- Use `UserRole` enum for role-based access control
- Prefer explicit types over `any`

### Naming Conventions
- Components: PascalCase (e.g., `LiveAssistantFAB`)
- Functions/variables: camelCase (e.g., `useAppState`)
- Constants: UPPER_SNAKE_CASE (e.g., `GEMINI_API_KEY`)
- Files: PascalCase for components, camelCase for utilities
- Test files: `*.test.tsx` or `*.test.ts` alongside source files

### Component Structure
- Use functional components with React hooks
- Implement Error Boundaries for error handling
- Use Suspense for lazy-loaded components
- Follow the Facade Pattern for service layer
- Use Context for global state (Language, Theme, Snackbar)

### Service Layer
- All Firebase operations go through `services/firebase.ts`
- Use specialized services: `authService.ts`, `petService.ts`, `vetService.ts`, etc.
- AI features route through `aiBridgeService.ts` (Gemini ↔ OpenRouter abstraction)
- Use `loggerService.ts` for centralized logging

### State Management
- No Redux/Zustand - use React Context + hooks
- `useAppState` hook for global data fetching with Firestore `onSnapshot`
- Local state for component-level concerns
- Use `useSnackbar` for toast notifications

### Internationalization
- Use i18next with react-i18next
- 8 languages supported: en, it, es, fr, de, zh, ar, ro
- Translation files in `translations/*.ts` and `public/locales/{lang}/*.json`
- Access via `useTranslation()` hook

### Authentication & Authorization
- Firebase Auth with multiple providers
- Roles: `owner`, `vet`, `shelter`, `volunteer`, `super_admin`
- Admin access controlled by email whitelist in Firestore rules + custom claims

### Testing
- Vitest + @testing-library/react + vitest-axe (accessibility)
- Global mocks in `vitest.setup.ts` for Firebase SDK, i18next, crypto.subtle, IntersectionObserver
- Test files: `*.test.tsx` alongside components
- Use `describe()` blocks for test organization

### Error Handling
- Use Error Boundaries for component-level errors
- Implement proper error boundaries in `components/ErrorBoundary.tsx`
- Use try-catch blocks in async service calls
- Log errors through `loggerService.ts`

### Security
- Use DOMPurify for XSS prevention (`sanitizationService.ts`)
- Never commit secrets or API keys
- Environment variables in `.env.local`
- Follow Firestore security rules in `firestore.rules`

### Performance
- Implement code splitting with lazy loading
- Use React.memo for expensive components
- Optimize Firebase queries with proper indexing
- Use PWA with Workbox caching (network-first for Firestore API)

### File Organization
- Components in `components/` directory
- Services in `services/` directory
- Hooks in `hooks/` directory
- Utils in `utils/` directory
- Types in `types.ts`
- Tests alongside source files

### Git Conventions
- Use conventional commit messages
- Never commit `.env.local` or sensitive files
- Run `npm run lint` before committing
- Ensure all tests pass before pushing

### Environment
- Node >=22 required
- Firebase project ID: `pawprint-50`
- Environment: `GEMINI_API_KEY` in `.env.local`
- Firebase config is hardcoded in `services/firebase.ts`

### Architecture Patterns
- Facade Pattern for service layer
- Custom view-based routing (no React Router)
- Role-based routers in `components/routers/`
- Deep linking for `/pet/{petId}` via URL parsing

### Key Files to Understand
- `App.tsx` - Main app component with routing
- `services/firebase.ts` - Main Firebase service facade
- `types.ts` - Central type definitions
- `vitest.setup.ts` - Test setup with mocks
- `components/routers/` - Role-based routing
- `services/` - Service layer implementation

## Development Workflow
1. Run `npm run dev` to start development server
2. Make changes following the conventions above
3. Run `npm run lint` to type-check
4. Run `npm run test` to ensure tests pass
5. Run `npm run build` to verify production build
6. Deploy with `npm run deploy` when ready

## Important Notes
- All AI features must route through `aiBridgeService.ts`
- Never modify Firestore rules without understanding security implications
- Use the provided services instead of direct Firebase calls
- Follow the existing component patterns when creating new components
- Test accessibility with vitest-axe
- Consider PWA requirements for offline functionality