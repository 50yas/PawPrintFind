/**
 * Image Optimization Utilities
 * Optimizes image URLs for better performance and LCP metrics
 */

interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  fit?: 'crop' | 'scale' | 'fill';
}

/**
 * Optimizes Unsplash URLs with better compression and modern formats
 */
export function optimizeUnsplashUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url.includes('unsplash.com')) return url;

  const {
    width = 800,
    quality = 75,
    format = 'auto',
    fit = 'crop'
  } = options;

  // Parse existing URL
  const urlObj = new URL(url);

  // Update or add optimization parameters
  urlObj.searchParams.set('auto', format);
  urlObj.searchParams.set('fit', fit);
  urlObj.searchParams.set('w', width.toString());
  urlObj.searchParams.set('q', quality.toString());

  // Add DPR-aware parameter for retina displays
  urlObj.searchParams.set('dpr', '1');

  // Enable format negotiation (WebP/AVIF if browser supports)
  urlObj.searchParams.set('fm', 'auto');

  return urlObj.toString();
}

/**
 * Generates responsive srcset for images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  if (!baseUrl.includes('unsplash.com')) return '';

  return widths
    .map(width => `${optimizeUnsplashUrl(baseUrl, { width })} ${width}w`)
    .join(', ');
}

/**
 * Generates sizes attribute based on common breakpoints
 */
export function generateSizes(maxWidth?: string): string {
  if (maxWidth) {
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${maxWidth}`;
  }
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px';
}

/**
 * Preload critical images with high priority
 */
export function preloadImage(src: string, options: { as?: string; fetchPriority?: 'high' | 'low' } = {}) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options.as || 'image';
  link.href = src;
  if (options.fetchPriority) {
    link.setAttribute('fetchpriority', options.fetchPriority);
  }
  document.head.appendChild(link);
}

/**
 * Check if image should use native lazy loading or intersection observer
 */
export function shouldUseNativeLazyLoading(): boolean {
  return 'loading' in HTMLImageElement.prototype;
}
