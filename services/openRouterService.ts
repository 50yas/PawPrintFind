import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, ChatSession, AISettings } from '../types';
import * as Prompts from './prompts';

// Helper to call the Cloud Function
const callOpenRouterAI = async (
    model: string, 
    messages: any[], 
    config: any = {}, 
    task?: string // Optional task identifier for the backend to optimize/log
) => {
    const fn = httpsCallable(functions, 'callOpenRouter');
    const result = await fn({ model, messages, config, task });
    return result.data as { success: boolean, text: string, data?: any };
};

const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const analyzeImageForDescription = async (photo: File): Promise<string> => {
    try {
        const base64 = await fileToBase64(photo);
        // OpenRouter Vision model format (OpenAI compatible)
        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", text: Prompts.getImageDescriptionPrompt() },
                    { type: "image_url", image_url: { url: `data:${photo.type};base64,${base64}` } }
                ]
            }
        ];

        // We use a default vision model if not specified by the backend/settings, 
        // but typically the Cloud Function will resolve the model from settings.
        // We pass 'vision' task so the backend knows which mapping to use.
        const response = await callOpenRouterAI('vision', messages, {}, 'vision');
        return response.text || "No description generated.";
    } catch (error) {
        console.error("OpenRouter analyzeImage failed:", error);
        return "Analysis failed.";
    }
};

export const performAIHealthCheck = async (pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
    
    const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
    ];

    try {
        const response = await callOpenRouterAI('triage', messages, {}, 'triage');
        return response.text || "Health analysis unavailable.";
    } catch (error) {
        console.error("OpenRouter health check failed:", error);
        return "Health analysis failed.";
    }
};

export const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
    const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);

    const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
    ];

    try {
        const response = await callOpenRouterAI('chat', messages, {
            response_format: { type: "json_object" }
        }, 'chat');

        const parsed = JSON.parse(response.text?.trim() || "{}");
        return parsed.suggestions || [];
    } catch (error) {
        console.error("OpenRouter chat suggestions failed:", error);
        return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
    }
};

export const comparePets = async (foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> => {
    const { systemInstruction, userPrompt } = Prompts.getPetComparisonParts(foundPetDesc, lostPet);
    
    // Note: If lostPet has photos, we might want to include them in the prompt if the model supports vision.
    // For now, we rely on the text description and AI codes as per the prompt.
    // If we want to send images, we'd need to convert lostPet.photos to base64.
    
    const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
    ];

    try {
        const response = await callOpenRouterAI('matching', messages, {
             response_format: { type: "json_object" }
        }, 'matching');

        return JSON.parse(response.text?.trim() || "{}");
    } catch (error) {
        console.error("OpenRouter comparePets failed:", error);
        return { score: 0, reasoning: "Comparison failed.", keyMatches: [], discrepancies: [] };
    }
};

export const fetchAvailableModels = async (): Promise<{ id: string, name: string }[]> => {
    // This calls the backend to fetch models from OpenRouter
    const fn = httpsCallable(functions, 'fetchOpenRouterModels');
    try {
        const result = await fn({});
        return (result.data as any).models || [];
    } catch (error) {
        console.error("Failed to fetch OpenRouter models:", error);
        return [];
    }
};