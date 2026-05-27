import { PetProfile, AISettings, ChatSession, AIProvider, Geolocation } from '../types';
import { adminService } from './adminService';

let cachedSettings: AISettings | null = null;
let isInitializing = false;

/**
 * AI Bridge Service — Unified interface for all AI operations.
 * Routes requests to the appropriate Cloud Functions which handle provider
 * selection (Gemini vs OpenRouter) server-side for security and quota management.
 */
export const aiBridgeService = {
    async init(): Promise<AISettings | null> {
        if (cachedSettings) return cachedSettings;
        if (isInitializing) return null;
        
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
        }
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

    async analyzeImageForDescription(photo: File): Promise<string> {
        const { analyzeImageForDescription } = await import('./geminiService');
        return analyzeImageForDescription(photo);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        const { performAIHealthCheck } = await import('./geminiService');
        return performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const { generateChatSuggestions } = await import('./geminiService');
        return generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        const { comparePets } = await import('./geminiService');
        return comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        const { generateMatchExplanation } = await import('./geminiService');
        return generateMatchExplanation(pet, filters);
    },

    async autoFillPetDetails(photo: File, locale: string = 'en'): Promise<any> {
        const { autoFillPetDetails } = await import('./geminiService');
        return autoFillPetDetails(photo, locale);
    },

    async generatePetIdentikit(photo: File, locale: string = 'en'): Promise<{ code: string, description: string }> {
        const { generatePetIdentikit } = await import('./geminiService');
        return generatePetIdentikit(photo, locale);
    },

    async parseSearchQuery(query: string): Promise<any> {
        const { parseSearchQuery } = await import('./geminiService');
        return parseSearchQuery(query);
    },

    async findNearbyVets(location: Geolocation): Promise<{ text: string, places: any[] }> {
        const { findNearbyVets } = await import('./geminiService');
        return findNearbyVets(location);
    },

    /**
     * Multi-turn chat for LiveAssistant.
     * Hits the unified AI caller on the backend.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        const { chat } = await import('./geminiService');
        return chat(history, systemPrompt);
    },
};
