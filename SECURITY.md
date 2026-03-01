# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main` branch) | Yes |
| Older releases | No |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Security issues can expose users' data or compromise platform integrity. To responsibly disclose a vulnerability:

1. **Email us directly** at: `meya@europe.com` *(or open a private GitHub Security Advisory)*
2. Include in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested mitigations (optional)
3. We will acknowledge receipt within **48 hours**
4. We aim to release a fix within **7 days** for critical issues, **30 days** for non-critical

## Scope

In scope for responsible disclosure:
- Firestore security rules bypasses
- Firebase Storage unauthorized access
- Authentication bypass or privilege escalation
- Cross-site scripting (XSS) in user-generated content
- Injection vulnerabilities in Cloud Functions
- Exposed API keys or secrets in the client bundle

Out of scope:
- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report directly to the dependency maintainer)
- Issues requiring physical access to a device

## Security Architecture Notes

- **Firestore rules**: All collections have explicit security rules in `firestore.rules`
- **Authentication**: Firebase Auth with role-based access control (owner, vet, shelter, volunteer, super_admin)
- **Admin access**: Controlled by email whitelist + Firestore custom claims
- **Payments**: All payment processing goes through Stripe — no card data touches our servers
- **AI keys**: Server-side AI calls go through Cloud Functions — API keys are never in the client bundle
- **XSS prevention**: User-generated content is sanitized via DOMPurify (`sanitizationService.ts`)
- **Validation**: All Firestore inputs validated with Zod schemas (`validationService.ts`)

## Known Limitations

- Firebase Storage rules cannot call Firestore, so pet photo write rules are currently path-based rather than ownership-based. A Cloud Function upload proxy is planned.
- The client bundle includes Firebase configuration keys (`VITE_FIREBASE_*`). This is by Firebase design — these are not secret credentials and are protected by Firebase Security Rules.

Thank you for helping keep PawPrintFind safe.
