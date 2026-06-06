import { PetProfile, ChatSession, AISettings } from '../types';
import * as Prompts from './prompts';
import { dbService } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * OpenRouter Service
 * All calls are now routed through backend Cloud Functions for security and consistency.
 */

const getSettings = async (): Promise<AISettings | null> => {
    try {
        return await dbService.getAISettings();
    } catch {
        return null;
    }
};

export const openRouterService = {
    async analyzeImageForDescription(photo: File): Promise<string> {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(photo);
        const base64 = await base64Promise;

        const fn = httpsCallable(functions, 'callOpenRouter');
        const response = await fn({
            task: 'vision',
            model: 'qwen/qwen-2.5-72b-instruct:free',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: Prompts.getImageDescriptionPrompt() },
                    { type: 'image_url', image_url: { url: `data:${photo.type};base64,${base64}` } },
                ],
            }]
        });
        const data = response.data as { success: boolean, text: string };
        return data.text || "";
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
        const fn = httpsCallable(functions, 'callOpenRouter');
        try {
            const response = await fn({
                task: 'triage',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userPrompt },
                ]
            });
            const data = response.data as { success: boolean, text: string };
            return data.text || "Health analysis unavailable.";
        } catch {
            return "Health analysis failed.";
        }
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
        const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);
        const fn = httpsCallable(functions, 'callOpenRouter');
        try {
            const response = await fn({
                task: 'chat',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userPrompt },
                ],
                config: { response_format: { type: 'json_object' } }
            });
            const data = response.data as { success: boolean, text: string };
            const parsed = JSON.parse(data.text || "{}");
            return parsed.suggestions || [];
        } catch {
            return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
        }
    },

    async comparePets(
        foundPetDesc: string,
        lostPet: PetProfile
    ): Promise<{ score: number; reasoning: string; keyMatches: string[]; discrepancies: string[] }> {
        const { systemInstruction, userPrompt } = Prompts.getPetComparisonParts(foundPetDesc, lostPet);
        const fn = httpsCallable(functions, 'callOpenRouter');
        try {
            const response = await fn({
                task: 'matching',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userPrompt },
                ],
                config: { response_format: { type: 'json_object' } }
            });
            const data = response.data as { success: boolean, text: string };
            return JSON.parse(data.text || "{}");
        } catch {
            return { score: 0, reasoning: 'Comparison failed.', keyMatches: [], discrepancies: [] };
        }
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        const userPrompt = Prompts.getMatchExplanationPrompt(pet, filters);
        const fn = httpsCallable(functions, 'callOpenRouter');
        try {
            const response = await fn({
                task: 'chat',
                messages: [{ role: 'user', content: userPrompt }]
            });
            const data = response.data as { success: boolean, text: string };
            return data.text || 'Matches your preferences.';
        } catch {
            return 'Matches your preferences.';
        }
    },

    async chat(
        history: Array<{ role: 'user' | 'assistant'; text: string }>,
        systemPrompt: string
    ): Promise<string> {
        const fn = httpsCallable(functions, 'callOpenRouter');
        const response = await fn({
            task: 'chat',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.map(h => ({
                    role: h.role as 'user' | 'assistant',
                    content: h.text,
                })),
            ]
        });
        const data = response.data as { success: boolean, text: string };
        return data.text || "";
    },

    async fetchAvailableModels(): Promise<{ id: string; name: string }[]> {
        try {
            const fn = httpsCallable(functions, 'fetchOpenRouterModels');
            const response = await fn({});
            const data = response.data as { models: { id: string, name: string }[] };
            return data.models || [];
        } catch {
            return [];
        }
    },

    getSettings,
};
