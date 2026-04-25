import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, ChatSession, AISettings } from '../types';
import * as Prompts from './prompts';

// =============================================================================
// OPENROUTER CLIENT — Cloud Function Wrapper
// =============================================================================

/**
 * Universal caller that routes to callOpenRouter Cloud Function.
 */
const callOpenRouter = async (
    task: string,
    messages: any[],
    options: {
        responseFormat?: { type: string };
        temperature?: number;
        maxTokens?: number;
    } = {}
): Promise<string> => {
    const fn = httpsCallable(functions, 'callOpenRouter');

    // Map options to Cloud Function expected format
    const config: any = {
        ...(options.temperature !== undefined && { temperature: options.temperature }),
        ...(options.maxTokens && { max_tokens: options.maxTokens }),
        ...(options.responseFormat && { response_format: options.responseFormat }),
    };

    const result = await fn({
        task, // Task alias for server-side model resolution
        messages,
        config
    });

    const data = result.data as { success: boolean, text: string };
    if (!data.success) throw new Error("OpenRouter call failed on server.");
    return data.text;
};

// =============================================================================
//  FILE UTILITIES
// =============================================================================

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// =============================================================================
//  AI METHODS — OpenRouter Implementation (Routed via Functions)
// =============================================================================

const analyzeImageForDescription = async (photo: File): Promise<string> => {
    const base64 = await fileToBase64(photo);
    const messages = [{
        role: 'user',
        content: [
            { type: 'text', text: Prompts.getImageDescriptionPrompt() },
            { type: 'image_url', image_url: { url: `data:${photo.type};base64,${base64}` } },
        ],
    }];
    return callOpenRouter('vision', messages);
};

const performAIHealthCheck = async (pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> => {
    try {
        const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
        const messages = [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
        ];
        return await callOpenRouter('triage', messages);
    } catch (e) {
        console.error("[OpenRouter] Health check failed:", e);
        return 'Health analysis failed.';
    }
};

const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
    const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);
    const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
    ];
    try {
        const text = await callOpenRouter('chat', messages, { responseFormat: { type: 'json_object' } });
        const parsed = JSON.parse(text.trim());
        return parsed.suggestions || [];
    } catch {
        return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
    }
};

const comparePets = async (
    foundPetDesc: string,
    lostPet: PetProfile
): Promise<{ score: number; reasoning: string; keyMatches: string[]; discrepancies: string[] }> => {
    const { systemInstruction, userPrompt } = Prompts.getPetComparisonParts(foundPetDesc, lostPet);
    const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
    ];
    try {
        const text = await callOpenRouter('matching', messages, { responseFormat: { type: 'json_object' } });
        return JSON.parse(text.trim());
    } catch {
        return { score: 0, reasoning: 'Comparison failed.', keyMatches: [], discrepancies: [] };
    }
};

const generateMatchExplanation = async (pet: PetProfile, filters: Record<string, unknown>): Promise<string> => {
    const userPrompt = Prompts.getMatchExplanationPrompt(pet, filters);
    const messages = [{ role: 'user', content: userPrompt }];
    try {
        return await callOpenRouter('chat', messages);
    } catch {
        return 'Matches your preferences.';
    }
};

/**
 * Full conversational chat — used by LiveAssistant for multi-turn conversations.
 */
const chat = async (
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    systemPrompt: string
): Promise<string> => {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({
            role: h.role,
            content: h.text,
        })),
    ];
    return callOpenRouter('chat', messages, { temperature: 0.7 });
};

/**
 * Fetch available models from OpenRouter (via Cloud Function for consistency).
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const result = await fn();
        const data = result.data as { models: { id: string; name: string }[] };
        return data.models || [];
    } catch (e) {
        console.error("Failed to fetch models:", e);
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
};
