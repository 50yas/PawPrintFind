import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, ChatSession, AISettings } from '../types';
import * as Prompts from './prompts';
import { dbService } from './firebase';

// =============================================================================
// OPENROUTER SERVICE — Cloud Functions Router
// =============================================================================

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

// Cached settings to avoid repeated Firestore reads
let cachedSettings: AISettings | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

const getSettings = async (): Promise<AISettings | null> => {
    if (cachedSettings && Date.now() - settingsCacheTime < CACHE_TTL) {
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
    // Default free models per task if not configured
    const defaults: Record<string, string> = {
        vision: 'nvidia/nemotron-nano-12b-v2-vl:free',
        visionIdentification: 'nvidia/nemotron-nano-12b-v2-vl:free',
        triage: 'qwen/qwen-2.5-72b-instruct:free',
        chat: 'qwen/qwen-2.5-72b-instruct:free',
        matching: 'qwen/qwen-2.5-72b-instruct:free',
        smartSearch: 'qwen/qwen-2.5-72b-instruct:free',
        healthAssessment: 'qwen/qwen-2.5-72b-instruct:free',
        blogGeneration: 'qwen/qwen-2.5-coder-32b-instruct:free',
    };
    return mapped || defaults[task] || 'qwen/qwen-2.5-72b-instruct:free';
};

/**
 * Calls the backend Cloud Function `callOpenRouter`.
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
    const callFn = httpsCallable(functions, 'callOpenRouter');

    const config: Record<string, any> = {};
    if (options.temperature !== undefined) config.temperature = options.temperature;
    if (options.maxTokens !== undefined) config.max_tokens = options.maxTokens;
    if (options.responseFormat !== undefined) config.response_format = options.responseFormat;

    const response = await callFn({
        model,
        messages,
        config: Object.keys(config).length > 0 ? config : undefined,
        task,
    });

    const data = response.data as { success?: boolean; text?: string };
    return data?.text || '';
};

// =============================================================================
// FILE UTILITIES
// =============================================================================

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// =============================================================================
// AI METHODS — OpenRouter Implementation
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
    try {
        const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
        const messages: OpenRouterMessage[] = [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
        ];
        return await callOpenRouter('triage', messages);
    } catch (error) {
        console.error('Health check failed:', error);
        return 'Health analysis failed.';
    }
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
 * Fetch available models from OpenRouter via backend Cloud Function.
 */
const fetchAvailableModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const fetchFn = httpsCallable(functions, 'fetchOpenRouterModels');
        const response = await fetchFn();
        const data = response.data as { models?: { id: string; name: string }[] };
        return data?.models || [];
    } catch (e) {
        console.error('Failed to fetch OpenRouter models:', e);
        return [];
    }
};

// =============================================================================
// EXPORT
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
