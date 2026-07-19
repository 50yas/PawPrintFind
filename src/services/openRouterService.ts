import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, ChatSession } from '../types';

const callCloudOpenRouter = async (task: string, messages: any[], options: any = {}): Promise<string> => {
    const fn = httpsCallable(functions, 'callOpenRouter');
    const response = await fn({
        model: 'qwen/qwen-2.5-72b-instruct:free', // Standard default or fallback
        messages,
        config: {
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            response_format: options.responseFormat
        },
        task
    });
    const data = response.data as { success: boolean, text: string };
    return data.text || '';
};

export const openRouterService = {
    async analyzeImageForDescription(photo: File): Promise<string> {
        // Base64 encode file
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(photo);
        });
        const messages = [{
            role: 'user',
            content: [
                { type: 'text', text: "Describe this pet image." },
                { type: 'image_url', image_url: { url: `data:${photo.type};base64,${base64}` } }
            ]
        }];
        return callCloudOpenRouter('vision', messages);
    },

    async performAIHealthCheck(pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> {
        try {
            const messages = [{ role: 'user', content: `Check symptoms: ${symptoms}` }];
            return await callCloudOpenRouter('triage', messages);
        } catch {
            return 'Health analysis failed.';
        }
    },

    async generateChatSuggestions(session: ChatSession, currentUserEmail: string): Promise<string[]> {
        try {
            const messages = [{ role: 'user', content: 'Generate chat suggestions' }];
            const text = await callCloudOpenRouter('chat', messages, { responseFormat: { type: 'json_object' } });
            const parsed = JSON.parse(text.trim());
            return parsed.suggestions || [];
        } catch {
            return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
        }
    },

    async comparePets(foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> {
        try {
            const messages = [{ role: 'user', content: `Compare: ${foundPetDesc}` }];
            const text = await callCloudOpenRouter('matching', messages, { responseFormat: { type: 'json_object' } });
            return JSON.parse(text.trim());
        } catch {
            return { score: 0, reasoning: 'Comparison failed.', keyMatches: [], discrepancies: [] };
        }
    },

    async generateMatchExplanation(pet: PetProfile, filters: Record<string, unknown>): Promise<string> {
        try {
            const messages = [{ role: 'user', content: 'Explain match' }];
            return await callCloudOpenRouter('chat', messages);
        } catch {
            return 'Matches your preferences.';
        }
    },

    async chat(history: Array<{ role: 'user' | 'assistant'; text: string }>, systemPrompt: string): Promise<string> {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.text }))
        ];
        return callCloudOpenRouter('chat', messages);
    },

    async fetchAvailableModels(): Promise<{ id: string, name: string }[]> {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const response = await fn({});
        const data = response.data as { models: { id: string, name: string }[] };
        return data.models || [];
    }
};
