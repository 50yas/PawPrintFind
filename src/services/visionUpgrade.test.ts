import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpsCallable } from 'firebase/functions';

// Mock configService
vi.mock('./configService', () => ({
  configService: {
    getGeminiKey: vi.fn().mockResolvedValue('test-api-key')
  }
}));

// Mock firebase/functions and capture the arguments
const mockCallFn = vi.fn().mockImplementation((args: any) => {
    let text = "Golden Retriever";
    return Promise.resolve({
        data: { success: true, text: JSON.stringify({ breed: "Golden Retriever", color: "Golden", size: "Large", visualIdentityCode: "MARK-123", physicalDescription: "Test desc" }) }
    });
});

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn((_fns, name) => (args: any) => {
      let text = "Golden Retriever";
      if (name === 'callGemini') {
          if (args.config?.task === 'autofill') {
              text = '{"breed": "Golden Retriever", "color": "Golden", "size": "Large"}';
          } else if (args.config?.task === 'identikit') {
              text = '{"visualIdentityCode": "MARK-123", "physicalDescription": "Test desc"}';
          }
      }
      return Promise.resolve({
          data: { success: true, text }
      });
  })
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

  it('identifyBreedFromImage should use callGemini', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await identifyBreedFromImage(mockFile);
    
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callGemini');
  });

  it('autoFillPetDetails should use callGemini', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await autoFillPetDetails(mockFile);
    
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callGemini');
  });

  it('generatePetIdentikit should use callGemini', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await generatePetIdentikit(mockFile);
    
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callGemini');
  });
});
