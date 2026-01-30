
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, setDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { PetProfile } from '../types';

export interface ScrapedSighting {
    id: string;
    source: string; // e.g., 'Facebook', 'PawBoost', 'Nextdoor'
    sourceUrl: string;
    description: string;
    location: string;
    timestamp: number;
    imageUrl?: string;
    species?: string;
    status: 'pending' | 'imported' | 'ignored';
}

export const scraperService = {
    async getScrapedSightings(): Promise<ScrapedSighting[]> {
        const q = query(collection(db, 'scraped_sightings'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScrapedSighting));
    },

    async addScrapedSighting(sighting: Omit<ScrapedSighting, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'scraped_sightings'), sighting);
        return docRef.id;
    },

    async updateStatus(id: string, status: 'imported' | 'ignored'): Promise<void> {
        await setDoc(doc(db, 'scraped_sightings', id), { status }, { merge: true });
    },

    async deleteSighting(id: string): Promise<void> {
        await deleteDoc(doc(db, 'scraped_sightings', id));
    },

    /**
     * Trigger a "Scrape Job". In this implementation, we just log the intent.
     * An external agent (like me) or a Cloud Function with Playwright would pick this up.
     */
    async launchDiscovery(query: string): Promise<void> {
        await addDoc(collection(db, 'scraper_jobs'), {
            query,
            requestedBy: auth.currentUser?.email,
            status: 'queued',
            timestamp: Date.now()
        });
    }
};
