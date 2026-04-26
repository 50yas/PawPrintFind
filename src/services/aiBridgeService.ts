import { dbService } from './firebase';
import * as geminiService from './geminiService';
import { openRouterService } from './openRouterService';
import { adminService } from './adminService';
import { PetProfile, AISettings, ChatSession, AIProvider } from '../types';

let cachedSettings: AISettings | null = null;
let initPromise: Promise<AISettings | null> | null = null;

export const aiBridgeService = {
    /**
     * Initializes the service by fetching settings from Firestore.
     * Uses a promise-based singleton pattern to prevent race conditions.
     */
    async init(): Promise<AISettings | null> {
        if (cachedSettings) return cachedSettings;
        if (initPromise) return initPromise;
        
        initPromise = (async () => {
            try {
                const settings = await adminService.getAISettings();
                cachedSettings = settings;
                return settings;
            } catch (error) {
                console.error("[AI Bridge] Initialization failed:", error);
                return null;
            } finally {
                initPromise = null;
            }
        })();

        return initPromise;
    },

    async getSettings(forceRefresh = false): Promise<AISettings | null> {
        if (forceRefresh) {
            cachedSettings = null;
        }
        if (cachedSettings && !forceRefresh) return cachedSettings;
        return this.init();
    },

    async testConnection(provider: AIProvider, apiKey: string): Promise<{ success: boolean, message: string }> {
        return adminService.testAIConnection(provider, apiKey);
    },

    /**
     * Note: In the new architecture, provider routing is handled server-side
     * in Cloud Functions. geminiService.ts calls these functions.
     * We keep the bridge for easy frontend access and potential client-side
     * logic if needed in the future.
     */
    async analyzeImageForDescription(photo: File): Promise<string> {
        return geminiService.analyzeImageForDescription(photo);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        return geminiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        return geminiService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        return geminiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        return geminiService.generateMatchExplanation(pet, filters);
    },

    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        // Multi-turn chat routing: Gemini uses native Live API in frontend,
        // but for generic chat we can route through OpenRouter or a Cloud Function.
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.chat(history, systemPrompt);
        }
        // Fallback to OpenRouter for now as geminiService doesn't have a generic 'chat' yet
        return openRouterService.chat(history, systemPrompt);
    },
};
