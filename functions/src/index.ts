import * as functions from "firebase-functions/v1";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
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
const genesisKeyHash = defineSecret("GENESIS_KEY_HASH");

/**
 * Resolves the active AI provider and model for a given task.
 */
async function resolveAIConfig(task: string) {
    try {
        const doc = await admin.firestore().collection('system_config').doc('ai_settings').get();
        if (doc.exists) {
            const data = doc.data();
            const provider = data?.provider || 'google'; // 'google' or 'openrouter'
            const fallbackToGemini = data?.fallbackToGemini ?? true;
            const model = data?.modelMapping?.[task] || (provider === 'google' ? 'gemini-2.0-flash' : 'google/gemini-2.0-flash-exp:free');
            return { provider, model, fallbackToGemini };
        }
    } catch (e) {
        console.warn("Failed to resolve AI config, defaulting to Google/Gemini:", e);
    }
    return { provider: 'google', model: 'gemini-2.0-flash', fallbackToGemini: true };
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
    const { provider, model, fallbackToGemini } = await resolveAIConfig(taskOverride || featureName);

    if (provider === 'openrouter') {
        // Convert Gemini contents to OpenRouter messages if needed
        let messages = contents;

        if (!Array.isArray(contents)) {
            // Case 1: Single turn Gemini format { parts: [...] }
            if (contents.parts) {
                const textPart = contents.parts.find((p: any) => p.text);
                const imgPart = contents.parts.find((p: any) => p.inlineData);

                if (imgPart) {
                    messages = [{
                        role: 'user',
                        content: [
                            { type: 'text', text: textPart?.text || "" },
                            { type: 'image_url', image_url: { url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` } }
                        ]
                    }];
                } else {
                    messages = [{ role: 'user', content: textPart?.text || "" }];
                }
            }
        } else {
            // Case 2: Multi-turn or already OpenRouter format
            // If it has 'parts', it's Gemini format [{ role: 'user', parts: [...] }, ...]
            if (contents.length > 0 && contents[0].parts) {
                messages = contents.map((c: any) => ({
                    role: c.role === 'model' ? 'assistant' : 'user',
                    content: c.parts?.[0]?.text || ""
                }));
            }
        }

        try {
            return await callOpenRouterAI(userId, model, messages, config, featureName, openRouterApiKey.value());
        } catch (error) {
            if (fallbackToGemini) {
                console.warn(`OpenRouter failed for ${featureName}, falling back to Gemini...`, error);
                return callGeminiAI(userId, featureName, 'gemini-2.0-flash', contents, config, geminiApiKey.value());
            }
            throw error;
        }
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

    // SECURITY: Validate inputs to prevent injection into the OpenRouter request body.
    if (typeof model !== 'string' || model.length > 200) {
        throw new HttpsError("invalid-argument", "Invalid model identifier.");
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
        throw new HttpsError("invalid-argument", "Messages must be a non-empty array (max 50).");
    }
    // Only allow a safe subset of config keys to prevent injection
    const allowedConfigKeys = new Set(['max_tokens', 'temperature', 'top_p', 'response_format']);
    if (config && typeof config === 'object') {
        for (const k of Object.keys(config)) {
            if (!allowedConfigKeys.has(k)) {
                throw new HttpsError("invalid-argument", `Unsupported config key: ${k}`);
            }
        }
    }

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

    // SECURITY: Blog generation is an admin-only capability. Enforce server-side
    // to prevent any authenticated user from abusing AI quota for blog posts.
    const token = request.auth.token as Record<string, unknown>;
    const isAdmin =
        token.role === 'super_admin' ||
        token.role === 'admin' ||
        token.admin === true ||
        token.super_admin === true;
    if (!isAdmin) {
        throw new HttpsError("permission-denied", "Admin access required for blog generation.");
    }

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
// ADMIN KEY VERIFICATION — Server-side only (genesis hash never leaves server)
// ---------------------------------------------------------------------------

/**
 * Verifies an admin key server-side.
 * The genesis hash is stored as a Firebase Secret (GENESIS_KEY_HASH) — it is
 * NOT shipped in the client JS bundle. All issued keys are verified against
 * the Firestore admin_keys collection using the Admin SDK, which bypasses
 * client-facing Firestore rules entirely.
 */
export const verifyAdminKey = onCall({
    ...ON_CALL_CONFIG,
    secrets: [genesisKeyHash],
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { key } = request.data;
    if (!key || typeof key !== 'string' || key.length > 512) {
        throw new HttpsError("invalid-argument", "Invalid key format.");
    }

    // Hash the submitted key server-side using Node's built-in crypto
    const { createHash } = await import('crypto');
    const hashHex = createHash('sha256').update(key, 'utf8').digest('hex');

    // 1. Check against genesis key hash (stored only in Firebase Secret)
    const storedGenesisHash = genesisKeyHash.value();
    if (storedGenesisHash && hashHex === storedGenesisHash) {
        return { valid: true, type: 'GENESIS' };
    }

    // 2. Check against issued keys in Firestore (Admin SDK — bypasses client rules)
    const snapshot = await admin.firestore()
        .collection('admin_keys')
        .where('keyHash', '==', hashHex)
        .where('status', '==', 'active')
        .get();

    if (!snapshot.empty) {
        return { valid: true, type: 'ISSUED', keyDocId: snapshot.docs[0].id };
    }

    return { valid: false, type: 'GENESIS' };
});

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

/**
 * onSightingEventCreated — triggered when petService writes to sighting_events.
 * Finds the pet owner's UID by email, then writes an in-app notification to
 * user_notifications/{ownerUid}/items/{notifId}.
 * Optionally sends an FCM push if the owner has registered FCM tokens.
 */
export const onSightingEventCreated = onDocumentCreated(
    { document: "sighting_events/{eventId}", region: "us-central1" },
    async (event) => {
        const data = event.data?.data();
        if (!data) return;

        const { petId, petName, petPhotoUrl, ownerEmail, finderEmail, location, notes } = data;

        if (!ownerEmail || !petId) {
            console.warn("[onSightingEventCreated] Missing ownerEmail or petId — skipping.");
            return;
        }

        // 1. Look up the pet owner's UID by email
        const usersSnap = await admin.firestore()
            .collection("users")
            .where("email", "==", ownerEmail)
            .limit(1)
            .get();

        if (usersSnap.empty) {
            console.warn(`[onSightingEventCreated] No user found for email ${ownerEmail}`);
            return;
        }

        const ownerDoc = usersSnap.docs[0];
        const ownerUid = ownerDoc.id;
        const ownerData = ownerDoc.data();

        // 2. Write in-app notification
        const locationLabel = location?.address
            ? location.address
            : (location?.latitude ? `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})` : "an unknown location");

        const notifRef = admin.firestore()
            .collection("user_notifications")
            .doc(ownerUid)
            .collection("items")
            .doc();

        await notifRef.set({
            type: "sighting",
            title: `${petName} was spotted!`,
            body: notes
                ? `Someone saw ${petName} near ${locationLabel}: "${notes}"`
                : `Someone spotted ${petName} near ${locationLabel}.`,
            petId,
            petName,
            petPhotoUrl: petPhotoUrl ?? null,
            timestamp: Date.now(),
            read: false,
        });

        console.log(`[onSightingEventCreated] Notification written for owner ${ownerUid} (pet: ${petName})`);

        // 3. Send FCM push if owner has registered tokens
        const fcmTokens: string[] = ownerData?.fcmTokens ?? [];
        if (fcmTokens.length === 0) return;

        const validTokens: string[] = [];
        const failedTokens: string[] = [];

        await Promise.allSettled(
            fcmTokens.map(async (token) => {
                try {
                    await admin.messaging().send({
                        token,
                        notification: {
                            title: `🐾 ${petName} was spotted!`,
                            body: notes
                                ? `Near ${locationLabel}: "${notes}"`
                                : `Someone spotted ${petName} near ${locationLabel}.`,
                            imageUrl: petPhotoUrl ?? undefined,
                        },
                        webpush: {
                            fcmOptions: {
                                link: `${process.env.APP_BASE_URL ?? "https://pawprint-50.web.app"}/p/${petId}`,
                            },
                        },
                    });
                    validTokens.push(token);
                } catch (err: any) {
                    if (err.code === "messaging/registration-token-not-registered") {
                        failedTokens.push(token);
                    } else {
                        console.warn("[onSightingEventCreated] FCM send error:", err.message);
                    }
                }
            })
        );

        // Clean up stale tokens
        if (failedTokens.length > 0) {
            const remaining = fcmTokens.filter(t => !failedTokens.includes(t));
            await ownerDoc.ref.update({ fcmTokens: remaining });
            console.log(`[onSightingEventCreated] Removed ${failedTokens.length} stale FCM token(s) for ${ownerUid}`);
        }
    }
);
