import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

admin.initializeApp();

// Configuration for Rate Limiting (example)
// In a real production app, you might use a Redis-based rate limiter or Firestore to track usage per user.
// For now, we'll implement a simple per-user check if needed, or rely on Firebase's built-in protections.

export const callGemini = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { model, contents, config } = data;

  if (!model || !contents) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Model and contents are required."
    );
  }

  // 2. Secret Management (API Key)
  // Retrieve the API Key from Firebase Secrets (best practice)
  // For this implementation, we'll try to get it from environment variables or secrets.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API Key is not configured on the server."
    );
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });

    // 3. Rate Limiting (Placeholder for more complex logic)
    // You can implement custom rate limiting here by checking context.auth.uid 
    // against a usage collection in Firestore.

    const response = await genAI.models.generateContent({ model, contents, config });
    const text = response.text;
    
    // Extract grounding metadata if present
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    
    // Handle audio for TTS if present
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return {
      success: true,
      text: text,
      groundingMetadata,
      audioData
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "An error occurred while calling Gemini AI."
    );
  }
});

/**
 * Triggered when a new user is created in Firestore.
 * Queues a welcome email by writing to the 'mail' collection.
 */
export const onUserCreated = functions.firestore
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
    } catch (error) {
      console.error("Error queueing welcome email:", error);
    }
  });

