import { db, auth } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const favoritesService = {
    async addFavorite(userId: string, petId: string): Promise<void> {
        if (!auth.currentUser) throw new Error("User must be logged in");
        await setDoc(doc(db, 'favorites', `${userId}_${petId}`), {
            userId,
            petId,
            timestamp: Date.now()
        });
    },

    async removeFavorite(userId: string, petId: string): Promise<void> {
        if (!auth.currentUser) throw new Error("User must be logged in");
        await deleteDoc(doc(db, 'favorites', `${userId}_${petId}`));
    },

    async checkIsFavorite(userId: string, petId: string): Promise<boolean> {
        if (!userId) return false;
        const snap = await getDoc(doc(db, 'favorites', `${userId}_${petId}`));
        return snap.exists();
    },

    async getUserFavorites(userId: string): Promise<string[]> {
        if (!userId) return [];
        const q = query(collection(db, 'favorites'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data().petId as string);
    }
};
