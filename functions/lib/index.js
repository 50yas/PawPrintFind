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
exports.onSubscriptionChange = exports.onStripePaymentSuccess = exports.onUserCreated = exports.callGemini = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
admin.initializeApp();
exports.callGemini = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { model, contents, config } = data;
    if (!model || !contents) {
        throw new functions.https.HttpsError("invalid-argument", "Model and contents are required.");
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new functions.https.HttpsError("failed-precondition", "Gemini API Key is not configured on the server.");
    }
    try {
        const genAI = new genai_1.GoogleGenAI({ apiKey });
        const response = await genAI.models.generateContent({ model, contents, config });
        const text = response.text;
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return {
            success: true,
            text: text,
            groundingMetadata,
            audioData
        };
    }
    catch (error) {
        console.error("Gemini API Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "An error occurred while calling Gemini AI.");
    }
});
exports.onUserCreated = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snapshot, context) => {
    const userData = snapshot.data();
    const email = userData.email;
    const role = userData.activeRole || "owner";
    if (!email) {
        console.warn("User created without email, skipping welcome email.");
        return;
    }
    const isVet = role === "vet";
    const subject = isVet ? "Welcome Partner! 🏥" : "Welcome to Paw Print! 🐾";
    const PRIMARY_COLOR = "#0d9488";
    const BG_COLOR = "#f8fafc";
    const ownerContent = `
        <h2 style="color: ${PRIMARY_COLOR}; margin-top: 0;">Welcome to the Family</h2>
        <p>Thank you for joining <strong>Paw Print</strong>. You've taken the first step in securing your pet's safety using our advanced AI biometric system.</p>
        <h3>Next Steps:</h3>
        <ol>
            <li><strong>Create an Impronta:</strong> Upload photos of your pet to create their digital ID.</li>
            <li><strong>Tag Unique Marks:</strong> Help our AI by identifying scars or patterns.</li>
            <li><strong>Sleep Soundly:</strong> Know that our community is ready to help if the unthinkable happens.</li>
        </ol>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://pawprint-50.web.app/dashboard" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
        </div>
    `;
    const vetContent = `
        <h2 style="color: ${PRIMARY_COLOR}; margin-top: 0;">Welcome Partner Clinic</h2>
        <p>Thank you for joining the <strong>Paw Print Vet Network</strong>. You are now part of a technology-first approach to pet recovery and care.</p>
        <h3>Capabilities Unlocked:</h3>
        <ul>
            <li><strong>Digital Records:</strong> Manage patient history securely.</li>
            <li><strong>AI Assistant:</strong> Use our Gemini-powered tools for scheduling and triage.</li>
            <li><strong>Community Visibility:</strong> Local pet owners can now find you on our map.</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://pawprint-50.web.app/vetDashboard" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Vet Console</a>
        </div>
    `;
    const html = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${BG_COLOR}; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Paw<span style="color: ${PRIMARY_COLOR};">Print</span></h1>
                </div>
                <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
                    ${isVet ? vetContent : ownerContent}
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p>&copy; ${new Date().getFullYear()} Paw Print Open Source Project.</p>
                    <p>Building a safer world for pets with AI.</p>
                </div>
            </div>
        </div>
    `;
    try {
        await admin.firestore().collection("mail").add({
            to: [email],
            message: {
                subject: subject,
                html: html,
                text: html.replace(/<[^>]*>?/gm, ""),
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`📧 Welcome email queued for: ${email}`);
    }
    catch (error) {
        console.error("Error queueing welcome email:", error);
    }
});
exports.onStripePaymentSuccess = functions.firestore
    .document("customers/{uid}/payments/{paymentId}")
    .onWrite(async (change, context) => {
    const payment = change.after.data();
    if (!payment || payment.status !== "succeeded") {
        return;
    }
    const donationId = payment.metadata?.donationId;
    if (!donationId) {
        console.log("Payment succeeded but no donationId found in metadata. Skipping.");
        return;
    }
    console.log(`💰 Payment succeeded for Donation ID: ${donationId}. Updating status...`);
    try {
        const donationRef = admin.firestore().collection("donations").doc(donationId);
        const donationDoc = await donationRef.get();
        if (!donationDoc.exists) {
            console.warn(`Donation document ${donationId} not found.`);
            return;
        }
        const donationData = donationDoc.data();
        if (donationData?.status === 'paid') {
            console.log(`Donation ${donationId} is already marked as paid.`);
            return;
        }
        await donationRef.update({
            status: 'paid',
            approved: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            stripePaymentId: context.params.paymentId,
            amount_details: payment.amount_details || null
        });
        console.log(`✅ Donation ${donationId} marked as PAID and APPROVED.`);
    }
    catch (error) {
        console.error(`Error updating donation ${donationId}:`, error);
    }
});
exports.onSubscriptionChange = functions.firestore
    .document("customers/{uid}/subscriptions/{subscriptionId}")
    .onWrite(async (change, context) => {
    const subscription = change.after.data();
    const uid = context.params.uid;
    if (!subscription) {
        console.log(`🗑️ Subscription deleted for user ${uid}. Revoking access.`);
        await admin.firestore().collection("users").doc(uid).update({
            "subscription.status": "canceled",
            "subscription.currentPeriodEnd": admin.firestore.FieldValue.serverTimestamp()
        });
        return;
    }
    const status = subscription.status;
    const priceId = subscription.items?.[0]?.price?.id;
    const currentPeriodEnd = subscription.current_period_end?.seconds
        ? subscription.current_period_end.seconds * 1000
        : Date.now();
    console.log(`🔄 Subscription update for ${uid}: ${status} (${priceId})`);
    const planId = (status === 'active' || status === 'trialing') ? 'vet_pro' : 'vet_free';
    try {
        await admin.firestore().collection("users").doc(uid).set({
            subscription: {
                status: status,
                planId: planId,
                currentPeriodEnd: currentPeriodEnd,
                stripeSubscriptionId: context.params.subscriptionId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        console.log(`✅ User ${uid} subscription synced: ${status} -> ${planId}`);
    }
    catch (error) {
        console.error(`Error syncing subscription for ${uid}:`, error);
    }
});
//# sourceMappingURL=index.js.map