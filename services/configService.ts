import { remoteConfig } from './firebase';
import { fetchAndActivate, getString } from 'firebase/remote-config';

class ConfigService {
    private initialized = false;

    /**
     * Initializes the configuration service by fetching the latest values from Firebase Remote Config.
     * This is safe to call multiple times; it will only fetch once per session (or based on cache expiration).
     */
    async init() {
        if (this.initialized) return;
        try {
            // Set fetch interval to 1 hour to avoid throttling
            remoteConfig.settings.minimumFetchIntervalMillis = 3600000; 
            await fetchAndActivate(remoteConfig);
            this.initialized = true;
        } catch (e) {
            console.warn("Failed to fetch remote config", e);
            // We don't throw here because we want to fallback to env vars gracefully
        }
    }

    /**
     * Retrieves the Gemini API Key.
     * Priority:
     * 1. Firebase Remote Config ('gemini_api_key')
     */
    async getGeminiKey(): Promise<string> {
        await this.init();
        
        // Remote Config returns an empty string if the key doesn't exist
        const remoteKey = getString(remoteConfig, 'gemini_api_key');
        return remoteKey || "";
    }
}

export const configService = new ConfigService();
