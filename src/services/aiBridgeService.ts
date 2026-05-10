import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, AISettings, ChatSession, AIProvider } from '../types';
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

    /**
     * Multi-turn chat for LiveAssistant.
     * Hits the unified AI caller on the backend.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        const fn = httpsCallable(functions, 'callGemini');
        const response = await fn({
            task: 'chat',
            config: { systemInstruction: systemPrompt },
            contents: history.map(h => ({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.text }]
            }))
        });
        const data = response.data as { success: boolean, text: string };
        return data.text?.trim() || "";
    },

    async fetchAvailableModels(): Promise<{ id: string; name: string }[]> {
        try {
            const fn = httpsCallable(functions, 'fetchOpenRouterModels');
            const result = await fn();
            return (result.data as any).models || [];
        } catch (error) {
            console.error("[AI Bridge] Failed to fetch models:", error);
            return [];
        }
    }
};
