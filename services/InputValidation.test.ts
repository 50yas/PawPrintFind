
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationService } from './validationService';
import { PetProfileSchema, UserSchema, VetClinicSchema, ContactMessageSchema, DonationSchema } from '../types';

describe('Input Validation Protocols', () => {
    it('should reject invalid PetProfile', () => {
        const invalidPet = { name: '', breed: 'Dog' }; // Missing required fields
        expect(() => validationService.validate(PetProfileSchema, invalidPet, 'test')).toThrow();
    });

    it('should accept valid PetProfile', () => {
        const validPet: any = {
            id: '123',
            ownerEmail: 'test@test.com',
            guardianEmails: [],
            status: 'owned',
            vetLinkStatus: 'unlinked',
            isLost: false,
            name: 'Buddy',
            breed: 'Retriever',
            age: '2',
            weight: '20kg',
            behavior: 'Good',
            photos: [],
            homeLocations: [],
            lastSeenLocation: null,
            searchRadius: null,
            sightings: [],
            videoAnalysis: '',
            audioNotes: '',
            healthChecks: []
        };
        expect(() => validationService.validate(PetProfileSchema, validPet, 'test')).not.toThrow();
    });

    it('should reject invalid ContactMessage', () => {
        const invalidMsg = { name: 'A', email: 'not-an-email', subject: 'Hi', message: 'too short' };
        expect(() => validationService.validate(ContactMessageSchema, invalidMsg, 'test')).toThrow();
    });

    it('should accept valid ContactMessage', () => {
        const validMsg = { 
            name: 'John Doe', 
            email: 'john@example.com', 
            subject: 'Support Request', 
            message: 'I need help with my account, it is not working correctly.' 
        };
        expect(() => validationService.validate(ContactMessageSchema, validMsg, 'test')).not.toThrow();
    });

    it('should accept Donation with empty email and avatar', () => {
        const validDonation = {
            id: '1767893341114',
            donorName: 'Anonymous',
            realName: '',
            email: '',
            amount: '€25.00',
            numericValue: 25,
            message: '',
            timestamp: 1767893341114,
            avatarUrl: '',
            status: 'pending_payment',
            approved: false,
            isPublic: false
        };
        expect(() => validationService.validate(DonationSchema, validDonation, 'test')).not.toThrow();
    });
});
