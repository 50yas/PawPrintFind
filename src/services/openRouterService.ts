import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * OpenRouter Service — Client-side wrapper for OpenRouter Cloud Functions.
 */
export const openRouterService = {
    /**
     * Fetch available models from OpenRouter via Cloud Function.
     */
    async fetchAvailableModels(): Promise<{ id: string; name: string }[]> {
        try {
            const fn = httpsCallable(functions, 'fetchOpenRouterModels');
            const result = await fn();
            const data = result.data as { models: { id: string, name: string }[] };
            return data.models || [];
        } catch (error) {
            console.error("[OpenRouter] Failed to fetch models:", error);
            // Fallback to direct public fetch if Cloud Function fails/not-auth
            try {
                const response = await fetch('https://openrouter.ai/api/v1/models');
                if (!response.ok) return [];
                const data = await response.json();
                return (data.data || []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
            } catch {
                return [];
            }
        }
    },

    /**
     * Direct call to OpenRouter via Cloud Function.
     */
    async call(model: string, messages: any[], config: any = {}, task?: string): Promise<string> {
        const fn = httpsCallable(functions, 'callOpenRouter');
        const result = await fn({ model, messages, config, task });
        const data = result.data as { success: boolean, text: string };
        return data.text || "";
    }
};
