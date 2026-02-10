import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeAISettings } from './initAISettings';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('./firebase', () => ({
  db: {},
}));

describe('initializeAISettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (doc as any).mockReturnValue({ id: 'ai_settings', path: 'system_config/ai_settings' });
  });

  it('should create default AI settings if they do not exist', async () => {
    // Mock getDoc to return exists: false
    (getDoc as any).mockResolvedValue({ exists: () => false });

    await initializeAISettings();

    expect(doc).toHaveBeenCalledWith(db, 'system_config', 'ai_settings');
    expect(getDoc).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        provider: 'google',
        apiKeys: {
          google: '',
          openrouter: '',
        },
        modelMapping: {
          vision: 'gemini-2.0-flash-exp',
          triage: 'gemini-2.0-flash-exp',
          chat: 'gemini-2.0-flash-exp',
          matching: 'gemini-2.0-flash-exp',
        },
      })
    );
  });

  it('should NOT overwrite existing AI settings', async () => {
    // Mock getDoc to return exists: true
    (getDoc as any).mockResolvedValue({ exists: () => true });

    await initializeAISettings();

    expect(getDoc).toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });
});
