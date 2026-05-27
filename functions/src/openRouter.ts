import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { trackUsage } from "./usage";

/**
 * Transforms Gemini-formatted content to OpenRouter (OpenAI-compatible) messages.
 */
export const transformGeminiToOpenRouter = (contents: any): any[] => {
    // If it's already an array, assume it's already in message format
    if (Array.isArray(contents)) {
        return contents.map(item => {
            if (item.role && item.parts) {
                // Gemini multi-turn format
                const role = item.role === 'model' ? 'assistant' : 'user';
                const text = item.parts.find((p: any) => p.text)?.text || "";
                return { role, content: text };
            }
            return item;
        });
    }

    // Gemini parts format
    if (contents.parts) {
        const messages: any[] = [];
        const textPart = contents.parts.find((p: any) => p.text);
        const imgPart = contents.parts.find((p: any) => p.inlineData);

        if (imgPart) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: textPart?.text || "Describe this image." },
                    { type: 'image_url', image_url: { url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` } }
                ]
            });
        } else if (textPart) {
            messages.push({ role: 'user', content: textPart.text });
        }

        return messages;
    }

    return [];
};

const getOpenRouterKey = async () => {
    // Try to get from Firestore system_config
    try {
        const doc = await admin.firestore().collection('system_config').doc('ai_settings').get();
        if (doc.exists) {
            const data = doc.data();
            return data?.apiKeys?.openrouter;
        }
    } catch (e) {
        console.error("Error fetching AI settings:", e);
    }
    // Fallback to env var
    return process.env.OPENROUTER_API_KEY;
};

export const callOpenRouterAI = async (
    userId: string,
    model: string,
    messages: any[],
    config: any = {},
    task?: string,
    overrideApiKey?: string
) => {
    // Use provided API key for testing, or fetch from config
    const apiKey = overrideApiKey || await getOpenRouterKey();
    if (!apiKey) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "OpenRouter API Key is not configured."
        );
    }

    // Resolve model if not provided or if it's a task alias
    let targetModel = model;
    if (task) {
        // Fetch mapping from settings
        try {
            const doc = await admin.firestore().collection('system_config').doc('ai_settings').get();
            if (doc.exists) {
                const mapping = doc.data()?.modelMapping;
                if (mapping && mapping[task]) {
                    targetModel = mapping[task];
                }
            }
        } catch (e) {
            console.warn("Failed to resolve task model mapping:", e);
        }
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://pawprint.ai", // Required by OpenRouter
                "X-Title": "Paw Print"
            },
            body: JSON.stringify({
                model: targetModel,
                messages: messages,
                ...config
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        // Track usage
        trackUsage(userId, task || 'openrouter_generic', 'openrouter').catch(console.error);

        return {
            success: true,
            text: data.choices?.[0]?.message?.content || "",
            data: data
        };
    } catch (error: any) {
        console.error("OpenRouter Call Failed:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
};

export const fetchOpenRouterModels = async () => {
    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
         throw new functions.https.HttpsError(
            "failed-precondition",
            "OpenRouter API Key is not configured."
        );
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            }
        });
        
        if (!response.ok) throw new Error("Failed to fetch models");
        
        const data = await response.json();
        return {
            models: data.data.map((m: any) => ({
                id: m.id,
                name: m.name || m.id
            }))
        };
    } catch (error: any) {
         throw new functions.https.HttpsError("internal", error.message);
    }
};
