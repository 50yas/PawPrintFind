
import {
    collection, getDocs, setDoc, doc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { PetProfile, Geolocation } from '../types';

export const petService = {
    async getPets(): Promise<PetProfile[]> {
        const snap = await getDocs(collection(db, 'pets'));
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as PetProfile));
    },

    async savePet(pet: PetProfile): Promise<void> {
        await setDoc(doc(db, 'pets', pet.id), pet, { merge: true });
    },

    async deletePet(id: string): Promise<void> {
        await deleteDoc(doc(db, 'pets', id));
    },

    async uploadPetPhoto(petId: string, file: File): Promise<string> {
        const storageRef = ref(storage, `pets/${petId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
    },

    async reportMultipleSightings(updates: { id: string, isLost: boolean, lastSeenLocation: Geolocation }[]): Promise<void> {
        const batch = writeBatch(db);
        updates.forEach(({ id, isLost, lastSeenLocation }) => {
            const petRef = doc(db, 'pets', id);
            batch.update(petRef, { isLost, lastSeenLocation });
        });
        await batch.commit();
    }
};
