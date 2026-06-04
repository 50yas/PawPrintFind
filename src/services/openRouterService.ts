import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { aiBridgeService } from './aiBridgeService';

/**
 * OpenRouter Service (Frontend Wrapper)
 * Direct client-side calls to OpenRouter are deprecated for security.
 * All AI tasks now route through backend Cloud Functions which handle
 * provider selection and fallback logic.
 */

/**
 * Fetch available models from OpenRouter via a secure backend Cloud Function.
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const result = await fn();
        const data = result.data as { models: Array<{ id: string; name: string }> };
        return data.models || [];
    } catch (error) {
        console.error("Failed to fetch OpenRouter models:", error);
        return [];
    }
};

// =============================================================================
//  EXPORT
// =============================================================================

export const openRouterService = {
    fetchAvailableModels,
    // AI tasks are now handled by aiBridgeService and geminiService via backend
    analyzeImageForDescription: (photo: File) => aiBridgeService.analyzeImageForDescription(photo),
    performAIHealthCheck: (pet: any, symptoms: string, locale: string) => aiBridgeService.performAIHealthCheck(pet, symptoms, locale),
    generateChatSuggestions: (session: any, email: string) => aiBridgeService.generateChatSuggestions(session, email),
    comparePets: (desc: string, pet: any) => aiBridgeService.comparePets(desc, pet),
    generateMatchExplanation: (pet: any, filters: any) => aiBridgeService.generateMatchExplanation(pet, filters),
    chat: (history: any, prompt: string) => aiBridgeService.chat(history, prompt),
};