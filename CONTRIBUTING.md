# Contributing to PawPrintFind

Thank you for your interest in contributing! PawPrintFind is a community-driven platform and every contribution helps reunite more pets with their families.

## Quick Start

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/PawPrintFind.git
cd PawPrintFind
npm install
cp .env.example .env.local  # Fill in your API keys
npm run dev
```

See [README.md](README.md) for full setup instructions.

## How to Contribute

### Reporting Bugs
- Open an [issue](https://github.com/50yas/PawPrintFind/issues) with the `bug` label
- Include: browser/OS, steps to reproduce, expected vs actual behavior, screenshots if relevant
- For security vulnerabilities, see [SECURITY.md](SECURITY.md) — **do not open a public issue**

### Suggesting Features
- Open an [issue](https://github.com/50yas/PawPrintFind/issues) with the `enhancement` label
- Describe the problem you're solving, not just the solution
- Check existing issues first to avoid duplicates

### Pull Requests
1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Make your changes (see Code Standards below)
3. Run tests: `npm test`
4. Run type-check: `npm run lint`
5. Push and open a PR against `main`
6. Fill out the PR template completely

## Code Standards

### TypeScript
- Strict mode — no `any` unless absolutely unavoidable
- All Firestore document types must have a corresponding Zod schema in `types.ts`
- Use the existing service facade (`dbService`) — don't call Firebase directly from components

### Components
- All user-facing text must use `useTranslations()` hook — no hardcoded strings
- No `alert()` or `window.confirm()` — use `useSnackbar()` or an inline confirmation modal
- Follow the glassmorphism design system (Tailwind + Framer Motion)
- Check the z-index scale in `CLAUDE.md` before adding new layered elements

### Internationalization
When adding new user-facing text, you **must** update all 16 translation files:
1. `src/translations/en.ts` (+ it, es, fr, de, zh, ar, ro)
2. `public/locales/en/common.json` (+ it, es, fr, de, zh, ar, ro)

See the Translation System section in `CLAUDE.md` for details.

### Adding a New View
1. Add view name to the `View` type in `types.ts`
2. Add routing in the appropriate router (`UserRouter`, `VetRouter`, etc.)
3. Create the component in `src/components/`
4. Add nav links in `Navbar.tsx` and `MobileNavigation.tsx`
5. Add translation keys to all 16 files

### Firestore / Backend
- New Firestore collections need: TypeScript interface + Zod schema + service method + security rules + indexes
- Security rules must be reviewed before merging — see `firestore.rules`
- Cloud Functions live in `functions/src/index.ts`

## Testing

```bash
npm run test          # Run all tests once
npx vitest --watch    # Watch mode
npx vitest run src/components/Foo.test.tsx  # Run a specific test
```

Write tests for new components in `*.test.tsx` files alongside the component.

## Commit Messages

Follow conventional commits:
- `feat: add social sharing to pet detail page`
- `fix: replace alert() calls with snackbar in VetVerificationModal`
- `chore: update firestore.rules for karma_transactions`
- `docs: improve README donation section`

## Questions?

Open a [discussion](https://github.com/50yas/PawPrintFind/discussions) or an issue with the `question` label.
