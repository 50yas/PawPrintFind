import { PetProfile, AISettings, ChatSession, AIProvider, AIInsight, BlogPost } from '../types';
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
        return aiService.analyzeImageForDescription(photo);
    },

    async autoFillPetDetails(photo: File, locale: string = 'en'): Promise<any> {
        return aiService.autoFillPetDetails(photo, locale);
    },

    async generatePetIdentikit(photo: File, locale: string = 'en'): Promise<{ code: string, description: string }> {
        return aiService.generatePetIdentikit(photo, locale);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        return aiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        return aiService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        return aiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        return aiService.generateMatchExplanation(pet, filters);
    },

    async parseSearchQuery(query: string): Promise<any> {
        return aiService.parseSearchQuery(query);
    },

    async translateContent(text: string, targetLangs: string[]): Promise<Record<string, string>> {
        return aiService.translateContent(text, targetLangs);
    },

    async generateHealthInsights(pet: PetProfile): Promise<AIInsight[]> {
        return aiService.generateHealthInsights(pet);
    },

    async analyzeVideo(videoFile: File, onProgress?: (percent: number) => void): Promise<string> {
        return aiService.analyzeVideo(videoFile, onProgress);
    },

    async transcribeAudio(audioFile: File, onProgress?: (percent: number) => void): Promise<string> {
        return aiService.transcribeAudio(audioFile, onProgress);
    },

    async generateBlogPost(topic: string): Promise<Partial<BlogPost>> {
        return aiService.generateBlogPost(topic);
    },

    /**
     * Multi-turn chat for LiveAssistant.
     * Hits the unified AI caller on the backend.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        return aiService.chat(history, systemPrompt);
    },
};
