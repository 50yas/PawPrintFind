"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createDonationCheckout = exports.onSubscriptionChange = exports.onStripePaymentSuccess = exports.onUserCreated = exports.callGemini = exports.blogGeneration = exports.healthAssessment = exports.smartSearch = exports.visionIdentification = exports.fetchOpenRouterModels = exports.callOpenRouter = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const params_1 = require("firebase-functions/params");
const usage_1 = require("./usage");
const rateLimit_1 = require("./rateLimit");
const Prompts = __importStar(require("./prompts"));
const openRouter_1 = require("./openRouter");
admin.initializeApp();
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const openRouterApiKey = (0, params_1.defineSecret)("OPENROUTER_API_KEY");
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const stripeWebhookSecret = (0, params_1.defineSecret)("STRIPE_WEBHOOK_SECRET");
async function resolveAIConfig(task) {
    try {
        const doc = await admin.firestore().collection('system_config').doc('ai_settings').get();
        if (doc.exists) {
            const data = doc.data();
            const provider = data?.activeProvider || 'google';
            const model = data?.modelMapping?.[task] || (provider === 'google' ? 'gemini-2.5-flash' : 'openai/gpt-4o-mini');
            return { provider, model };
        }
    }
    catch (e) {
        console.warn("Failed to resolve AI config, defaulting to Google/Gemini:", e);
    }
    return { provider: 'google', model: 'gemini-2.5-flash' };
}
async function callAI(userId, featureName, contents, config = {}, taskOverride) {
    const { provider, model } = await resolveAIConfig(taskOverride || featureName);
    if (provider === 'openrouter') {
        let messages = contents;
        if (contents.parts) {
            messages = [{ role: 'user', content: contents.parts[0].text }];
            if (contents.parts.find((p) => p.inlineData)) {
                const imgPart = contents.parts.find((p) => p.inlineData);
                messages = [{
                        role: 'user',
                        content: [
                            { type: 'text', text: contents.parts.find((p) => p.text).text },
                            { type: 'image_url', image_url: { url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` } }
                        ]
                    }];
            }
        }
        return (0, openRouter_1.callOpenRouterAI)(userId, model, messages, config, featureName, openRouterApiKey.value());
    }
    else {
        return callGeminiAI(userId, featureName, model, contents, config, geminiApiKey.value());
    }
}
const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://pawprint-50.web.app",
    "https://pawprint-50.firebaseapp.com",
    "https://pawprintfind.com",
    "https://www.pawprintfind.com"
];
const ON_CALL_CONFIG = {
    cors: ALLOWED_ORIGINS,
    region: "us-central1",
    maxInstances: 10,
};
exports.callOpenRouter = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [openRouterApiKey],
}, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    const { model, messages, config, task } = request.data;
    try {
        return await (0, openRouter_1.callOpenRouterAI)(request.auth.uid, model, messages, config, task, openRouterApiKey.value());
    }
    catch (error) {
        console.error(`OpenRouter Error [${task}]:`, error);
        throw new https_1.HttpsError("internal", error.message || "OpenRouter call failed.");
    }
});
exports.fetchOpenRouterModels = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [openRouterApiKey],
}, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    process.env.OPENROUTER_API_KEY = openRouterApiKey.value();
    const result = await (0, openRouter_1.fetchOpenRouterModels)();
    return result;
});
async function callGeminiAI(userId, featureName, modelName, contents, config = {}, apiKey) {
    const quotaCheck = await (0, rateLimit_1.checkQuota)(userId, featureName);
    if (!quotaCheck.allowed) {
        throw new https_1.HttpsError("resource-exhausted", quotaCheck.reason || "Daily quota exceeded.");
    }
    if (!apiKey) {
        console.error(`[AI Error] Gemini API Key missing for task: ${featureName}`);
        throw new https_1.HttpsError("failed-precondition", "Gemini API Key is not configured in Secrets.");
    }
    const client = new genai_1.GoogleGenAI({ apiKey });
    const modelParams = {
        model: modelName,
    };
    if (config.systemInstruction)
        modelParams.systemInstruction = config.systemInstruction;
    if (config.tools)
        modelParams.tools = config.tools;
    if (config.toolConfig)
        modelParams.toolConfig = config.toolConfig;
    const generationConfig = { ...config };
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
        (0, usage_1.trackUsage)(userId, featureName, 'google').catch(err => console.error(`Failed to track usage for ${featureName}:`, err));
        return {
            success: true,
            text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
        };
    }
    catch (error) {
        console.error(`Gemini API Error [${featureName}]:`, error);
        throw new https_1.HttpsError("internal", `AI Error during ${featureName}: ${error.message || 'Unknown error'}`);
    }
}
exports.visionIdentification = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    }
    const { image, task, locale = 'en' } = request.data;
    if (!image) {
        throw new https_1.HttpsError("invalid-argument", "Image required.");
    }
    let prompt = "";
    let schema = null;
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
    }
    else if (task === 'identikit') {
        prompt = Prompts.getPetIdentikitPrompt(locale);
        schema = {
            type: "object",
            properties: {
                visualIdentityCode: { type: "string" },
                physicalDescription: { type: "string" }
            },
            required: ["visualIdentityCode", "physicalDescription"]
        };
    }
    else {
        prompt = "Describe this pet in detail.";
    }
    const contents = {
        parts: [
            { inlineData: { data: image, mimeType: "image/jpeg" } },
            { text: prompt }
        ]
    };
    const config = {};
    if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
    }
    return callAI(request.auth.uid, "visionIdentification", contents, config);
});
exports.smartSearch = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    const { query } = request.data;
    if (!query)
        throw new https_1.HttpsError("invalid-argument", "Query required.");
    if (query === 'ping') {
        return { success: true, message: "pong" };
    }
    const prompt = Prompts.getSearchParsingPrompt(query);
    const contents = { parts: [{ text: prompt }] };
    return callAI(request.auth.uid, "smartSearch", contents, { responseMimeType: "application/json" });
});
exports.healthAssessment = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    const { pet, symptoms, locale = 'en' } = request.data;
    if (!pet || !symptoms)
        throw new https_1.HttpsError("invalid-argument", "Pet and symptoms required.");
    const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms, locale);
    const contents = { parts: [{ text: userPrompt }] };
    return callAI(request.auth.uid, "healthAssessment", contents, { systemInstruction });
});
exports.blogGeneration = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    const { topic } = request.data;
    if (!topic)
        throw new https_1.HttpsError("invalid-argument", "Topic required.");
    const { systemInstruction, userPrompt } = Prompts.getBlogGenerationParts(topic);
    const contents = { parts: [{ text: userPrompt }] };
    return callAI(request.auth.uid, "blogGeneration", contents, {
        systemInstruction,
        responseMimeType: "application/json"
    });
});
exports.callGemini = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [geminiApiKey, openRouterApiKey],
}, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Auth required.");
    const { model, contents, config } = request.data;
    return callAI(request.auth.uid, "generic", contents, { ...config, modelOverride: model });
});
var triggers_1 = require("./triggers");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return triggers_1.onUserCreated; } });
Object.defineProperty(exports, "onStripePaymentSuccess", { enumerable: true, get: function () { return triggers_1.onStripePaymentSuccess; } });
Object.defineProperty(exports, "onSubscriptionChange", { enumerable: true, get: function () { return triggers_1.onSubscriptionChange; } });
exports.createDonationCheckout = (0, https_1.onCall)({
    ...ON_CALL_CONFIG,
    secrets: [stripeSecretKey],
}, async (request) => {
    if (!stripeSecretKey.value()) {
        throw new https_1.HttpsError("failed-precondition", "Stripe is not configured on the server.");
    }
    const { amount, donationId, donorEmail, donorName } = request.data;
    if (!amount || amount < 1) {
        throw new https_1.HttpsError("invalid-argument", "Amount must be at least 1 EUR.");
    }
    try {
        const Stripe = (await Promise.resolve().then(() => __importStar(require('stripe')))).default;
        const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2026-01-28.clover' });
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
                        unit_amount: Math.round(amount * 100),
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
    }
    catch (error) {
        console.error("[Stripe] createDonationCheckout error:", error);
        throw new https_1.HttpsError("internal", `Stripe error: ${error.message}`);
    }
});
exports.stripeWebhook = (0, https_1.onRequest)({
    cors: false,
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
        const Stripe = (await Promise.resolve().then(() => __importStar(require('stripe')))).default;
        const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2026-01-28.clover' });
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value());
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const donationId = session.metadata?.donationId;
            const amountTotal = session.amount_total;
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
    }
    catch (error) {
        console.error('[Stripe Webhook] Error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map