import { PetProfile, ChatSession, AISettings, Geolocation } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * OpenRouter Service — Client-side wrapper for OpenRouter-specific backend calls.
 *
 * NOTE: Most AI operations should go through aiBridgeService -> geminiService
 * which hit the unified callAI backend. This service is for OpenRouter-specific
 * tasks or direct model selection.
 */

const callOpenRouterFn = httpsCallable(functions, 'callOpenRouter');
const fetchModelsFn = httpsCallable(functions, 'fetchOpenRouterModels');

export const openRouterService = {
    /**
     * Calls OpenRouter via backend Cloud Function.
     */
    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string,
        model?: string
    ): Promise<string> {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.text }))
        ];

        const result = await callOpenRouterFn({
            model: model || 'qwen/qwen-2.5-72b-instruct:free',
            messages,
            task: 'chat'
        });

        const data = result.data as { success: boolean; text: string };
        return data.text || '';
    },

    /**
     * Fetches available models from OpenRouter via backend.
     */
    async fetchAvailableModels(): Promise<{ id: string; name: string }[]> {
        try {
            const result = await fetchModelsFn();
            const data = result.data as { models: { id: string; name: string }[] };
            return data.models || [];
        } catch (error) {
            console.error("[OpenRouter] Failed to fetch models:", error);
            return [];
        }
    },

    // These methods are now redundant but kept for compatibility if needed,
    // ideally they should be migrated to use the unified aiBridgeService/geminiService paths.

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

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number; reasoning: string; keyMatches: string[]; discrepancies: string[] }> {
        const { comparePets } = await import('./geminiService');
        return comparePets(foundPetDesc, lostPet);
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        const { generateMatchExplanation } = await import('./geminiService');
        return generateMatchExplanation(pet, filters);
    }
};
