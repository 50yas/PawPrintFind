import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openRouterService } from './openRouterService';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

vi.mock('./firebase', () => ({
  functions: {},
}));

describe('openRouterService', () => {
  const mockCallFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (httpsCallable as any).mockReturnValue(mockCallFunction);
  });

  it('analyzeImageForDescription should call cloud function with correct parameters', async () => {
    mockCallFunction.mockResolvedValue({ data: { success: true, text: 'A cute dog' } });
    
    // Create a dummy file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock FileReader class
    class MockFileReader {
      readAsDataURL = vi.fn();
      onloadend = vi.fn();
      result = 'data:image/jpeg;base64,BASE64_CONTENT';
      
      constructor() {
        this.readAsDataURL.mockImplementation(() => {
           // Simulate async behavior
           setTimeout(() => {
             if (this.onloadend) this.onloadend();
           }, 0);
        });
      }
    }
    
    vi.spyOn(window, 'FileReader').mockImplementation(MockFileReader as any);

    const result = await openRouterService.analyzeImageForDescription(file);

    expect(result).toBe('A cute dog');
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'callOpenRouter');
    expect(mockCallFunction).toHaveBeenCalledWith(expect.objectContaining({
      task: 'vision',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.arrayContaining([
            expect.objectContaining({ type: 'image_url' })
          ])
        })
      ])
    }));
  });

  it('generateChatSuggestions should parse JSON response', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { 
        success: true, 
        text: JSON.stringify({ suggestions: ['Hello', 'Hi'] }) 
      } 
    });

    const session: any = { messages: [], ownerEmail: 'owner@example.com' };
    const result = await openRouterService.generateChatSuggestions(session, 'owner@example.com');

    expect(result).toEqual(['Hello', 'Hi']);
    expect(mockCallFunction).toHaveBeenCalledWith(expect.objectContaining({
      task: 'chat'
    }));
  });

  it('fetchAvailableModels should call fetchOpenRouterModels cloud function', async () => {
    mockCallFunction.mockResolvedValue({ 
      data: { models: [{ id: 'gpt-4', name: 'GPT-4' }] } 
    });

    const result = await openRouterService.fetchAvailableModels();

    expect(result).toEqual([{ id: 'gpt-4', name: 'GPT-4' }]);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'fetchOpenRouterModels');
  });

  it('should handle errors gracefully', async () => {
    mockCallFunction.mockRejectedValue(new Error('API Error'));

    const result = await openRouterService.performAIHealthCheck({} as any, 'cough');

    expect(result).toBe('Health analysis failed.');
  });
});