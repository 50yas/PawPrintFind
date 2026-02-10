import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

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
    model: string,
    messages: any[],
    config: any = {},
    task?: string
) => {
    const apiKey = await getOpenRouterKey();
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
