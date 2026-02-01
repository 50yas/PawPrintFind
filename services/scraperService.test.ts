import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scraperService, ScraperJob, ScrapedSighting } from './scraperService';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

vi.mock('./firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn().mockReturnValue({ type: 'collection_ref' }),
    addDoc: vi.fn(),
    onSnapshot: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
}));

describe('scraperService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should queue a new scraper job', async () => {
        const query = 'Lost dog New York';
        // Mock addDoc response
        vi.mocked(addDoc).mockResolvedValue({ id: 'job123' } as any);

        await scraperService.queueJob(query);
        
        // addDoc called with collection ref (which is result of collection()) and data
        expect(addDoc).toHaveBeenCalledWith({ type: 'collection_ref' }, expect.objectContaining({
            query,
            status: 'queued',
            type: 'social_discovery'
        }));
    });

    it('should subscribe to scraper jobs', () => {
        const callback = vi.fn();
        scraperService.subscribeToJobs(callback);
        expect(onSnapshot).toHaveBeenCalled();
    });

    it('should import a sighting by updating its status', async () => {
        const id = 'sighting1';
        await scraperService.importSighting(id);
        
        // doc called with collectionRef, id
        expect(doc).toHaveBeenCalledWith(expect.anything(), id);
        expect(updateDoc).toHaveBeenCalledWith(undefined, { status: 'imported' });
    });

    it('should dismiss a sighting', async () => {
        const id = 'sighting2';
        await scraperService.dismissSighting(id);
        
        expect(doc).toHaveBeenCalledWith(expect.anything(), id);
        expect(updateDoc).toHaveBeenCalledWith(undefined, { status: 'dismissed' });
    });
});
