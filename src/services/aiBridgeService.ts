import { PetProfile, AISettings, ChatSession, AIProvider } from '../types';
import { adminService } from './adminService';
import * as aiService from './geminiService';

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
            // Default to Gemini if settings fail to load
            return {
                provider: 'google',
                fallbackToGemini: true,
                modelMapping: { vision: 'gemini-2.0-flash', triage: 'gemini-2.0-flash', chat: 'gemini-2.0-flash', matching: 'gemini-2.0-flash' },
                lastUpdated: Date.now(),
                updatedBy: 'system'
            };
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
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            const { openRouterService } = await import('./openRouterService');
            return openRouterService.analyzeImageForDescription(photo);
        }
        return aiService.analyzeImageForDescription(photo);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            const { openRouterService } = await import('./openRouterService');
            return openRouterService.performAIHealthCheck(pet, symptoms, locale);
        }
        return aiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            const { openRouterService } = await import('./openRouterService');
            return openRouterService.generateChatSuggestions(session, currentUserEmail);
        }
        return aiService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            const { openRouterService } = await import('./openRouterService');
            return openRouterService.comparePets(foundPetDesc, lostPet);
        }
        return aiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            const { openRouterService } = await import('./openRouterService');
            return openRouterService.generateMatchExplanation(pet, filters);
        }
        return aiService.generateMatchExplanation(pet, filters);
    },

    /**
     * Multi-turn chat for LiveAssistant.
     * Hits the unified AI caller on the backend.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            const { openRouterService } = await import('./openRouterService');
            return openRouterService.chat(history, systemPrompt);
        }
        return aiService.chat(history, systemPrompt);
    },
};
