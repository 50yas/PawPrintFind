import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, ChatSession } from '../types';

/**
 * OpenRouter Service — Secure frontend gateway that routes all AI requests
 * through backend Cloud Functions to prevent API key leaks and direct client-side traffic.
 */
export const openRouterService = {
    async analyzeImageForDescription(photo: File): Promise<string> {
        const base64 = await fileToBase64(photo);
        const callFn = httpsCallable(functions, 'callOpenRouter');
        const response = await callFn({
            model: 'vision',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: 'Describe this pet photo in detail.' },
                    { type: 'image_url', image_url: { url: `data:${photo.type};base64,${base64}` } }
                ]
            }],
            task: 'vision'
        });
        const data = response.data as { success: boolean, text: string };
        return data.text || '';
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        const callFn = httpsCallable(functions, 'callOpenRouter');
        try {
            const response = await callFn({
                model: 'triage',
                messages: [
                    { role: 'user', content: `Analyze symptoms for pet: ${JSON.stringify(pet)}. Symptoms: ${symptoms}. Locale: ${locale}` }
                ],
                task: 'triage'
            });
            const data = response.data as { success: boolean, text: string };
            return data.text || '';
        } catch {
            return 'Health analysis failed.';
        }
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        const callFn = httpsCallable(functions, 'callOpenRouter');
        const response = await callFn({
            model: 'chat',
            messages: [
                { role: 'user', content: `Generate 3 chat suggestions based on session: ${JSON.stringify(session)}` }
            ],
            task: 'chat',
            config: { response_format: { type: 'json_object' } }
        });
        const data = response.data as { success: boolean, text: string };
        try {
            const parsed = JSON.parse(data.text.trim());
            return parsed.suggestions || [];
        } catch {
            return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
        }
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        const callFn = httpsCallable(functions, 'callOpenRouter');
        const response = await callFn({
            model: 'matching',
            messages: [
                { role: 'user', content: `Compare found description: ${foundPetDesc} with lost pet: ${JSON.stringify(lostPet)}` }
            ],
            task: 'matching',
            config: { response_format: { type: 'json_object' } }
        });
        const data = response.data as { success: boolean, text: string };
        try {
            return JSON.parse(data.text.trim());
        } catch {
            return { score: 0, reasoning: 'Comparison failed.', keyMatches: [], discrepancies: [] };
        }
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        const callFn = httpsCallable(functions, 'callOpenRouter');
        const response = await callFn({
            model: 'chat',
            messages: [
                { role: 'user', content: `Explain match for pet: ${JSON.stringify(pet)} with filters: ${JSON.stringify(filters)}` }
            ],
            task: 'chat'
        });
        const data = response.data as { success: boolean, text: string };
        return data.text || '';
    },

    async chat(history: Array<{ role: 'user' | 'assistant', text: string }>, systemPrompt: string): Promise<string> {
        const callFn = httpsCallable(functions, 'callOpenRouter');
        const response = await callFn({
            model: 'chat',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.map(h => ({ role: h.role, content: h.text }))
            ],
            task: 'chat'
        });
        const data = response.data as { success: boolean, text: string };
        return data.text || '';
    },

    async fetchAvailableModels(): Promise<{ id: string, name: string }[]> {
        const callFn = httpsCallable(functions, 'fetchOpenRouterModels');
        const response = await callFn({});
        const data = response.data as { models?: { id: string, name: string }[] };
        return data.models || [];
    }
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });