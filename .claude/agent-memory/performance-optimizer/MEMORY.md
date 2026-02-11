# Performance Optimizer Memory

## Project Performance Characteristics

### Critical Bundles
- Main bundle was 1.49MB before optimization → 202KB after (86% reduction)
- Three.js is largest vendor chunk (693KB) - only loads for 3D features
- Firebase SDK (599KB) is essential, already using modular imports
- i18next translations benefit from lazy loading (88% reduction when active only)

### Successful Optimization Patterns

**Manual Chunking Strategy:**
- Split by library domain (react, firebase, i18n, three, genai, framer, utils)
- Separate vendor chunk for misc dependencies
- Results in better parallel loading and caching

**Lazy Loading Boundaries:**
- Route-level components (routers already lazy-loaded)
- Heavy UI components (Navbar, Footer, Modals, AI features)
- Background/decorative components (BiometricBackground)
- Always wrap with Suspense + meaningful fallbacks

**i18next Optimization:**
- Only preload English (fallback)
- Lazy load other 7 languages on switch
- Use loadLanguage() function for dynamic imports
- Critical: Use HttpBackend for future optimization

**Service Worker Caching:**
- NetworkFirst for Firestore API (5s timeout)
- StaleWhileRevalidate for Firebase Storage images
- CacheFirst for static assets (images, fonts)
- Network timeouts prevent hanging on offline/slow connections

### Performance Monitoring Setup

**Web Vitals Hook:**
- Use 10% sampling in production to reduce Firebase costs
- FID deprecated → use INP instead
- Log to console (extend to Firebase Analytics later)
- Thresholds: LCP <2.5s, FCP <1.8s, INP <200ms, CLS <0.1, TTFB <800ms

### Build Configuration Notes

**Vite Terser:**
- drop_console: true (production only)
- drop_debugger: true
- Results in 5-10% additional size reduction

**TypeScript Issues Encountered:**
- Zod v4: z.record() requires 2 args (key, value)
- Zod v4: .optional().default() → just .default()
- react-window: API changed from FixedSizeList to List function
- react-window: Complex virtualization deferred (use CSS optimization instead)

### Virtual Scrolling Decision

**Current Approach:**
- CSS containment + will-change for transform optimization
- React.memo for individual pet cards
- useVirtualization() hook with 50-item threshold
- Defer true virtualization until lists exceed 100 items

**Why Not Full Virtualization Yet:**
- react-window API significantly changed
- Most pet lists <50 items in practice
- CSS optimizations provide 80% of benefit with 20% of complexity
- Grid layouts harder to virtualize than lists

### Component-Specific Notes

**Dashboard:**
- User typically has <20 pets (grid layout)
- Virtual scrolling not critical
- Focus on lazy loading individual PetCard components

**LostPetsCenter/AdoptionCenter:**
- Can have 100+ items
- Use rankedPets for filtered lists
- Virtual scrolling beneficial when threshold exceeded
- Map view already lazy-loaded (MissingPetsMap)

**AdminDashboard:**
- Largest component (100.94 KB / 21.98 KB gzipped)
- Heavy AI analytics features
- Already lazy-loaded via AdminRouter
- Consider splitting into sub-components if grows further

### Caching Strategy Patterns

**Firebase Storage Images:**
- Use StaleWhileRevalidate (serve stale while fetching new)
- 30-day expiration for pet photos
- 100 max entries
- cacheableResponse: statuses [0, 200]

**Firestore Queries:**
- NetworkFirst with 5s timeout (fallback to cache)
- 24-hour expiration for pet data
- 50 max entries per cache
- onSnapshot subscriptions can't be cached (real-time)

**Static Assets:**
- CacheFirst for images/fonts (rarely change)
- Include woff2 fonts in glob patterns
- 1-year expiration for fonts
- 30-day for images

### Known Performance Bottlenecks

1. **Three.js Background:**
   - 693KB vendor chunk
   - Only loads on home view
   - Consider making it optional or using CSS alternative

2. **AdminDashboard AI Features:**
   - 101KB component with analytics
   - Already lazy-loaded
   - Could split AIAnalyticsView, AIHealthCheckModal into separate chunks

3. **Real-time Firestore:**
   - onSnapshot subscriptions can't be cached
   - Optimize query scope (use where clauses)
   - Add indexes for complex queries
   - Unsubscribe when components unmount

4. **Image Optimization TODO:**
   - Not yet converted to WebP/AVIF
   - No responsive srcset
   - No lazy loading with IntersectionObserver
   - High priority for next optimization pass

### Testing & Validation

**Build Verification:**
```bash
npm run build
# Check dist/ output for chunk sizes
# Ensure no chunks >500KB warning
# Verify vendor splits in output
```

**Lighthouse Targets:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- PWA: 100

**Network Throttling:**
- Fast 3G: TTI <5s
- Slow 3G: Page loads <10s
- Offline: Cached content available

### Next Optimization Priorities

1. **Image Optimization** (highest impact)
   - WebP/AVIF conversion
   - Responsive images with srcset
   - Lazy loading with Intersection Observer
   - Compress to <100KB thumbnails, <500KB full-size

2. **Font Optimization**
   - Subset fonts to used glyphs only
   - font-display: swap
   - Preload critical fonts

3. **Critical CSS Inlining**
   - Inline above-the-fold styles
   - Defer non-critical CSS
   - Reduce render-blocking resources

4. **API Request Optimization**
   - Debounce search inputs (300ms)
   - Batch Firestore reads where possible
   - Add React Query or SWR for cache management
   - Firestore query pagination with cursors

### Project-Specific Conventions

**File Structure:**
- `/hooks/` for performance hooks (useWebVitals, useVirtualization)
- `/components/VirtualPetList.tsx` for virtualization
- `/PERFORMANCE.md` for comprehensive documentation
- Lazy-loaded components use `lazy(() => import().then(m => ({ default: m.Component })))`

**Suspense Fallback Patterns:**
- Navbar/Footer: Invisible div with fixed height
- Modals: LoadingSpinner with backdrop
- Background: Plain bg-background div
- Routers: LoadingSpinner centered

**Environment-Aware Config:**
- Web vitals: 100% sampling in dev, 10% in prod
- Console logs: Enabled in dev, dropped in prod (Terser)
- Sourcemaps: Enabled for debugging (consider disabling in prod)

### Common Mistakes to Avoid

1. Don't use z.record(z.unknown()) in Zod v4 → use z.record(z.string(), z.unknown())
2. Don't use .optional().default() → just .default()
3. Don't import react-window FixedSizeList → use List function
4. Don't forget Suspense boundaries for lazy components
5. Don't cache onSnapshot Firestore subscriptions (real-time won't work)
6. Don't forget to unsubscribe Firestore listeners on unmount
7. Don't bundle all translations → lazy load by language
8. Don't use virtual scrolling for lists <50 items (overhead not worth it)

### Success Metrics Achieved

- ✅ Main bundle: 1.49MB → 202KB (86% reduction)
- ✅ Vendor chunking: 8 strategic chunks vs 1 monolithic
- ✅ Translation bundle: 200KB → 25KB active (88% reduction)
- ✅ Build time: ~40s (acceptable for production builds)
- ✅ Web Vitals monitoring: Active with configurable sampling
- ✅ PWA caching: 6 strategies for different resource types
- ✅ Lazy loading: 15+ components deferred
- ✅ TypeScript: All errors resolved
- ✅ Functionality: No breaking changes

---
Last updated: 2026-02-11
