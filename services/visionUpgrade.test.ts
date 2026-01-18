import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpsCallable } from 'firebase/functions';

// Mock configService
vi.mock('./configService', () => ({
  configService: {
    getGeminiKey: vi.fn().mockResolvedValue('test-api-key')
  }
}));

// Mock firebase/functions and capture the arguments
const mockCallGemini = vi.fn().mockImplementation((args: any) => {
    let text = "Golden Retriever";
    if (args.model === 'gemini-2.0-pro-vision') {
        if (JSON.stringify(args).includes('visualIdentityCode')) {
            text = '{"visualIdentityCode": "MARK-123", "physicalDescription": "Test desc"}';
        } else if (JSON.stringify(args).includes('breed') && JSON.stringify(args).includes('color')) {
            text = '{"breed": "Golden Retriever", "color": "Golden", "size": "Large"}';
        }
    }
    return Promise.resolve({
        data: { success: true, text }
    });
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

import { identifyBreedFromImage, autoFillPetDetails, generatePetIdentikit } from './geminiService';

describe('Vision Model Upgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifyBreedFromImage should use gemini-2.0-pro-vision', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await identifyBreedFromImage(mockFile);
    
    expect(mockCallGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.0-pro-vision'
      })
    );
  });

  it('autoFillPetDetails should use gemini-2.0-pro-vision', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await autoFillPetDetails(mockFile);
    
    expect(mockCallGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.0-pro-vision'
      })
    );
  });

  it('generatePetIdentikit should use gemini-2.0-pro-vision', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await generatePetIdentikit(mockFile);
    
    expect(mockCallGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.0-pro-vision'
      })
    );
  });
});
