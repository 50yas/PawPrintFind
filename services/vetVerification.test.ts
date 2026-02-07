
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbService } from './firebase';
import { validationService } from './validationService';
import { VetVerificationRequestSchema } from '../types';

// Mock dependencies
vi.mock('./firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'vet123', email: 'vet@example.com' } },
    dbService: {
        submitVetVerification: vi.fn().mockImplementation(async (req) => {
            validationService.validate(VetVerificationRequestSchema, { ...req, submittedAt: Date.now(), status: 'pending' }, 'test');
            return 'req_id_123';
        })
    }
}));

vi.mock('./loggerService', () => ({
    logger: {
        logInfo: vi.fn(),
        logError: vi.fn(),
        error: vi.fn()
    }
}));

describe('Vet Verification Service Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates and submits a valid verification request', async () => {
        const validRequest = {
            vetUid: 'vet123',
            vetEmail: 'vet@example.com',
            clinicName: 'Happy Paws',
            licenseNumber: 'VET999',
            specialization: ['General Practice'],
            documentUrls: ['https://example.com/doc1.pdf'],
            documentTypes: { 'https://example.com/doc1.pdf': 'Medical License' },
            status: 'pending' as const,
            submittedAt: Date.now()
        };

        const result = await dbService.submitVetVerification(validRequest);
        expect(result).toBe('req_id_123');
    });

    it('fails validation for missing license number', async () => {
        const invalidRequest = {
            vetUid: 'vet123',
            vetEmail: 'vet@example.com',
            clinicName: 'Happy Paws',
            specialization: ['General Practice'],
            documentUrls: ['https://example.com/doc1.pdf'],
            status: 'pending' as const,
            submittedAt: Date.now()
        } as any;

        await expect(dbService.submitVetVerification(invalidRequest)).rejects.toThrow();
    });
});
