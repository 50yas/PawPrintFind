import { dbService } from './firebase';
import * as geminiService from './geminiService';
import { openRouterService } from './openRouterService';
import { adminService } from './adminService';
import { PetProfile, AISettings, ChatSession, AIProvider } from '../types';

export const aiBridgeService = {
    async getSettings(): Promise<AISettings | null> {
        try {
            return await dbService.getAISettings();
        } catch (error) {
            console.warn("Failed to fetch AI settings, defaulting to Gemini:", error);
            return null;
        }
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
            return (openRouterService as any).performAIHealthCheck(pet, symptoms, locale);
        }
        return geminiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const settings = await this.getSettings();

        if (settings?.provider === 'openrouter') {
            return (openRouterService as any).generateChatSuggestions(session, currentUserEmail);
        }
        return geminiService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        const settings = await this.getSettings();

        if (settings?.provider === 'openrouter') {
            return (openRouterService as any).comparePets(foundPetDesc, lostPet);
        }
        return geminiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: any): Promise<string> {
        const settings = await this.getSettings();

        if (settings?.provider === 'openrouter') {
            return (openRouterService as any).generateMatchExplanation?.(pet, filters) || geminiService.generateMatchExplanation(pet, filters);
        }
        return geminiService.generateMatchExplanation(pet, filters);
    },
};
