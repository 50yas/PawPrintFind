import { PetProfile, AISettings, ChatSession, AIProvider, Geolocation } from '../types';
import { adminService } from './adminService';
import * as geminiService from './geminiService';
import { openRouterService } from './openRouterService';

let cachedSettings: AISettings | null = null;
let isInitializing = false;

/**
 * AI Bridge Service — Unified interface for all AI operations.
 * Acts as a router/coordinator between specialized services.
 * Most operations now hit the unified Cloud Functions which handle
 * provider selection (Gemini vs OpenRouter) server-side.
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

    // --- VISION & IDENTIFICATION ---

    async autoFillPetDetails(photo: File, locale: string = 'en') {
        return geminiService.autoFillPetDetails(photo, locale);
    },

    async analyzeImageForDescription(photo: File): Promise<string> {
        return geminiService.analyzeImageForDescription(photo);
    },

    async generatePetIdentikit(photo: File, locale: string = 'en') {
        return geminiService.generatePetIdentikit(photo, locale);
    },

    // --- HEALTH & TRIAGE ---

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        return geminiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateHealthInsights(pet: PetProfile) {
        return geminiService.generateHealthInsights(pet);
    },

    // --- SEARCH & MATCHING ---

    async parseSearchQuery(query: string) {
        return geminiService.parseSearchQuery(query);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        return geminiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        return geminiService.generateMatchExplanation(pet, filters);
    },

    // --- CHAT & INTERACTION ---

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        return geminiService.generateChatSuggestions(session, currentUserEmail);
    },

    /**
     * Multi-turn chat for LiveAssistant.
     * Routes through backend callAI logic.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        return geminiService.chat(history, systemPrompt);
    },

    // --- SPECIALIZED MEDIA ---

    async analyzeVideo(videoFile: File, onProgress?: (percent: number) => void) {
        return geminiService.analyzeVideo(videoFile, onProgress);
    },

    async transcribeAudio(audioFile: File, onProgress?: (percent: number) => void) {
        return geminiService.transcribeAudio(audioFile, onProgress);
    },

    async textToSpeech(text: string) {
        return geminiService.textToSpeech(text);
    },

    // --- GROUNDING / EXTERNAL TOOLS ---

    async findNearbyVets(location: Geolocation) {
        return geminiService.findNearbyVets(location);
    },

    async findClinicOnGoogleMaps(name: string, city: string) {
        return geminiService.findClinicOnGoogleMaps(name, city);
    },

    // --- BLOG & CONTENT ---

    async generateBlogPost(topic: string) {
        return geminiService.generateBlogPost(topic);
    },
};
