import { aiBridgeService } from './aiBridgeService';
import { PetProfile, ChatSession } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * OpenRouter Service — Now a thin wrapper around aiBridgeService
 * to maintain backward compatibility while ensuring all calls route through
 * the unified backend-controlled AI bridge.
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

    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        return aiBridgeService.chat(history, systemPrompt);
    },

    /**
     * Fetch available models from OpenRouter via backend Cloud Function.
     */
    async fetchAvailableModels(): Promise<{ id: string; name: string }[]> {
        try {
            const fn = httpsCallable(functions, 'fetchOpenRouterModels');
            const result = await fn();
            const data = result.data as { models: { id: string, name: string }[] };
            return data.models || [];
        } catch (error) {
            console.error("[OpenRouter] Failed to fetch models:", error);
            return [];
        }
    }
};
