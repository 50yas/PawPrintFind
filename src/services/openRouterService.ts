import { PetProfile, ChatSession } from '../types';
import { aiBridgeService } from './aiBridgeService';

/**
 * OpenRouter Service — Refactored to delegate all AI operations to the backend
 * via aiBridgeService. Direct client-side calls are removed for security,
 * central logic management, and robust fallbacks.
 */

const analyzeImageForDescription = async (photo: File): Promise<string> => {
    return aiBridgeService.analyzeImageForDescription(photo);
};

const performAIHealthCheck = async (pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> => {
    return aiBridgeService.performAIHealthCheck(pet, symptoms, locale);
};

const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    return aiBridgeService.generateChatSuggestions(session, currentUserEmail);
};

const comparePets = async (
    foundPetDesc: string,
    lostPet: PetProfile
): Promise<{ score: number; reasoning: string; keyMatches: string[]; discrepancies: string[] }> => {
    return aiBridgeService.comparePets(foundPetDesc, lostPet);
};

const generateMatchExplanation = async (pet: PetProfile, filters: Record<string, unknown>): Promise<string> => {
    return aiBridgeService.generateMatchExplanation(pet, filters);
};

const chat = async (
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    systemPrompt: string
): Promise<string> => {
    return aiBridgeService.chat(history, systemPrompt);
};

const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    // This still hits the backend directly as it's a specific utility
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('./firebase');
    const fn = httpsCallable(functions, 'fetchOpenRouterModels');
    const result = await fn();
    const data = result.data as { models: Array<{ id: string; name: string }> };
    return data.models || [];
};

export const openRouterService = {
    analyzeImageForDescription,
    performAIHealthCheck,
    generateChatSuggestions,
    comparePets,
    generateMatchExplanation,
    chat,
    fetchAvailableModels,
};
