import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AISettings, AISettingsSchema } from '../types';

export const initializeAISettings = async () => {
  try {
    const settingsRef = doc(db, 'system_config', 'ai_settings');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      const defaultSettings: AISettings = {
        provider: 'google',
        apiKeys: {
          google: '',
          openrouter: ''
        },
        modelMapping: {
          vision: 'gemini-2.0-flash',
          triage: 'gemini-2.0-flash',
          chat: 'gemini-2.0-flash',
          matching: 'gemini-2.0-flash'
        },
        lastUpdated: Date.now(),
        updatedBy: 'system_init@pawprint.ai'
      };

      // Validate against schema just in case
      AISettingsSchema.parse(defaultSettings);

      await setDoc(settingsRef, defaultSettings, { merge: true });
      console.log('Initialized default AI settings (Gemini 2.0 Flash).');
    } else {
      console.log('AI settings already exist.');
    }
  } catch (error) {
    console.error('Error initializing AI settings:', error);
    throw error;
  }
};
