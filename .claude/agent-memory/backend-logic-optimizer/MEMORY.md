# Backend Logic Optimizer Memory

## Security Audit Findings (2026-02-11)

### Critical Vulnerabilities Fixed
1. **Firestore Rules**: favorites/saved_searches missing create validation (lines 200-204, 179-181)
2. **Coordinate Validation**: Wrong lat/lng ranges (-180/180 instead of -90/90 for lat)
3. **XSS Prevention**: Sanitization service exists but NOT used in petService, vetService, chatService

### Architecture Patterns
- Service layer: Facade pattern via `dbService` in `services/firebase.ts`
- Validation: Zod schemas in `types.ts` + `validationService.ts` wrapper
- Sanitization: DOMPurify in `sanitizationService.ts` (client-side only)
- Logging: Centralized via `loggerService.ts` with NDJSON for Cloud Logging
- Auth: Multi-provider Firebase Auth + Firestore rules + custom claims

### Performance Bottlenecks
1. **No caching**: Every query hits Firestore (expensive for stats, AI settings)
2. **Unbounded queries**: `getPets()`, `getUsers()` fetch ALL documents
3. **Serial validation**: Large lists validated one-by-one

### Rate Limiting
- **Current**: Cloud Functions AI endpoints only (10-20/day)
- **Missing**: Pet creation, sightings, chats, search (unlimited = DoS risk)
- **Location**: `/functions/src/rateLimit.ts`

### Caching Strategy Needed
- AI Settings: In-memory Map, 5min TTL
- System Stats: In-memory Map, 1min TTL
- Blog Posts: React Query, 5min TTL
- Search Results: LRU cache, 30sec TTL

### Code Locations
- Firestore rules: `/firestore.rules`
- Validation: `/services/validationService.ts`
- Sanitization: `/services/sanitizationService.ts`
- Rate limit: `/functions/src/rateLimit.ts`
- Core services: `/services/{auth,pet,vet,admin}Service.ts`
- Types/Schemas: `/types.ts`

### Next Implementation
1. Enhanced sanitization pipeline (integrate with all services)
2. Coordinate validation fix
3. Firestore rules patches
4. Rate limiting for frontend operations
5. Caching layer for hot paths
