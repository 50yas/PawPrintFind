import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from './geminiService';

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: '{"visualIdentityCode": "TEST-123", "physicalDescription": "A test pet"}',
        candidates: [{
          content: { parts: [{ text: 'Mock Response' }] },
          groundingMetadata: { groundingChunks: [{ maps: { title: 'Test Vet', address: '123 Test St' } }] }
        }]
      })
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
    // We will mock the response in the implementation phase, but here we expect the function to exist and return data
    // For now, this test will fail because translateContent is not defined
    const result = await (geminiService as any).translateContent('Hello World', ['es', 'fr']);
    // Mocked response would look like { es: 'Hola Mundo', fr: 'Bonjour Monde' }
    // Since we are mocking the whole class above, we might need to adjust the mock return value for this specific call in the implementation
    // But initially, it fails because function is undefined.
  });
});