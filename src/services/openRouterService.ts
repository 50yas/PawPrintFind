import { PetProfile, ChatSession, AISettings } from '../types';
import * as Prompts from './prompts';
import { dbService } from './firebase';

// =============================================================================
// OPENROUTER CLIENT — Direct HTTP calls (no Cloud Functions needed)
// =============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
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

const getApiKey = async (): Promise<string> => {
    const settings = await getSettings();
    const key = settings?.apiKeys?.openrouter;
    if (!key) throw new Error('OpenRouter API key not configured. Set it in Admin → AI Settings.');
    return key;
};

const getModel = async (task: string): Promise<string> => {
    const settings = await getSettings();
    const mapped = settings?.modelMapping?.[task as keyof typeof settings.modelMapping];
    // Default models per task if not configured
    const defaults: Record<string, string> = {
        vision: 'google/gemini-2.5-flash',
        triage: 'google/gemini-2.5-pro',
        chat: 'google/gemini-2.5-flash',
        matching: 'google/gemini-2.5-pro',
    };
    return mapped || defaults[task] || 'google/gemini-2.5-flash';
};

/**
 * Core HTTP client for OpenRouter API.
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
    const [apiKey, model] = await Promise.all([getApiKey(), getModel(task)]);

    const body: Record<string, unknown> = {
        model,
        messages,
        ...(options.temperature !== undefined && { temperature: options.temperature }),
        ...(options.maxTokens && { max_tokens: options.maxTokens }),
        ...(options.responseFormat && { response_format: options.responseFormat }),
    };

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'PawPrintFind',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[OpenRouter] ${response.status}: ${errorBody}`);
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices?.[0]?.message?.content || '';
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