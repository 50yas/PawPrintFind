import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be hoisted
vi.mock('./configService', () => ({
  configService: {
    getGeminiKey: vi.fn().mockResolvedValue('test-api-key')
  }
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn().mockImplementation((args: any) => {
    const prompt = JSON.stringify(args);
    let responseText = '{}';
    let groundingMetadata = undefined;
    
    if (prompt.includes('Visual Identity Code')) {
      responseText = '{"visualIdentityCode": "TEST-123", "physicalDescription": "A test pet"}';
    } else if (prompt.includes('Parse this natural language search query')) {
      responseText = '{"species": "dog", "breed": null, "color": null, "size": "Small", "age": null, "gender": null, "tags": ["friendly"]}';
    } else if (prompt.includes('Translate the original content')) {
      responseText = '{"es": "Hola Mundo", "fr": "Bonjour Monde"}';
    } else if (prompt.includes('Generate 3 proactive, personalized health or behavior insights')) {
      responseText = '[{"title": "Joint Health", "content": "Buddy needs joint supplements.", "type": "health"}]';
    } else if (prompt.includes('vets') || prompt.includes('clinic')) {
      groundingMetadata = { groundingChunks: [{ maps: { title: 'Test Vet', address: '123 Test St' } }] };
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

import * as geminiService from './geminiService';

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

    it('translateContent returns translations for multiple languages', async () => {

      const result = await (geminiService as any).translateContent('Hello World', ['es', 'fr']);

      expect(result).toBeDefined();

    });

  

    it('parseSearchQuery parses natural language into filters', async () => {

      // This will initially fail as parseSearchQuery is not yet defined

          const result = await (geminiService as any).parseSearchQuery('Show me friendly dogs good for apartments');

          expect(result).toBeDefined();

          // In our implementation, we'll expect certain fields

          expect(result).toHaveProperty('species');

        });

      

        it('generateHealthInsights returns an array of insights', async () => {

          const mockPet: any = { name: 'Buddy', breed: 'Retriever', age: '5' };

          const result = await geminiService.generateHealthInsights(mockPet);

          expect(result).toHaveLength(1);

          expect(result[0].title).toBe('Joint Health');

          expect(result[0]).toHaveProperty('id');

          expect(result[0]).toHaveProperty('timestamp');

        });

      });

      

  