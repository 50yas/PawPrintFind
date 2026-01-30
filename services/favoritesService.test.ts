import { describe, it, expect, vi, beforeEach } from 'vitest';
import { favoritesService } from './favoritesService';

// Mock dependencies
vi.mock('./firebase', () => ({
    db: {},
    auth: {
        currentUser: { uid: 'user123' }
    }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn((db, coll, id) => ({ id })),
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({ exists: () => true }),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ docs: [{ data: () => ({ petId: 'pet123' }) }] }),
}));

import { setDoc, deleteDoc, getDoc } from 'firebase/firestore';

describe('FavoritesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add a favorite', async () => {
        await favoritesService.addFavorite('user123', 'pet123');
        expect(setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'user123_pet123' }),
            expect.objectContaining({ userId: 'user123', petId: 'pet123' })
        );
    });

    it('should remove a favorite', async () => {
        await favoritesService.removeFavorite('user123', 'pet123');
        expect(deleteDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'user123_pet123' })
        );
    });

    it('should check if favorite exists', async () => {
        const isFav = await favoritesService.checkIsFavorite('user123', 'pet123');
        expect(isFav).toBe(true);
        expect(getDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'user123_pet123' }));
    });

    it('should get all user favorites', async () => {
        const favs = await favoritesService.getUserFavorites('user123');
        expect(favs).toEqual(['pet123']);
    });
});
