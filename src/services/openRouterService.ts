import { PetProfile, ChatSession } from '../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * OpenRouter Service — Frontend interface for OpenRouter specific operations.
 * Now refactored to use secure Cloud Functions instead of direct API calls.
 */

/**
 * Fetch available models from OpenRouter via secure Cloud Function.
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const result = await fn();
        const data = result.data as { models: { id: string; name: string }[] };
        return data.models || [];
    } catch (error) {
        console.error("[OpenRouter] Failed to fetch models:", error);
        return [];
    }
};

// =============================================================================
//  DEPRECATED DIRECT CALLS
//  All AI operations now route through aiBridgeService -> geminiService
//  which uses the unified callAI backend to handle provider switching.
// =============================================================================

export const openRouterService = {
    fetchAvailableModels,
    // Note: Other methods (analyzeImage, chat, etc.) are now handled by
    // the unified backend via geminiService.ts.
};
