import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { trackUsage } from "./usage";
import { checkQuota } from "./rateLimit";
import * as Prompts from "./prompts";
import { callOpenRouterAI, fetchOpenRouterModels as fetchOpenRouterModelsHelper } from "./openRouter";

admin.initializeApp();

// --- OpenRouter Exports ---

export const callOpenRouter = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { model, messages, config, task } = data;
    return callOpenRouterAI(context.auth.uid, model, messages, config, task);
});

export const fetchOpenRouterModels = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    return fetchOpenRouterModelsHelper();
});

/**
 * Shared helper to call Gemini AI and track usage.
 */
async function callGeminiAI(
    userId: string,
    featureName: string,
    modelName: string,
    contents: any,
    config: any = {}
) {
    // 1. Check Quota
    const quotaCheck = await checkQuota(userId, featureName);
    if (!quotaCheck.allowed) {
        throw new functions.https.HttpsError(
            "resource-exhausted",
            quotaCheck.reason || "Daily quota exceeded."
        );
    }

    const apiKey = process.env.GEMINI_API_KEY || (functions.config().gemini as any)?.key;
    if (!apiKey) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Gemini API Key is not configured."
        );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent({ contents, ...config });
        const response = await result.response;
        const text = response.text();

        // Track usage asynchronously
        trackUsage(userId, featureName, 'google').catch(err => 
            console.error(`Failed to track usage for ${featureName}:`, err)
        );

        return {
            success: true,
            text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
            audioData: response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
        };
    } catch (error: any) {
        console.error(`Gemini API Error [${featureName}]:`, error);
        throw new functions.https.HttpsError(
            "internal",
            error.message || `An error occurred during ${featureName}.`
        );
    }
}

/**
 * Vision-based pet identification and details extraction.
 */
export const visionIdentification = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    }

    const { image, task, locale = 'en' } = data;
    if (!image) {
        throw new functions.https.HttpsError("invalid-argument", "Image required.");
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

    return callGeminiAI(
        context.auth.uid,
        "visionIdentification",
        "gemini-2.0-pro-vision",
        contents,
        config
    );
});

/**
 * Smart natural language search parsing.
 */
export const smartSearch = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { query } = data;
    if (!query) throw new functions.https.HttpsError("invalid-argument", "Query required.");

    const prompt = Prompts.getSearchParsingPrompt(query);
    const contents = { parts: [{ text: prompt }] };

    return callGeminiAI(
        context.auth.uid,
        "smartSearch",
        "gemini-2.5-flash",
        contents,
        {
            responseMimeType: "application/json"
        }
    );
});

/**
 * AI-powered preliminary health assessment.
 */
export const healthAssessment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { pet, symptoms, locale = 'en' } = data;
    if (!pet || !symptoms) throw new functions.https.HttpsError("invalid-argument", "Pet and symptoms required.");

    const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
    const contents = { parts: [{ text: userPrompt }] };

    return callGeminiAI(
        context.auth.uid,
        "healthAssessment",
        "gemini-2.5-pro",
        contents,
        { systemInstruction }
    );
});

/**
 * AI blog post generation.
 */
export const blogGeneration = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { topic } = data;
    if (!topic) throw new functions.https.HttpsError("invalid-argument", "Topic required.");

    const { systemInstruction, userPrompt } = Prompts.getBlogGenerationParts(topic);
    const contents = { parts: [{ text: userPrompt }] };

    return callGeminiAI(
        context.auth.uid,
        "blogGeneration",
        "gemini-2.5-pro",
        contents,
        {
            systemInstruction,
            responseMimeType: "application/json"
        }
    );
});

// Legacy generic function (keep for backward compatibility during transition if needed, but we'll remove it later)
export const callGemini = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { model, contents, config } = data;
    return callGeminiAI(context.auth.uid, "generic", model, contents, config);
});

// Firestore Triggers (re-exported)
export { onUserCreated, onStripePaymentSuccess, onSubscriptionChange } from './triggers';