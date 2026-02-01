import { db } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, where, orderBy, QuerySnapshot, deleteDoc, getDocs } from 'firebase/firestore';

export interface ScraperJob {
    id: string;
    query: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    resultsCount: number;
    error?: string;
    timestamp: number;
    type: 'social_discovery';
}

export interface ScrapedSighting {
    id: string;
    source: string;
    sourceUrl: string;
    description: string;
    location: string;
    imageUrl?: string;
    species: string;
    breed?: string;
    status: 'pending' | 'imported' | 'dismissed' | 'ignored';
    timestamp: number;
}

class ScraperService {
    private jobsCollection = collection(db, 'scraper_jobs');
    private sightingsCollection = collection(db, 'scraped_sightings');

    async queueJob(searchQuery: string): Promise<string> {
        const docRef = await addDoc(this.jobsCollection, {
            query: searchQuery,
            status: 'queued',
            type: 'social_discovery',
            resultsCount: 0,
            timestamp: Date.now()
        });
        return docRef.id;
    }

    async launchDiscovery(query: string): Promise<string> {
        return this.queueJob(query);
    }

    async getJobs(): Promise<ScraperJob[]> {
        const q = query(this.jobsCollection, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScraperJob));
    }

    async getScrapedSightings(): Promise<ScrapedSighting[]> {
        const q = query(this.sightingsCollection, where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScrapedSighting));
    }

    async updateStatus(id: string, status: ScrapedSighting['status']): Promise<void> {
        await updateDoc(doc(this.sightingsCollection, id), { status });
    }

    subscribeToJobs(callback: (jobs: ScraperJob[]) => void): () => void {
        const q = query(this.jobsCollection, orderBy('timestamp', 'desc'));
        return onSnapshot(q, (snapshot: QuerySnapshot) => {
            const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScraperJob));
            callback(jobs);
        });
    }

    subscribeToSightings(callback: (sightings: ScrapedSighting[]) => void): () => void {
        const q = query(this.sightingsCollection, where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (snapshot: QuerySnapshot) => {
            const sightings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScrapedSighting));
            callback(sightings);
        });
    }

    async importSighting(id: string): Promise<void> {
        await this.updateStatus(id, 'imported');
    }

    async dismissSighting(id: string): Promise<void> {
        await this.updateStatus(id, 'dismissed');
    }
    
    // For the agent script to update job status
    async updateJobStatus(id: string, status: ScraperJob['status'], count: number, error?: string): Promise<void> {
        await updateDoc(doc(this.jobsCollection, id), {
            status,
            resultsCount: count,
            error: error || null
        });
    }

    // For the agent script to add results
    async addScrapedSighting(sighting: Omit<ScrapedSighting, 'id'>): Promise<void> {
        await addDoc(this.sightingsCollection, sighting);
    }
}

export const scraperService = new ScraperService();