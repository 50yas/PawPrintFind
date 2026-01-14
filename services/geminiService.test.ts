import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from './geminiService';

vi.mock('@google/genai', () => {
  const generateContent = vi.fn().mockImplementation((args: any) => {
    const parts = args.contents?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    const prompt = textPart ? textPart.text : '';
    let responseText = '{}';
    
    if (prompt.includes('Biometric Identity')) {
      responseText = '{"visualIdentityCode": "TEST-123", "physicalDescription": "A test pet"}';
    } else if (prompt.includes('Parse this natural language search query')) {
      responseText = '{"species": "dog", "breed": null, "color": null, "size": "Small", "age": null, "gender": null, "tags": ["friendly"]}';
    } else if (prompt.includes('Translate the original content')) {
      responseText = '{"es": "Hola Mundo", "fr": "Bonjour Monde"}';
    }

    return Promise.resolve({
      text: responseText,
      candidates: [{
        content: { parts: [{ text: 'Mock Response' }] },
        groundingMetadata: { groundingChunks: [{ maps: { title: 'Test Vet', address: '123 Test St' } }] }
      }]
    });
  });

  class MockGoogleGenAI {
    models = {
      generateContent
    };
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: { OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER', ARRAY: 'ARRAY' },
    Modality: { AUDIO: 'AUDIO' }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
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

  });

  