/**
 * Sanitization Service
 * Provides input sanitization utilities to prevent XSS and ensure data integrity
 */

import DOMPurify from 'dompurify';

// HTML entity encoding for text content
const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

/**
 * Escapes HTML entities in a string to prevent XSS
 */
const escapeHtml = (str: string): string => {
    return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
};

/**
 * Removes all HTML tags from a string
 */
const stripTags = (str: string): string => {
    return str.replace(/<[^>]*>/g, '');
};

/**
 * Sanitizes a pet name - allows letters, numbers, spaces, hyphens, apostrophes
 */
const sanitizePetName = (name: string): string => {
    return name
        .trim()
        .slice(0, 50)
        .replace(/[^\p{L}\p{N}\s\-']/gu, '')
        .replace(/\s+/g, ' ');
};

/**
 * Sanitizes an email address
 */
const sanitizeEmail = (email: string): string => {
    return email
        .trim()
        .toLowerCase()
        .slice(0, 254)
        .replace(/[^\w.@+-]/g, '');
};

/**
 * Sanitizes a phone number - keeps only digits, +, -, spaces, parentheses
 */
const sanitizePhone = (phone: string): string => {
    return phone
        .trim()
        .slice(0, 20)
        .replace(/[^\d+\-\s()]/g, '');
};

/**
 * Sanitizes general text content - removes dangerous characters but preserves readability
 */
const sanitizeText = (text: string, maxLength: number = 5000): string => {
    return stripTags(text)
        .trim()
        .slice(0, maxLength)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
};

/**
 * Sanitizes a URL
 */
const sanitizeUrl = (url: string): string => {
    const trimmed = url.trim().slice(0, 2048);

    // Only allow http, https, and data URLs for images
    if (!/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
        return '';
    }

    // Block javascript: URLs
    if (/^javascript:/i.test(trimmed)) {
        return '';
    }

    return trimmed;
};

/**
 * Sanitizes search query input
 */
const sanitizeSearchQuery = (query: string): string => {
    return query
        .trim()
        .slice(0, 200)
        .replace(/[<>{}[\]\\]/g, '');
};

/**
 * Sanitizes a breed name
 */
const sanitizeBreed = (breed: string): string => {
    return breed
        .trim()
        .slice(0, 100)
        .replace(/[^\p{L}\p{N}\s\-/'()]/gu, '')
        .replace(/\s+/g, ' ');
};

/**
 * Sanitizes location coordinates
 */
const sanitizeCoordinates = (value: number): number => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return 0;
    // Clamp to valid lat/lng range
    return Math.max(-180, Math.min(180, num));
};

/**
 * Sanitizes an address string
 */
const sanitizeAddress = (address: string): string => {
    return address
        .trim()
        .slice(0, 500)
        .replace(/[<>{}[\]\\]/g, '')
        .replace(/\s+/g, ' ');
};

/**
 * Sanitizes HTML content using DOMPurify - prevents XSS attacks
 * Use when rendering user-generated HTML with dangerouslySetInnerHTML
 */
const sanitizeHtml = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
    });
};

export const sanitizationService = {
    escapeHtml,
    stripTags,
    sanitizePetName,
    sanitizeEmail,
    sanitizePhone,
    sanitizeText,
    sanitizeUrl,
    sanitizeSearchQuery,
    sanitizeBreed,
    sanitizeCoordinates,
    sanitizeAddress,
    sanitizeHtml
};

// Convenience exports
export const sanitize = sanitizationService;
