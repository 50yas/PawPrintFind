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
    const genAI = new GoogleGenAI(apiKey);
    const aiModel = genAI.getGenerativeModel({ model, ...config });

    // 3. Rate Limiting (Placeholder for more complex logic)
    // You can implement custom rate limiting here by checking context.auth.uid 
    // against a usage collection in Firestore.

    const result = await aiModel.generateContent(contents);
    const response = await result.response;
    const text = response.text();
    
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
