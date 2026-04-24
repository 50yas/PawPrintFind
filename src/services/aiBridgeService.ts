import { dbService } from './firebase';
import * as geminiService from './geminiService';
import { openRouterService } from './openRouterService';
import { adminService } from './adminService';
import { PetProfile, AISettings, ChatSession, AIProvider } from '../types';

let cachedSettings: AISettings | null = null;
let initPromise: Promise<AISettings | null> | null = null;

export const aiBridgeService = {
    /**
     * Initializes or returns the cached AI settings.
     * Uses a promise-based lock to prevent multiple simultaneous initializations.
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

    /**
     * Gets settings, optionally forcing a refresh from the database.
     */
    async getSettings(forceRefresh = false): Promise<AISettings | null> {
        if (forceRefresh) {
            cachedSettings = null;
            initPromise = null;
        }
        return this.init();
    },

    async testConnection(provider: AIProvider, apiKey: string): Promise<{ success: boolean, message: string }> {
        return adminService.testAIConnection(provider, apiKey);
    },

    async analyzeImageForDescription(photo: File): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.analyzeImageForDescription(photo);
        }
        return geminiService.analyzeImageForDescription(photo);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.performAIHealthCheck(pet, symptoms, locale);
        }
        return geminiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.generateChatSuggestions(session, currentUserEmail);
        }
        return geminiService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.comparePets(foundPetDesc, lostPet);
        }
        return geminiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.generateMatchExplanation(pet, filters);
        }
        return geminiService.generateMatchExplanation(pet, filters);
    },

    /**
     * Multi-turn chat for LiveAssistant (OpenRouter only — Gemini uses native Live API).
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        return openRouterService.chat(history, systemPrompt);
    },
};
