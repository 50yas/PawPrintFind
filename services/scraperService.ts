
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, setDoc, doc, deleteDoc, where, limit } from 'firebase/firestore';
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
    breed?: string;
    status: 'pending' | 'imported' | 'ignored';
}

export interface ScraperJob {
    id: string;
    query: string;
    requestedBy: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    timestamp: number;
    resultsCount?: number;
    error?: string;
}

export const scraperService = {
    async getScrapedSightings(): Promise<ScrapedSighting[]> {
        const q = query(collection(db, 'scraped_sightings'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScrapedSighting));
    },

    async getJobs(): Promise<ScraperJob[]> {
        const q = query(collection(db, 'scraper_jobs'), orderBy('timestamp', 'desc'), limit(10));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScraperJob));
    },

    async addScrapedSighting(sighting: Omit<ScrapedSighting, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'scraped_sightings'), sighting);
        return docRef.id;
    },

    async updateStatus(id: string, status: 'imported' | 'ignored'): Promise<void> {
        await setDoc(doc(db, 'scraped_sightings', id), { status }, { merge: true });
    },

    async updateJobStatus(id: string, status: ScraperJob['status'], resultsCount?: number, error?: string): Promise<void> {
        await setDoc(doc(db, 'scraper_jobs', id), { status, resultsCount, error }, { merge: true });
    },

    async deleteSighting(id: string): Promise<void> {
        await deleteDoc(doc(db, 'scraped_sightings', id));
    },

    /**
     * Trigger a "Scrape Job". 
     * In this architecture, this record acts as a signal for the Stagehand Agent
     * to begin execution in a Node.js runtime or Cloud Run instance.
     */
    async launchDiscovery(queryStr: string): Promise<void> {
        if (!auth.currentUser) throw new Error("Unauthorized");
        
        await addDoc(collection(db, 'scraper_jobs'), {
            query: queryStr,
            requestedBy: auth.currentUser.email,
            status: 'queued',
            timestamp: Date.now()
        });
    }
};
