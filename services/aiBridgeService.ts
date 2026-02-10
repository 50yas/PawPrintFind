import { dbService } from './firebase';
import * as geminiService from './geminiService';
import * as openRouterService from './openRouterService';
import { PetProfile, AISettings, ChatSession } from '../types';

export const aiBridgeService = {
    async getSettings(): Promise<AISettings | null> {
        try {
            return await dbService.getAISettings();
        } catch (error) {
            console.warn("Failed to fetch AI settings, defaulting to Gemini:", error);
            return null;
        }
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
             // @ts-ignore - OpenRouter service might not fully implement this yet
            return openRouterService.performAIHealthCheck(pet, symptoms, locale);
        }
        return geminiService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const settings = await this.getSettings();

        if (settings?.provider === 'openrouter') {
            // @ts-ignore
            return openRouterService.generateChatSuggestions(session, currentUserEmail);
        }
        return geminiService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        const settings = await this.getSettings();

        if (settings?.provider === 'openrouter') {
            // @ts-ignore
            return openRouterService.comparePets(foundPetDesc, lostPet);
        }
        return geminiService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: any): Promise<string> {
        const settings = await this.getSettings();

        if (settings?.provider === 'openrouter') {
            // @ts-ignore
            return openRouterService.generateMatchExplanation?.(pet, filters) || geminiService.generateMatchExplanation(pet, filters);
        }
        return geminiService.generateMatchExplanation(pet, filters);
    },
};