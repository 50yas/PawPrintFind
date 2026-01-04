
import {
    collection, getDocs, setDoc, doc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { PetProfile, Geolocation } from '../types';
import { logger } from './loggerService';

export const petService = {
    async getPets(): Promise<PetProfile[]> {
        try {
            const snap = await getDocs(collection(db, 'pets'));
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as PetProfile));
        } catch (error) {
            logger.error('Error fetching pets:', error);
            throw error;
        }
    },

    async savePet(pet: PetProfile): Promise<void> {
        if (!auth.currentUser) {
            logger.error('Attempted to save pet without authentication.');
            throw new Error('Authentication required to save a pet.');
        }
        try {
            // Helper to remove undefined fields which Firestore rejects
            const removeUndefined = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(removeUndefined);
                } else if (obj !== null && typeof obj === 'object') {
                    return Object.entries(obj).reduce((acc, [key, value]) => {
                        if (value !== undefined) {
                            acc[key] = removeUndefined(value);
                        }
                        return acc;
                    }, {} as any);
                }
                return obj;
            };

            const sanitizedPet = removeUndefined(pet);
            await setDoc(doc(db, 'pets', pet.id), sanitizedPet, { merge: true });
        } catch (error) {
            logger.error('Error saving pet:', error);
            throw error;
        }
    },

    async deletePet(id: string): Promise<void> {
        if (!auth.currentUser) {
            logger.error('Attempted to delete pet without authentication.');
            throw new Error('Authentication required to delete a pet.');
        }
        try {
            await deleteDoc(doc(db, 'pets', id));
        } catch (error) {
            logger.error('Error deleting pet:', error);
            throw error;
        }
    },

    async uploadPetPhoto(petId: string, file: File): Promise<string> {
        if (!auth.currentUser) {
            logger.error('Attempted to upload photo without authentication.');
            throw new Error('Authentication required to upload a photo.');
        }
        try {
            const storageRef = ref(storage, `pets/${petId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            return getDownloadURL(snapshot.ref);
        } catch (error) {
            logger.error('Error uploading pet photo:', error);
            throw error;
        }
    },

    async reportMultipleSightings(updates: { id: string, isLost: boolean, lastSeenLocation: Geolocation }[]): Promise<void> {
        if (!auth.currentUser) {
            logger.error('Attempted to report sightings without authentication.');
            throw new Error('Authentication required to report sightings.');
        }
        try {
            const batch = writeBatch(db);
            updates.forEach(({ id, isLost, lastSeenLocation }) => {
                const petRef = doc(db, 'pets', id);
                batch.update(petRef, { isLost, lastSeenLocation });
            });
            await batch.commit();
        } catch (error) {
            logger.error('Error reporting multiple sightings:', error);
            throw error;
        }
    }
};
