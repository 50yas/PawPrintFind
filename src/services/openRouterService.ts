import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { aiBridgeService } from './aiBridgeService';
import { PetProfile, ChatSession, AISettings } from '../types';

/**
 * OpenRouter Service — Refactored to route all calls through unified backend handlers.
 * Client-side direct API calls are removed for security and usage tracking.
 */
export const openRouterService = {
    async analyzeImageForDescription(photo: File): Promise<string> {
        return aiBridgeService.analyzeImageForDescription(photo);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        return aiBridgeService.performAIHealthCheck(pet, symptoms, locale);
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        return aiBridgeService.generateChatSuggestions(session, currentUserEmail);
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        return aiBridgeService.comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        return aiBridgeService.generateMatchExplanation(pet, filters);
    },

    async chat(history: Array<{ role: 'user' | 'assistant'; text: string }>, systemPrompt: string): Promise<string> {
        return aiBridgeService.chat(history, systemPrompt);
    },

    /**
     * Fetch available models via backend to ensure API key security.
     */
    async fetchAvailableModels(): Promise<{ id: string; name: string }[]> {
        try {
            const fn = httpsCallable(functions, 'fetchOpenRouterModels');
            const result = await fn();
            const data = result.data as { models: { id: string; name: string }[] };
            return data.models || [];
        } catch (error) {
            console.error("[OpenRouter] Failed to fetch models:", error);
            return [];
        }
    },

    async getSettings(): Promise<AISettings | null> {
        return aiBridgeService.getSettings();
    }
};