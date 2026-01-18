import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { identifyBreedFromImage } from './geminiService';
import * as localInference from './localInferenceService';

// Mock configService
vi.mock('./configService', () => ({
  configService: {
    getGeminiKey: vi.fn().mockResolvedValue('test-api-key')
  }
}));

// Mock firebase/functions
const mockCallGemini = vi.fn().mockResolvedValue({
  data: { success: true, text: "Gemini Result" }
});

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => mockCallGemini)
}));

vi.mock('./firebase', () => ({
  functions: {},
  auth: { currentUser: { uid: 'test-user' } },
  db: {}
}));

describe('Edge Inference Fallback', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
      writable: true
    });
  });

  it('should use local inference when offline', async () => {
    // Force offline
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
      writable: true
    });

    const mockFile = new File([''], 'golden-dog.jpg', { type: 'image/jpeg' });
    const result = await identifyBreedFromImage(mockFile);
    
    // Should NOT call Gemini
    expect(mockCallGemini).not.toHaveBeenCalled();
    
    // Should return the local result
    expect(result).toContain('(Offline Detection)');
  });

  it('should use Gemini when online', async () => {
    // Force online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true
    });

    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await identifyBreedFromImage(mockFile);
    
    // Should call Gemini
    expect(mockCallGemini).toHaveBeenCalled();
    expect(result).toBe("Gemini Result");
  });
});
