/**
 * DEPRECATED: Direct client-side calls to OpenRouter are disabled for security.
 * Use aiBridgeService which routes through Cloud Functions to keep API keys secure.
 */

export const openRouterService = {
    fetchAvailableModels: async () => {
        console.warn("[DEPRECATED] openRouterService.fetchAvailableModels called. Use Cloud Functions instead.");
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models');
            if (!response.ok) return [];
            const data = await response.json();
            return (data.data || []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
        } catch {
            return [];
        }
    }
};
