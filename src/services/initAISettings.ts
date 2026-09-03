import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AISettings, AISettingsSchema } from '../types';

export const initializeAISettings = async () => {
  try {
    const settingsRef = doc(db, 'system_config', 'ai_settings');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      const defaultSettings: AISettings = {
        provider: 'openrouter',
        apiKeys: {
          google: '',
          openrouter: ''
        },
        modelMapping: {
          vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
          visionIdentification: 'nvidia/nemotron-nano-12b-v2-vl:free',
          triage: 'qwen/qwen-2.5-72b-instruct:free',
          healthAssessment: 'qwen/qwen-2.5-72b-instruct:free',
          chat: 'qwen/qwen-2.5-72b-instruct:free',
          matching: 'qwen/qwen-2.5-72b-instruct:free',
          smartSearch: 'qwen/qwen-2.5-72b-instruct:free',
          blogGeneration: 'qwen/qwen-2.5-coder-32b-instruct:free'
        },
        fallbackToGemini: true,
        lastUpdated: Date.now(),
        updatedBy: 'system_init@pawprint.ai'
      };

      // Validate against schema just in case
      // This throws if invalid
      AISettingsSchema.parse(defaultSettings);

      await setDoc(settingsRef, defaultSettings);
      console.log('Initialized default AI settings.');
    } else {
      console.log('AI settings already exist.');
    }
  } catch (error) {
    console.error('Error initializing AI settings:', error);
    throw error;
  }
};
