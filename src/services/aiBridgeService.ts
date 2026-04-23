import { dbService } from './firebase';
import * as geminiService from './geminiService';
import { adminService } from './adminService';
import { PetProfile, AISettings, ChatSession, AIProvider } from '../types';

let cachedSettings: AISettings | null = null;
let isInitializing = false;
let initPromise: Promise<AISettings | null> | null = null;

export const aiBridgeService = {
    async init(): Promise<AISettings | null> {
        if (cachedSettings) return cachedSettings;
        if (initPromise) return initPromise;
        
        initPromise = (async () => {
            isInitializing = true;
            try {
                const settings = await adminService.getAISettings();
                cachedSettings = settings;
                return settings;
            } catch (error) {
                console.error("[AI Bridge] Initialization failed:", error);
                return null;
            } finally {
                isInitializing = false;
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
     * All methods below now route through geminiService, which proxies calls
     * to secure Cloud Functions. The backend resolveAIConfig() handles
     * provider-specific routing (Gemini vs OpenRouter) server-side.
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

    /**
     * Multi-turn chat for LiveAssistant.
     * Proxied through Cloud Functions for security.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        // We use the generic 'chat' task which geminiService can handle
        return geminiService.chat(history, systemPrompt);
    },
};
