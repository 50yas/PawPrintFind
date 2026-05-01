/// <reference types="vitest/globals" />
import { petService } from './petService';
import { auth } from './firebase';
import type { Mock } from 'vitest';
import { deleteDoc, getDocs, setDoc, writeBatch, doc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logger } from './loggerService';

vi.mock('./loggerService');
vi.mock('./firebase', () => ({
  auth: { currentUser: null },
  db: { _isFirestore: true },
  storage: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    const batch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
    };
    return {
        ...actual,
        collection: vi.fn(),
        doc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        deleteDoc: vi.fn(),
        writeBatch: vi.fn(() => batch),
    };
});

// Mock Storage functions
vi.mock('firebase/storage', async () => {
    const actual = await vi.importActual('firebase/storage');
    return {
        ...actual,
        ref: vi.fn(),
        uploadBytes: vi.fn(),
        getDownloadURL: vi.fn(),
    };
});


describe('petService', () => {
  const validPet = {
    id: '1',
    ownerEmail: 'owner@test.com',
    guardianEmails: [],
    status: 'owned',
    vetLinkStatus: 'unlinked',
    isLost: false,
    name: 'Fido',
    breed: 'Labrador',
    age: '2 years',
    weight: '25kg',
    behavior: 'Friendly',
    photos: [],
    homeLocations: [],
    lastSeenLocation: null,
    searchRadius: null,
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth.currentUser as any) = null; // Unauthenticated by default
  });

  describe('getPets', () => {
    it('should return a list of pets', async () => {
      const mockPets = [{ ...validPet }, { ...validPet, id: '2', name: 'Buddy' }];
      (getDocs as Mock).mockResolvedValue({
        docs: mockPets.map(p => ({ id: p.id, data: () => ({ ...p }) }))
      });
      const pets = await petService.getPets();
      expect(getDocs).toHaveBeenCalled();
      expect(pets).toHaveLength(2);
      expect(pets[0].name).toBe('Fido');
    });

    it('should log an error if fetching fails', async () => {
        const mockError = { message: 'Firestore error' };
        (getDocs as Mock).mockRejectedValue(mockError);
        await expect(petService.getPets()).rejects.toThrow('Firestore error');
        expect(logger.error).toHaveBeenCalledWith('Error fetching pets:', mockError);
    });
  });

  describe('savePet', () => {
    it('should throw an error if user is not authenticated', async () => {
        await expect(petService.savePet(validPet as any)).rejects.toThrow('Authentication required to save a pet.');
        expect(setDoc).not.toHaveBeenCalled();
    });
    
    it('should save a pet profile', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        await petService.savePet(validPet as any);
        expect(setDoc).toHaveBeenCalled();
    });

    it('should log an error if saving fails', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        const mockError = { message: 'Firestore error' };
        (setDoc as Mock).mockRejectedValue(mockError);
        await expect(petService.savePet(validPet as any)).rejects.toThrow('Firestore error');
        expect(logger.error).toHaveBeenCalledWith('Error saving pet:', 'Firestore error');
    });
  });

  describe('deletePet', () => {
    it('should throw an error if the user is not authenticated', async () => {
      await expect(petService.deletePet('pet-id-123')).rejects.toThrow('Authentication required to delete a pet.');
      expect(deleteDoc).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Attempted to delete pet without authentication.');
    });

    it('should delete a pet if the user is authenticated', async () => {
      (auth.currentUser as any) = { uid: 'test-user' };
      await petService.deletePet('pet-id-123');
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should log an error if deleting fails', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        const mockError = { message: 'Firestore error' };
        (deleteDoc as Mock).mockRejectedValue(mockError);
        await expect(petService.deletePet('pet-id-123')).rejects.toThrow('Firestore error');
        expect(logger.error).toHaveBeenCalledWith('Error deleting pet:', mockError);
    });
  });

  describe('uploadPetPhoto', () => {
    it('should throw an error if user is not authenticated', async () => {
        const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
        await expect(petService.uploadPetPhoto('pet-1', file)).rejects.toThrow('Authentication required to upload a photo.');
        expect(uploadBytes).not.toHaveBeenCalled();
    });

    it('should upload a photo and return the URL', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
        (uploadBytes as Mock).mockResolvedValue({ ref: 'mock-ref' } as any);
        (getDownloadURL as Mock).mockResolvedValue('http://mock-url.com');

        const url = await petService.uploadPetPhoto('pet-1', file);
        expect(uploadBytes).toHaveBeenCalled();
        expect(getDownloadURL).toHaveBeenCalled();
        expect(url).toBe('http://mock-url.com');
    });

    it('should log an error if uploading fails', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
        const mockError = new Error('Storage error');
        (uploadBytes as Mock).mockRejectedValue(mockError);
        await expect(petService.uploadPetPhoto('pet-1', file)).rejects.toThrow('Storage error');
        expect(logger.error).toHaveBeenCalledWith('Error uploading pet photo:', mockError);
    });
  });

  describe('reportMultipleSightings', () => {
    it('should throw an error if user is not authenticated', async () => {
        const updates = [{ id: 'pet-1', isLost: true, lastSeenLocation: { latitude: 0, longitude: 0 } }];
        await expect(petService.reportMultipleSightings(updates)).rejects.toThrow('Authentication required to report sightings.');
        const batch = (writeBatch as Mock)();
        expect(batch.commit).not.toHaveBeenCalled();
    });

    it('should update multiple pet sightings in a batch', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        const updates = [
            { id: 'pet-1', isLost: true, lastSeenLocation: { latitude: 0, longitude: 0 } },
            { id: 'pet-2', isLost: false, lastSeenLocation: { latitude: 1, longitude: 1 } },
        ];
        const batch = { update: vi.fn(), commit: vi.fn() };
        (writeBatch as Mock).mockReturnValue(batch as any);

        await petService.reportMultipleSightings(updates);
        expect(writeBatch).toHaveBeenCalled();
        expect(batch.update).toHaveBeenCalledTimes(2);
        expect(batch.commit).toHaveBeenCalled();
    });

    it('should log an error if batch write fails', async () => {
        (auth.currentUser as any) = { uid: 'test-user' };
        const updates = [{ id: 'pet-1', isLost: true, lastSeenLocation: { latitude: 0, longitude: 0 } }];
        const mockError = { message: 'Firestore error' };
        const batch = { update: vi.fn(), commit: vi.fn().mockRejectedValue(mockError) };
        (writeBatch as Mock).mockReturnValue(batch as any);

        await expect(petService.reportMultipleSightings(updates)).rejects.toThrow('Firestore error');
        expect(logger.error).toHaveBeenCalledWith('Error reporting multiple sightings:', mockError);
    });
  });

  describe('reportSighting', () => {
    it('should throw if unauthenticated', async () => {
        await expect(petService.reportSighting('pet-1', {} as any)).rejects.toThrow('Authentication required to report sighting.');
    });

    it('should add sighting to pet and increment user stats', async () => {
        (auth.currentUser as any) = { uid: 'user-1' };
        const sighting = {
            location: { latitude: 10, longitude: 10 },
            timestamp: 1234567890,
            notes: 'Seen here'
        };
        const batch = { update: vi.fn(), commit: vi.fn() };
        (writeBatch as Mock).mockReturnValue(batch as any);

        await petService.reportSighting('pet-1', sighting as any);

        expect(writeBatch).toHaveBeenCalled();
        expect(batch.update).toHaveBeenCalledTimes(2); // One for pet, one for user
        expect(batch.commit).toHaveBeenCalled();
    });
  });
});
