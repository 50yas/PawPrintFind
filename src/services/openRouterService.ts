import { PetProfile, ChatSession, AISettings } from '../types';
import { adminService } from './adminService';
import * as aiService from './geminiService';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// =============================================================================
// OPENROUTER SERVICE — Securely delegated to Cloud Functions
// =============================================================================

/**
 * This service now delegates all heavy lifting to the backend Cloud Functions.
 * Direct frontend-to-OpenRouter HTTP calls are removed for security (avoiding
 * exposing API keys and bypassing backend rate limits/monitoring).
 */

const getSettings = async (): Promise<AISettings | null> => {
    return adminService.getAISettings();
};

const analyzeImageForDescription = async (photo: File): Promise<string> => {
    return aiService.analyzeImageForDescription(photo);
};

const performAIHealthCheck = async (pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> => {
    return aiService.performAIHealthCheck(pet, symptoms, locale);
};

const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    return aiService.generateChatSuggestions(session, currentUserEmail);
};

const comparePets = async (
    foundPetDesc: string,
    lostPet: PetProfile
): Promise<{ score: number; reasoning: string; keyMatches: string[]; discrepancies: string[] }> => {
    return aiService.comparePets(foundPetDesc, lostPet);
};

const generateMatchExplanation = async (pet: PetProfile, filters: Record<string, unknown>): Promise<string> => {
    return aiService.generateMatchExplanation(pet, filters);
};

/**
 * Full conversational chat — used by LiveAssistant for multi-turn conversations.
 */
const chat = async (
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    systemPrompt: string
): Promise<string> => {
    return aiService.chat(history, systemPrompt);
};

/**
 * Fetch available models from OpenRouter via a secure Cloud Function.
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const result = await fn();
        const data = result.data as { models: Array<{ id: string; name: string }> };
        return data.models || [];
    } catch (error) {
        console.error("[OpenRouter] Failed to fetch models:", error);
        return [];
    }
};

// =============================================================================
//  EXPORT
// =============================================================================

export const openRouterService = {
    analyzeImageForDescription,
    performAIHealthCheck,
    generateChatSuggestions,
    comparePets,
    generateMatchExplanation,
    chat,
    fetchAvailableModels,
    // Expose for testing/admin
    getSettings,
};