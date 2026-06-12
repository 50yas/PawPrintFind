import { PetProfile, ChatSession, AISettings } from '../types';
import * as Prompts from './prompts';
import { dbService, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// =============================================================================
// OPENROUTER CLIENT — Unified backend-only execution
// =============================================================================

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

// Cached settings to avoid repeated Firestore reads
let cachedSettings: AISettings | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

const getSettings = async (force = false): Promise<AISettings | null> => {
    if (!force && cachedSettings && Date.now() - settingsCacheTime < CACHE_TTL) {
        return cachedSettings;
    }
    try {
        cachedSettings = await dbService.getAISettings();
        settingsCacheTime = Date.now();
        return cachedSettings;
    } catch {
        return cachedSettings; // Return stale if available
    }
};

const getModel = async (task: string): Promise<string> => {
    const settings = await getSettings();
    const mapped = settings?.modelMapping?.[task as keyof typeof settings.modelMapping];
    // Default models per task if not configured
    const defaults: Record<string, string> = {
        vision: 'google/gemini-2.0-flash',
        triage: 'google/gemini-2.0-flash',
        chat: 'google/gemini-2.0-flash',
        matching: 'google/gemini-2.0-flash',
    };
    return mapped || defaults[task] || 'google/gemini-2.0-flash';
};

/**
 * Executes OpenRouter call via Cloud Function.
 */
const callOpenRouter = async (
    task: string,
    messages: OpenRouterMessage[],
    options: {
        responseFormat?: { type: string };
        temperature?: number;
        maxTokens?: number;
    } = {}
): Promise<string> => {
    const model = await getModel(task);
    const fn = httpsCallable(functions, 'callOpenRouter');

    // Standardize config for the backend function
    const config: any = {};
    if (options.maxTokens) config.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) config.temperature = options.temperature;
    if (options.responseFormat?.type === 'json_object') {
        config.response_format = { type: 'json_object' };
    }

    const result = await fn({
        task,
        model,
        messages,
        config
    });

    const data = result.data as { success: boolean; text: string; error?: string };
    if (!data.success) {
        throw new Error(data.error || 'OpenRouter backend execution failed');
    }
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
//  AI METHODS — OpenRouter Implementation
// =============================================================================

const analyzeImageForDescription = async (photo: File): Promise<string> => {
    const base64 = await fileToBase64(photo);
    const messages: OpenRouterMessage[] = [{
        role: 'user',
        content: [
            { type: 'text', text: Prompts.getImageDescriptionPrompt() },
            { type: 'image_url', image_url: { url: `data:${photo.type};base64,${base64}` } },
        ],
    }];
    return callOpenRouter('vision', messages);
};

const performAIHealthCheck = async (pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
    const messages: OpenRouterMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
    ];
    return callOpenRouter('triage', messages);
};

const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
    const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);
    const messages: OpenRouterMessage[] = [
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
    const messages: OpenRouterMessage[] = [
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
    const messages: OpenRouterMessage[] = [{ role: 'user', content: userPrompt }];
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
    const messages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.text,
        })),
    ];
    return callOpenRouter('chat', messages, { temperature: 0.7 });
};

/**
 * Fetch available models from OpenRouter via Cloud Function (proxied for consistency).
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const result = await fn({});
        const data = result.data as { models: { id: string; name: string }[] };
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