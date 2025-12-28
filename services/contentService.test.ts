/// <reference types="vitest/globals" />
import { contentService } from './contentService';
import { logger } from './loggerService';
import { auth } from './firebase';
import type { Mock } from 'vitest';
import { setDoc, addDoc } from 'firebase/firestore';

// Mock Logger
vi.mock('./loggerService');

// Mock Firebase Auth and Firestore imports
vi.mock('./firebase', () => ({
    auth: { currentUser: null },
    db: { _isFirestore: true }
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        collection: vi.fn(),
        doc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        onSnapshot: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        increment: vi.fn(),
    };
});

vi.mock('firebase/auth', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        signInAnonymously: vi.fn(),
    };
});

describe('contentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (auth.currentUser as any) = null;
    });

    describe('saveChatSession', () => {
        it('should throw error if not authenticated', async () => {
            await expect(contentService.saveChatSession({ id: 's1' } as any)).rejects.toThrow('Authentication required');
        });

        it('should log error and re-throw', async () => {
             (auth.currentUser as any) = { uid: 'u1' };
             (setDoc as Mock).mockRejectedValue(new Error('fail'));
             await expect(contentService.saveChatSession({ id: 's1' } as any)).rejects.toThrow('fail');
             expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('recordDonation', () => {
        it('should log error and re-throw on failure', async () => {
            const mockError = new Error('Donation save failed');
            (setDoc as Mock).mockRejectedValue(mockError);
            await expect(contentService.recordDonation({ id: 'd1' } as any)).rejects.toThrow(mockError);
            expect(logger.error).toHaveBeenCalledWith('Error recording donation:', mockError);
        });
    });
});