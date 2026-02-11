/**
 * Sanitization Pipeline Service
 *
 * SECURITY CRITICAL: Provides high-level sanitization pipelines for complex objects.
 * All user-generated data MUST pass through these pipelines before Firestore writes.
 *
 * Architecture: Sanitize → Validate → Store
 * - Sanitization removes dangerous content (XSS, injection)
 * - Validation ensures data conforms to schema
 * - Storage persists to Firestore
 */

import { sanitizationService } from './sanitizationService';
import {
    PetProfile, VetClinic, ChatMessage, ChatSession,
    Sighting, PhotoWithMarks, Geolocation
} from '../types';

/**
 * Sanitizes a PetProfile object before storage
 * Prevents XSS in pet names, descriptions, behaviors, and location addresses
 */
export function sanitizePetProfile(pet: PetProfile): PetProfile {
    return {
        ...pet,
        name: sanitizationService.sanitizePetName(pet.name),
        breed: sanitizationService.sanitizeBreed(pet.breed),
        color: pet.color ? sanitizationService.sanitizeText(pet.color, 100) : pet.color,
        gender: pet.gender ? sanitizationService.sanitizeText(pet.gender, 20) : pet.gender,
        age: sanitizationService.sanitizeText(pet.age, 50),
        weight: sanitizationService.sanitizeText(pet.weight, 50),
        behavior: sanitizationService.sanitizeText(pet.behavior, 1000),
        description: pet.description ? sanitizationService.sanitizeText(pet.description, 2000) : pet.description,
        type: pet.type ? sanitizationService.sanitizeText(pet.type, 50) : pet.type,

        // Sanitize owner/guardian emails
        ownerEmail: pet.ownerEmail ? sanitizationService.sanitizeEmail(pet.ownerEmail) : null,
        guardianEmails: pet.guardianEmails.map(email => sanitizationService.sanitizeEmail(email)),
        vetEmail: pet.vetEmail ? sanitizationService.sanitizeEmail(pet.vetEmail) : undefined,

        // Sanitize photos and marks
        photos: pet.photos.map(sanitizePhotoWithMarks),

        // Sanitize locations
        homeLocations: pet.homeLocations.map(sanitizeGeolocation),
        lastSeenLocation: pet.lastSeenLocation ? sanitizeGeolocation(pet.lastSeenLocation) : null,

        // Sanitize sightings
        sightings: pet.sightings.map(sanitizeSighting),

        // Sanitize text analysis fields
        videoAnalysis: sanitizationService.sanitizeText(pet.videoAnalysis, 5000),
        audioNotes: sanitizationService.sanitizeText(pet.audioNotes, 5000),

        // Sanitize AI-generated content
        aiIdentityCode: pet.aiIdentityCode ? sanitizationService.sanitizeText(pet.aiIdentityCode, 500) : undefined,
        aiPhysicalDescription: pet.aiPhysicalDescription ? sanitizationService.sanitizeText(pet.aiPhysicalDescription, 2000) : undefined
    };
}

/**
 * Sanitizes a VetClinic object before storage
 * Prevents XSS in clinic names, addresses, phone numbers
 */
export function sanitizeVetClinic(clinic: VetClinic): VetClinic {
    return {
        ...clinic,
        name: sanitizationService.sanitizeText(clinic.name, 200),
        address: sanitizationService.sanitizeAddress(clinic.address),
        phone: sanitizationService.sanitizePhone(clinic.phone),
        vetEmail: sanitizationService.sanitizeEmail(clinic.vetEmail),
        location: clinic.location ? sanitizeGeolocation(clinic.location) : undefined
    };
}

/**
 * Sanitizes a ChatMessage before storage
 * CRITICAL: Chat messages are high-risk XSS vectors
 */
export function sanitizeChatMessage(message: ChatMessage): ChatMessage {
    return {
        ...message,
        senderEmail: sanitizationService.sanitizeEmail(message.senderEmail),
        text: sanitizationService.sanitizeText(message.text, 1000),
        timestamp: Number(message.timestamp)
    };
}

/**
 * Sanitizes a complete ChatSession
 */
export function sanitizeChatSession(session: ChatSession): ChatSession {
    return {
        ...session,
        petName: sanitizationService.sanitizePetName(session.petName),
        petPhotoUrl: sanitizationService.sanitizeUrl(session.petPhotoUrl),
        ownerEmail: sanitizationService.sanitizeEmail(session.ownerEmail),
        finderEmail: sanitizationService.sanitizeEmail(session.finderEmail),
        messages: session.messages.map(sanitizeChatMessage)
    };
}

/**
 * Sanitizes a Sighting object
 */
export function sanitizeSighting(sighting: Sighting): Sighting {
    return {
        ...sighting,
        location: sanitizeGeolocation(sighting.location),
        notes: sanitizationService.sanitizeText(sighting.notes, 1000),
        photo: sighting.photo ? sanitizePhotoWithMarks(sighting.photo) : undefined,
        timestamp: Number(sighting.timestamp)
    };
}

/**
 * Sanitizes a PhotoWithMarks object
 */
export function sanitizePhotoWithMarks(photo: PhotoWithMarks): PhotoWithMarks {
    return {
        ...photo,
        url: sanitizationService.sanitizeUrl(photo.url),
        description: sanitizationService.sanitizeText(photo.description, 500),
        marks: photo.marks.map(mark => ({
            x: Number(mark.x),
            y: Number(mark.y),
            description: sanitizationService.sanitizeText(mark.description, 200)
        }))
    };
}

/**
 * Sanitizes a Geolocation object
 * SECURITY FIX: Uses correct lat/lng validation
 */
export function sanitizeGeolocation(geo: Geolocation): Geolocation {
    const sanitized = sanitizationService.sanitizeGeolocation(geo);
    return {
        latitude: sanitized.latitude,
        longitude: sanitized.longitude,
        lat: sanitized.latitude, // For backward compatibility
        lng: sanitized.longitude, // For backward compatibility
        address: sanitized.address
    };
}

/**
 * Sanitizes blog post content (admin-generated, but still needs sanitization)
 */
export function sanitizeBlogContent(content: string): string {
    // For blog posts, we allow more HTML tags but still sanitize
    return sanitizationService.sanitizeHtml(content);
}

/**
 * Generic sanitization for simple text fields
 * Use when you need quick sanitization for single fields
 */
export const quickSanitize = {
    name: (s: string) => sanitizationService.sanitizePetName(s),
    email: (s: string) => sanitizationService.sanitizeEmail(s),
    phone: (s: string) => sanitizationService.sanitizePhone(s),
    text: (s: string, max?: number) => sanitizationService.sanitizeText(s, max),
    url: (s: string) => sanitizationService.sanitizeUrl(s),
    breed: (s: string) => sanitizationService.sanitizeBreed(s),
    address: (s: string) => sanitizationService.sanitizeAddress(s)
};

/**
 * Sanitization pipeline builder for custom objects
 * Usage:
 *   const sanitized = sanitizePipeline(userData)
 *     .field('name', sanitizationService.sanitizePetName)
 *     .field('email', sanitizationService.sanitizeEmail)
 *     .execute();
 */
export function sanitizePipeline<T extends Record<string, any>>(data: T) {
    let result = { ...data };

    return {
        field<K extends keyof T>(key: K, sanitizer: (value: any) => any) {
            if (result[key] !== undefined && result[key] !== null) {
                result[key] = sanitizer(result[key]);
            }
            return this;
        },
        execute(): T {
            return result;
        }
    };
}

export const sanitizationPipeline = {
    petProfile: sanitizePetProfile,
    vetClinic: sanitizeVetClinic,
    chatMessage: sanitizeChatMessage,
    chatSession: sanitizeChatSession,
    sighting: sanitizeSighting,
    photo: sanitizePhotoWithMarks,
    geolocation: sanitizeGeolocation,
    blogContent: sanitizeBlogContent,
    quick: quickSanitize,
    custom: sanitizePipeline
};
