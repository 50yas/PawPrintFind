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
        provider: 'openrouter',
        apiKeys: {
          google: '',
          openrouter: '',
        },
        modelMapping: {
          vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
          visionIdentification: 'nvidia/nemotron-nano-12b-v2-vl:free',
          triage: 'qwen/qwen-2.5-72b-instruct:free',
          chat: 'qwen/qwen-2.5-72b-instruct:free',
          matching: 'qwen/qwen-2.5-72b-instruct:free',
          smartSearch: 'qwen/qwen-2.5-72b-instruct:free',
          healthAssessment: 'qwen/qwen-2.5-72b-instruct:free',
          blogGeneration: 'qwen/qwen-2.5-coder-32b-instruct:free',
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
