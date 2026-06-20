import { PetProfile, ChatSession, AISettings, AIInsight, BlogPost } from '../types';
import { aiBridgeService } from './aiBridgeService';

/**
 * DEPRECATED: Direct OpenRouter client is replaced by backend-routed Cloud Functions.
 * This service is kept only for backward compatibility and is being phased out.
 * All new code should use aiBridgeService.
 */

const getSettings = async (): Promise<AISettings | null> => {
    return aiBridgeService.getSettings();
};

/**
 * Fetch available models from OpenRouter (public endpoint, no auth needed).
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
    } catch {
        return [];
    }
};

export const openRouterService = {
    // These methods now delegate to aiBridgeService to ensure consistent backend routing
    analyzeImageForDescription: (photo: File) => aiBridgeService.analyzeImageForDescription(photo),
    performAIHealthCheck: (pet: PetProfile, symptoms: string, locale: string = 'en') => aiBridgeService.performAIHealthCheck(pet, symptoms, locale),
    generateChatSuggestions: (session: ChatSession, currentUserEmail: string) => aiBridgeService.generateChatSuggestions(session, currentUserEmail),
    comparePets: (foundPetDesc: string, lostPet: PetProfile) => aiBridgeService.comparePets(foundPetDesc, lostPet),
    generateMatchExplanation: (pet: PetProfile, filters: Record<string, unknown>) => aiBridgeService.generateMatchExplanation(pet, filters),
    chat: (history: Array<{ role: 'user' | 'assistant'; text: string }>, systemPrompt: string) => aiBridgeService.chat(history, systemPrompt),

    // Public utility kept here
    fetchAvailableModels,
    getSettings,
};
