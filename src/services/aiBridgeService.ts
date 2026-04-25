import { dbService } from './firebase';
import * as geminiService from './geminiService';
import { openRouterService } from './openRouterService';
import { adminService } from './adminService';
import { PetProfile, AISettings, ChatSession, AIProvider, BlogPost } from '../types';

let cachedSettings: AISettings | null = null;
let isInitializing = false;

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
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            return openRouterService.analyzeImageForDescription(photo);
        }
        return geminiService.analyzeImageForDescription(photo);
    },

    async identifyBreedFromImage(photo: File, locale: string = 'en'): Promise<string> {
        const settings = await this.getSettings();
        if (settings?.provider === 'openrouter') {
            // Note: identifyBreedFromImage in geminiService also calls a Cloud Function
            // which handles the provider switching. We can consolidate this.
            return geminiService.identifyBreedFromImage(photo, locale);
        }
        return geminiService.identifyBreedFromImage(photo, locale);
    },

    async autoFillPetDetails(photo: File, locale: string = 'en'): Promise<any> {
        return geminiService.autoFillPetDetails(photo, locale);
    },

    async generatePetIdentikit(photo: File, locale: string = 'en'): Promise<{ code: string, description: string }> {
        return geminiService.generatePetIdentikit(photo, locale);
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

    async parseSearchQuery(query: string): Promise<any> {
        const settings = await this.getSettings();
        // Since geminiService.parseSearchQuery now uses 'smartSearch' which is routed
        // to callAI in Cloud Functions, it will respect the provider setting.
        return geminiService.parseSearchQuery(query);
    },

    async generateBlogPost(topic: string): Promise<Partial<BlogPost>> {
        return geminiService.generateBlogPost(topic);
    },

    async generateSuccessStory(pet: PetProfile): Promise<Partial<BlogPost>> {
        return geminiService.generateSuccessStory(pet);
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
