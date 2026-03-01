
import {
    collection, getDocs, setDoc, doc, deleteDoc, writeBatch, arrayUnion, increment, addDoc, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { PetProfile, Geolocation, PetProfileSchema, Sighting } from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { sanitizationPipeline } from './sanitizationPipeline';

export const petService = {
    async getPets(): Promise<PetProfile[]> {
        try {
            const snap = await getDocs(collection(db, 'pets'));
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(PetProfileSchema, data, `getPets:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching pets:', error);
            throw error;
        }
    },

    async getFilteredPets(filters: Record<string, unknown>): Promise<PetProfile[]> {
        try {
            const allPets = await this.getPets();
            return allPets.filter(pet => {
                if (filters.status && pet.status !== filters.status) return false;
                if (filters.breed && !pet.breed.toLowerCase().includes((filters.breed as string).toLowerCase())) return false;
                if (filters.isLost !== undefined && pet.isLost !== filters.isLost) return false;
                return true;
            });
        } catch (error) {
            logger.error('Error fetching filtered pets:', error);
            throw error;
        }
    },

    async savePet(pet: PetProfile): Promise<void> {
        if (!auth.currentUser) {
            logger.error('Attempted to save pet without authentication.');
            throw new Error('Authentication required to save a pet.');
        }
        try {
            // SECURITY: Sanitize → Validate → Store pipeline
            // Step 1: Sanitize to prevent XSS and injection attacks
            const sanitized = sanitizationPipeline.petProfile(pet);

            // Step 2: Validate schema compliance
            validationService.validate(PetProfileSchema, sanitized, 'savePet');

            // Helper to remove undefined fields which Firestore rejects
            const removeUndefined = (obj: unknown): unknown => {
                if (Array.isArray(obj)) {
                    return obj.map(removeUndefined);
                } else if (obj !== null && typeof obj === 'object') {
                    return Object.entries(obj as Record<string, unknown>).reduce((acc, [key, value]) => {
                        if (value !== undefined) {
                            acc[key] = removeUndefined(value);
                        }
                        return acc;
                    }, {} as Record<string, unknown>);
                }
                return obj;
            };

            // Step 3: Store to Firestore
            const cleanPet = removeUndefined(sanitized) as PetProfile;
            await setDoc(doc(db, 'pets', pet.id), cleanPet, { merge: true });
        } catch (error: unknown) {
            const err = error as Error;
            // Log the full error detail so the admin can debug it
            logger.error('Error saving pet:', err.message || err);
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
                // SECURITY: Sanitize location data
                const sanitizedLocation = sanitizationPipeline.geolocation(lastSeenLocation);
                const petRef = doc(db, 'pets', id);
                batch.update(petRef, { isLost, lastSeenLocation: sanitizedLocation });
            });
            await batch.commit();
        } catch (error) {
            logger.error('Error reporting multiple sightings:', error);
            throw error;
        }
    },

    async reportSighting(petId: string, sighting: Omit<Sighting, 'id'>, pet?: Pick<PetProfile, 'name' | 'ownerEmail' | 'photos'>): Promise<void> {
        if (!auth.currentUser) {
            throw new Error("Authentication required to report sighting.");
        }

        try {
            // SECURITY: Sanitize sighting data before storage
            const sightingId = Date.now().toString();
            const fullSighting = { ...sighting, id: sightingId };
            const sanitizedSighting = sanitizationPipeline.sighting(fullSighting);

            const batch = writeBatch(db);
            const petRef = doc(db, 'pets', petId);

            batch.update(petRef, {
                sightings: arrayUnion(sanitizedSighting),
                lastSeenLocation: sanitizedSighting.location
            });

            const userRef = doc(db, 'users', auth.currentUser.uid);
            batch.update(userRef, {
                'stats.sightingsReported': increment(1)
            });

            await batch.commit();

            // Write sighting_event so Cloud Function can notify the pet owner
            if (pet?.ownerEmail && auth.currentUser.email !== pet.ownerEmail) {
                await addDoc(collection(db, 'sighting_events'), {
                    petId,
                    petName: pet.name,
                    petPhotoUrl: pet.photos?.[0]?.url ?? null,
                    ownerEmail: pet.ownerEmail,
                    finderUid: auth.currentUser.uid,
                    finderEmail: auth.currentUser.email ?? '',
                    location: sanitizedSighting.location,
                    notes: sanitizedSighting.notes,
                    timestamp: sighting.timestamp,
                    createdAt: serverTimestamp(),
                });
            }
        } catch (error) {
            logger.error('Error reporting sighting:', error);
            throw error;
        }
    }
};
