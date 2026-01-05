/**
 * Utility for blog-related calculations.
 */

/**
 * Calculates estimated reading time for a given text.
 * Average reading speed is ~200-250 words per minute.
 * We will use 225 wpm as a baseline.
 * 
 * @param text The content to analyze.
 * @returns Estimated reading time in minutes (minimum 1).
 */
export const calculateReadingTime = (text: string | undefined): number => {
    if (!text || typeof text !== 'string') return 0;
    
    const wordsPerMinute = 225;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    
    return time || 1;
};