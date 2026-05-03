import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from './geminiService';

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn((_fns, name) => vi.fn().mockImplementation((args: any) => {
    let responseText = '{}';
    let groundingMetadata = undefined;
    
    // In unified architecture, everything calls 'callGemini'
    if (name === 'callGemini') {
        if (args.task === 'visionIdentification' && args.config?.task === 'identikit') {
            responseText = '{"visualIdentityCode": "TEST-123", "physicalDescription": "A test pet"}';
        } else if (args.task === 'smartSearch') {
            responseText = '{"species": "dog", "breed": null}';
        } else if (args.task === 'chat' && JSON.stringify(args).toLowerCase().includes('vet')) {
            groundingMetadata = { groundingChunks: [{ maps: { title: 'Test Vet', address: '123 Test St' } }] };
        } else if (args.task === 'triage') {
             responseText = JSON.stringify([{"title": "Joint Health", "content": "Buddy needs joint supplements.", "type": "health"}]);
        }
    }

    return Promise.resolve({
      data: {
        success: true,
        text: responseText,
        groundingMetadata
      }
    });
  }))
}));

vi.mock('./firebase', () => ({
  functions: {},
  auth: { currentUser: { uid: 'test-user' } },
  db: {}
}));

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculateProfileCompleteness works correctly', () => {
    const mockPet: any = {
      name: 'Buddy',
      breed: 'Labrador',
      photos: [{ url: 'img1' }],
      medicalRecord: { vaccinations: ['Rabies'] }
    };

    const score = geminiService.calculateProfileCompleteness(mockPet);
    expect(score).toBe(40);
  });

  it('generatePetIdentikit parses JSON correctly', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await geminiService.generatePetIdentikit(mockFile);
    
    expect(result.code).toBe('TEST-123');
    expect(result.description).toBe('A test pet');
  });

  it('findNearbyVets returns grounded places', async () => {
    const result = await geminiService.findNearbyVets({ latitude: 10, longitude: 10 });
    expect(result.places).toHaveLength(1);
    expect(result.places[0].maps.title).toBe('Test Vet');
  });

  it('parseSearchQuery parses natural language into filters', async () => {
    const result = await geminiService.parseSearchQuery('Show me friendly dogs');
    expect(result).toHaveProperty('species');
  });

  it('generateHealthInsights returns an array of insights', async () => {
    const mockPet: any = { name: 'Buddy', breed: 'Retriever', age: '5' };
    const result = await geminiService.generateHealthInsights(mockPet);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Joint Health');
  });
});
