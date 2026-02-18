import * as functions from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";
import { trackUsage } from "./usage";
import { checkQuota } from "./rateLimit";
import * as Prompts from "./prompts";
import { callOpenRouterAI, fetchOpenRouterModels as fetchOpenRouterModelsHelper } from "./openRouter";

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const openRouterApiKey = defineSecret("OPENROUTER_API_KEY");

/**
 * Resolves the active AI provider and model for a given task.
 */
async function resolveAIConfig(task: string) {
    try {
        const doc = await admin.firestore().collection('system_config').doc('ai_settings').get();
        if (doc.exists) {
            const data = doc.data();
            const provider = data?.activeProvider || 'google'; // 'google' or 'openrouter'
            const model = data?.modelMapping?.[task] || (provider === 'google' ? 'gemini-2.5-flash' : 'openai/gpt-4o-mini');
            return { provider, model };
        }
    } catch (e) {
        console.warn("Failed to resolve AI config, defaulting to Google/Gemini:", e);
    }
    return { provider: 'google', model: 'gemini-2.5-flash' };
}

/**
 * Universal AI Caller that routes to the active provider.
 */
async function callAI(
    userId: string,
    featureName: string,
    contents: any, // Standardized parts array for Gemini, or messages array for OpenRouter
    config: any = {},
    taskOverride?: string
) {
    const { provider, model } = await resolveAIConfig(taskOverride || featureName);
    
    if (provider === 'openrouter') {
        // Convert Gemini contents to OpenRouter messages if needed
        let messages = contents;
        if (contents.parts) {
            messages = [{ role: 'user', content: contents.parts[0].text }];
            // Handle image if present
            if (contents.parts.find((p: any) => p.inlineData)) {
                const imgPart = contents.parts.find((p: any) => p.inlineData);
                messages = [{
                    role: 'user',
                    content: [
                        { type: 'text', text: contents.parts.find((p: any) => p.text).text },
                        { type: 'image_url', image_url: { url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` } }
                    ]
                }];
            }
        }
        
        return callOpenRouterAI(userId, model, messages, config, featureName, openRouterApiKey.value());
    } else {
        return callGeminiAI(userId, featureName, model, contents, config, geminiApiKey.value());
    }
}

// --- OpenRouter Exports (Gen 2) ---

export const callOpenRouter = onCall({
    cors: true,
    region: "us-central1",
    secrets: [openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { model, messages, config, task } = request.data;
    return callOpenRouterAI(request.auth.uid, model, messages, config, task, openRouterApiKey.value());
});

export const fetchOpenRouterModels = onCall({
    cors: true,
    region: "us-central1",
    secrets: [openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    // Temporarily set the secret in process.env so the helper can find it if needed, 
    // though the helper should ideally be updated to accept it.
    process.env.OPENROUTER_API_KEY = openRouterApiKey.value();
    const result = await fetchOpenRouterModelsHelper();
    return result;
});

/**
 * Shared helper to call Gemini AI (using new SDK) and track usage.
 */
async function callGeminiAI(
    userId: string,
    featureName: string,
    modelName: string,
    contents: any,
    config: any = {},
    apiKey: string
) {
    // 1. Check Quota
    const quotaCheck = await checkQuota(userId, featureName);
    if (!quotaCheck.allowed) {
        throw new HttpsError(
            "resource-exhausted",
            quotaCheck.reason || "Daily quota exceeded."
        );
    }

    if (!apiKey) {
        throw new HttpsError(
            "failed-precondition",
            "Gemini API Key is not configured."
        );
    }

    const client = new GoogleGenAI({ apiKey });
    
    // Config handling for new SDK
    // Extract model-level params
    const modelParams: any = {
        model: modelName,
    };
    if (config.systemInstruction) modelParams.systemInstruction = config.systemInstruction;
    if (config.tools) modelParams.tools = config.tools;
    if (config.toolConfig) modelParams.toolConfig = config.toolConfig;

    // Remaining config goes to generationConfig (temperature, thinking, speech, etc.)
    const generationConfig: any = { ...config };
    delete generationConfig.systemInstruction;
    delete generationConfig.tools;
    delete generationConfig.toolConfig;

    try {
        const model = client.getGenerativeModel(modelParams);
        
        const result = await model.generateContent({
            contents,
            config: generationConfig
        });
        
        const response = result.response;
        const text = response.text();

        // Track usage asynchronously
        trackUsage(userId, featureName, 'google').catch(err => 
            console.error(`Failed to track usage for ${featureName}:`, err)
        );

        return {
            success: true,
            text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
            // audioData is less common in new SDK response structure directly, handle if needed
        };
    } catch (error: any) {
        console.error(`Gemini API Error [${featureName}]:`, error);
        throw new HttpsError(
            "internal",
            error.message || `An error occurred during ${featureName}.`
        );
    }
}

/**
 * Vision-based pet identification and details extraction (Gen 2).
 */
export const visionIdentification = onCall({
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required.");
    }

    const { image, task, locale = 'en' } = request.data;
    if (!image) {
        throw new HttpsError("invalid-argument", "Image required.");
    }

    let prompt = "";
    let schema: any = null;

    if (task === 'autofill') {
        prompt = Prompts.getAutoFillPetDetailsPrompt(locale);
        schema = {
            type: "object",
            properties: {
                breed: { type: "string" },
                color: { type: "string" },
                age: { type: "string" },
                size: { type: "string" },
                gender: { type: "string" }
            },
            required: ["breed", "color", "size"]
        };
    } else if (task === 'identikit') {
        prompt = Prompts.getPetIdentikitPrompt(locale);
        schema = {
            type: "object",
            properties: {
                visualIdentityCode: { type: "string" },
                physicalDescription: { type: "string" }
            },
            required: ["visualIdentityCode", "physicalDescription"]
        };
    } else {
        prompt = "Describe this pet in detail.";
    }

    const contents = {
        parts: [
            { inlineData: { data: image, mimeType: "image/jpeg" } },
            { text: prompt }
        ]
    };

    const config: any = {};
    if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
    }

    return callAI(request.auth.uid, "visionIdentification", contents, config);
});

/**
 * Smart natural language search parsing (Gen 2).
 */
export const smartSearch = onCall({
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { query } = request.data;
    if (!query) throw new HttpsError("invalid-argument", "Query required.");

    const prompt = Prompts.getSearchParsingPrompt(query);
    const contents = { parts: [{ text: prompt }] };

    return callAI(
        request.auth.uid,
        "smartSearch",
        contents,
        { responseMimeType: "application/json" }
    );
});

/**
 * AI-powered preliminary health assessment (Gen 2).
 */
export const healthAssessment = onCall({
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { pet, symptoms, locale = 'en' } = request.data;
    if (!pet || !symptoms) throw new HttpsError("invalid-argument", "Pet and symptoms required.");

    const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
    const contents = { parts: [{ text: userPrompt }] };

    return callAI(
        request.auth.uid,
        "healthAssessment",
        contents,
        { systemInstruction }
    );
});

/**
 * AI blog post generation (Gen 2).
 */
export const blogGeneration = onCall({
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    
    const { topic } = request.data;
    if (!topic) throw new HttpsError("invalid-argument", "Topic required.");

    const { systemInstruction, userPrompt } = Prompts.getBlogGenerationParts(topic);
    const contents = { parts: [{ text: userPrompt }] };

    return callAI(
        request.auth.uid,
        "blogGeneration",
        contents,
        {
            systemInstruction,
            responseMimeType: "application/json"
        }
    );
});

// Legacy generic function (Gen 2)
export const callGemini = onCall({
    cors: true,
    region: "us-central1",
    maxInstances: 5,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { model, contents, config } = request.data;
    
    // We keep this named callGemini for compatibility but route it through callAI 
    // to benefit from the global provider switch if needed, or force google if desired.
    return callAI(
        request.auth.uid, 
        "generic", 
        contents, 
        { ...config, modelOverride: model }
    );
});

// Firestore Triggers (re-exported)
export { onUserCreated, onStripePaymentSuccess, onSubscriptionChange } from './triggers';
