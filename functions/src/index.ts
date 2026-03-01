import * as functions from "firebase-functions/v1";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
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
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

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

const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://pawprint-50.web.app",
    "https://pawprint-50.firebaseapp.com",
    "https://pawprintfind.com", // Add your custom domain if applicable
    "https://www.pawprintfind.com"
];

const ON_CALL_CONFIG = {
    cors: ALLOWED_ORIGINS,
    region: "us-central1",
    maxInstances: 10,
};

// --- OpenRouter Exports (Gen 2) ---

export const callOpenRouter = onCall({
    ...ON_CALL_CONFIG,
    secrets: [openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { model, messages, config, task } = request.data;
    try {
        return await callOpenRouterAI(request.auth.uid, model, messages, config, task, openRouterApiKey.value());
    } catch (error: any) {
        console.error(`OpenRouter Error [${task}]:`, error);
        throw new HttpsError("internal", error.message || "OpenRouter call failed.");
    }
});

export const fetchOpenRouterModels = onCall({
    ...ON_CALL_CONFIG,
    secrets: [openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
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
        console.error(`[AI Error] Gemini API Key missing for task: ${featureName}`);
        throw new HttpsError(
            "failed-precondition",
            "Gemini API Key is not configured in Secrets."
        );
    }

    const client = new GoogleGenAI({ apiKey });

    // Config handling for new SDK
    const modelParams: any = {
        model: modelName,
    };
    if (config.systemInstruction) modelParams.systemInstruction = config.systemInstruction;
    if (config.tools) modelParams.tools = config.tools;
    if (config.toolConfig) modelParams.toolConfig = config.toolConfig;

    const generationConfig: any = { ...config };
    delete generationConfig.systemInstruction;
    delete generationConfig.tools;
    delete generationConfig.toolConfig;

    try {
        const model = (client as any).getGenerativeModel(modelParams);

        const result = await model.generateContent({
            contents,
            config: generationConfig
        });

        const response = result.response;
        const text = response.text();

        trackUsage(userId, featureName, 'google').catch(err =>
            console.error(`Failed to track usage for ${featureName}:`, err)
        );

        return {
            success: true,
            text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
        };
    } catch (error: any) {
        console.error(`Gemini API Error [${featureName}]:`, error);
        // Ensure we never throw a raw error that could leak internal details or cause 'internal' without context
        throw new HttpsError(
            "internal",
            `AI Error during ${featureName}: ${error.message || 'Unknown error'}`
        );
    }
}

/**
 * Vision-based pet identification and details extraction (Gen 2).
 */
export const visionIdentification = onCall({
    ...ON_CALL_CONFIG,
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
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { query } = request.data;
    if (!query) throw new HttpsError("invalid-argument", "Query required.");

    // Handle 'ping' query for connectivity checks
    if (query === 'ping') {
        return { success: true, message: "pong" };
    }

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
    ...ON_CALL_CONFIG,
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
    ...ON_CALL_CONFIG,
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
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const { model, contents, config } = request.data;

    return callAI(
        request.auth.uid,
        "generic",
        contents,
        { ...config, modelOverride: model }
    );
});

// Firestore Triggers (re-exported)
export { onUserCreated, onStripePaymentSuccess, onSubscriptionChange } from './triggers';

// ---------------------------------------------------------------------------
// STRIPE INTEGRATION
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe Checkout session for one-off donations.
 * Requires STRIPE_SECRET_KEY to be set in Firebase Functions secrets.
 * Run: firebase functions:secrets:set STRIPE_SECRET_KEY
 */
export const createDonationCheckout = onCall({
    ...ON_CALL_CONFIG,
    secrets: [stripeSecretKey],
}, async (request) => {
    if (!stripeSecretKey.value()) {
        throw new HttpsError("failed-precondition", "Stripe is not configured on the server.");
    }

    const { amount, donationId, donorEmail, donorName } = request.data;

    if (!amount || amount < 1) {
        throw new HttpsError("invalid-argument", "Amount must be at least 1 EUR.");
    }

    try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2026-01-28.clover' as const });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Support PawPrint Project',
                        description: 'One-time donation to help find lost pets worldwide.',
                        images: ['https://pawprint-50.web.app/icon-512.png'],
                    },
                    unit_amount: Math.round(amount * 100), // Convert to cents
                },
                quantity: 1,
            }],
            customer_email: donorEmail || undefined,
            success_url: `https://pawprint-50.web.app/payment-success?session_id={CHECKOUT_SESSION_ID}&donationId=${donationId}`,
            cancel_url: `https://pawprint-50.web.app/donors`,
            metadata: {
                donationId: donationId || '',
                donorName: donorName || 'Anonymous',
                source: 'pawprint_webapp',
            },
        });

        return { id: session.id, url: session.url };
    } catch (error: any) {
        console.error("[Stripe] createDonationCheckout error:", error);
        throw new HttpsError("internal", `Stripe error: ${error.message}`);
    }
});

/**
 * Stripe Webhook handler — confirms payment and marks donation as paid.
 * URL: https://us-central1-pawprint-50.cloudfunctions.net/stripeWebhook
 * Register this in Stripe Dashboard → Webhooks → Add endpoint.
 * Events to listen: checkout.session.completed, payment_intent.succeeded
 */
export const stripeWebhook = onRequest({
    cors: false, // Stripe sends raw POST, no preflight needed
    region: "us-central1",
    secrets: [stripeSecretKey, stripeWebhookSecret],
}, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const sig = req.headers['stripe-signature'];
    if (!sig || !stripeWebhookSecret.value()) {
        res.status(400).send('Missing Stripe signature or webhook secret.');
        return;
    }

    try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2026-01-28.clover' as const });
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value());

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            const donationId = session.metadata?.donationId;
            const amountTotal = session.amount_total; // in cents

            if (donationId) {
                const donationRef = admin.firestore().collection('donations').doc(donationId);
                await donationRef.set({
                    status: 'paid',
                    approved: true,
                    numericValue: (amountTotal || 0) / 100,
                    stripeSessionId: session.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`[Stripe Webhook] Donation ${donationId} confirmed as paid.`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('[Stripe Webhook] Error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
