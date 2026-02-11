# PawPrintFind UI/UX System Memory

## Theme System
- **ThemeContext Location**: `/contexts/ThemeContext.tsx`
- **Theme Options**: `light`, `dark`, `system`
- **CSS Variables**: Defined in `/index.css` using Material Design 3 color system
- **Primary Color**: `#00D2FF` (Gemini Teal) - HSL: `191 100% 50%`
- **Secondary Color**: `#FFB02E` (Safety Amber) - HSL: `37 100% 59%`
- **Seed Color**: `#008080` (Paw Print Teal) used in theme generator
- **Dark Mode Class**: `.dark` applied to `<html>` root element
- **localStorage Key**: `theme` stores user preference

## CSS Architecture
- **Framework**: Tailwind CSS with extensive custom utilities
- **Global Styles**: `/index.css` with `@layer base`, `@layer components`, `@layer utilities`
- **Border Radius Standard**: `--radius: 1.5rem` (24px)
- **Breakpoints**: Mobile-first (640px, 768px, 1024px, 1280px)

## Key Design Patterns

### Glassmorphism Classes
- `.glass-panel`: Basic glass effect with backdrop-blur-2xl
- `.glass-card-enhanced`: Interactive glass card with hover states
- `.glass-card-premium`: Premium variant with gradient overlay
- `.glass-btn`: Glass button with shimmer effect

### Animation Standards
- **Duration**: 300ms default for micro-interactions
- **Easing MD3**:
  - Emphasized decelerate: `cubic-bezier(0.05, 0.7, 0.1, 1)` (default for most transitions)
  - Emphasized accelerate: `cubic-bezier(0.3, 0, 0.8, 0.15)` (for exits)
  - Use via Tailwind: `ease-emphasized-decelerate`, `ease-emphasized-accelerate`
- **Keyframes**: shimmer, ripple, bounce-subtle, fade-in, slide-up, pulse-soft, glow-breathe, scan-laser
- **GPU Acceleration**: Use `will-change-[opacity,transform]` sparingly on animated elements
- **Reduced Motion**: Comprehensive `@media (prefers-reduced-motion)` support at line 759
- **60fps Standard**: All animations optimized for 60fps using transform/opacity only

### Typography
- **Primary Font**: System sans (font-sans with antialiasing)
- **Monospace**: Space Mono (`.font-mono-tech`)
- **Logo Treatment**: `.logo-print-text` with gradient and glow
- **Hero Gradient**: `.hero-gradient-text` with Brave browser fallback

### Touch Targets
- **Minimum Size**: 44x44px enforced via `@layer base` at line 135-144
- **Tap Highlight**: Disabled via `-webkit-tap-highlight-color: transparent`
- **Safe Areas**: `.pb-safe`, `.pt-safe-top`, `.px-safe` for notch support

## Component Conventions

### GlassButton (`/components/ui/GlassButton.tsx`)
- **Variants**: primary, secondary, danger, success, ghost
- **Sizes**: sm, md, lg with responsive padding
- **Features**: Ripple effect, loading state, haptic feedback, shimmer overlay
- **Accessibility**: focus-visible rings, disabled states, ARIA labels

### EmptyState (`/components/ui/EmptyState.tsx`)
- **Sizes**: sm, md, lg
- **Structure**: Icon → Title → Description → Action Button
- **Presets**: NoPets, NoResults, NoMessages, NoSightings, NoAppointments, Error, Offline
- **Decorative**: Gradient blobs in background, bounce-subtle animation on icon

### LoadingScreen (`/components/LoadingScreen.tsx`) - ENHANCED
- **Style**: Futuristic boot sequence with terminal text
- **Animations**:
  - Triple rotating rings with independent spin speeds (20s, 10s, 15s reverse)
  - Dynamic pulsing glow with intensity variation (1.0 to 1.15)
  - Progress bar with dual shimmer effect (background + foreground)
  - Typewriter cursor blink on boot text
- **Branding**: Large paw print logo with animated gradient "FIND" text (shimmer + pulse-soft)
- **Performance**: GPU-accelerated with inline will-change, 60fps smooth
- **Motion**: Respects prefers-reduced-motion with graceful fallbacks

### LiveAssistantFAB (`/components/LiveAssistantFAB.tsx`)
- **Position**: Fixed bottom-right on desktop (z-index 9999)
- **Animations**: float-mascot (4s), pulse-ring (3s), slide-up-mobile
- **Mobile**: Full-screen overlay with safe area padding
- **Draggable**: Desktop only via `useDraggable` hook
- **States**: Open/closed with forceOpen prop for mobile nav integration

## Color System (Material Design 3)

### Light Theme
- Primary: `#006a6a`
- Primary Container: `#6ff7f6`
- Secondary: `#4a6363`
- Background: `#fafdfc`
- Surface: `#fafdfc`

### Dark Theme
- Primary: `#4cdada`
- Primary Container: `#004f4f`
- Secondary: `#b0ccca`
- Background: `#020617` (Slate 950)
- Surface: `#020617`

### Custom Utilities
- `.neon-glow-teal`: Box shadow with primary color
- `.cyber-input`: Futuristic form input with glow on focus
- `.hud-*`: HUD-style components (status dots, table rows, grid background)
- `.provider-card-*`: AI provider selection cards

## Accessibility Standards
- **Focus Rings**: `.focus-ring` utility with 2px primary ring + offset
- **WCAG Compliance**: WCAG 2.1 AA target (4.5:1 contrast)
- **Keyboard Nav**: All interactive elements keyboard accessible
- **ARIA**: Comprehensive labels throughout (see GlassButton, EmptyState)
- **Screen Readers**: Semantic HTML with role attributes

## Responsive Patterns
- **Mobile-First**: All utilities start mobile, expand with md:, lg:
- **Touch Targets**: Auto-enforced 44px minimum on mobile
- **Safe Areas**: env(safe-area-inset-*) support for notch devices
- **Breakpoint Classes**: `.section-padding`, `.container-responsive`
- **Grid Layout**: `.card-grid` with auto-fill minmax(280px, 1fr)

## Performance Optimizations
- **Lazy Loading**: Home component uses lazy() for MissingPetsMap, DonorTicker, etc.
- **Memoization**: `memo()` on HeroHUD, HeroScanner
- **Suspense Boundaries**: With CardSkeleton, MapSidebarSkeleton fallbacks
- **CSS Containment**: Will-change on animated elements
- **Backdrop-filter**: Graceful degradation for unsupported browsers

## Special Effects
- **Scanlines**: `.bg-scanlines` overlay (disabled by default, z-9999)
- **Scan Laser**: `.animate-scan-laser` for HeroScanner
- **Neon Border**: `.neon-border` with animated gradient (3s loop)
- **Status Pulses**: `.status-pulse-*` (green, red, amber) with glow-breathe
- **Cyber Divider**: `.cyber-divider` with centered dot

## Recent Enhancements (2026-02-11)

### Loading Screen Polish
- Added dynamic pulsing glow intensity (1.0 to 1.15 scale) on logo
- Enhanced gradient animation with dual shimmer (background + foreground layers)
- Implemented typewriter blink cursor on boot sequence
- Optimized with GPU acceleration (will-change on transforms)
- Progress bar now shows actual progress (0-100%) with smooth fill

### PressKit Card Animations
- Enhanced hover states with layered glow effects
- Smooth lift animation (-translate-y-2) with MD3 emphasized-decelerate easing
- Logo/asset scale on hover (1.1x) with independent timing
- Active press state (scale-95) for tactile feedback
- Color transitions on text elements (white → primary)

### Scan-Hover Effect
- Improved scan-line gradient (0% → 40% → 50% → 60% → 100%)
- Increased opacity to 0.08 for better visibility
- Duration extended to 0.7s with MD3 easing
- Added will-change: top for GPU acceleration

### Tailwind Config Additions
- Added 11 new animation utilities (scan-laser, pulse-soft, glow-breathe, etc.)
- Material Design 3 timing functions (emphasized-decelerate, emphasized-accelerate)
- All keyframes now defined in Tailwind for consistency

### PageTransition Component
- Updated all transitions to use ease-emphasized-decelerate
- Added will-change hints for performance
- FadeSlideTransition now uses MD3 timing

## Known Issues to Address
1. No skeleton loaders for all async operations (see [loading-states.md])
2. Some components missing dark mode color adjustments
3. Mobile nav integration with LiveAssistantFAB needs polish
4. Translation keys hardcoded in some empty states

## Files to Reference
- Theme System: `/contexts/ThemeContext.tsx`, `/src/utils/theme.ts`
- Global Styles: `/index.css`
- UI Components: `/components/ui/` (GlassButton, EmptyState, SkeletonLoader, etc.)
- Types: `/types.ts` (UserRole, View, all interfaces)
