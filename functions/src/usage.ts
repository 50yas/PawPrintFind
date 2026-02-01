import * as admin from "firebase-admin";

/**
 * Increments usage counters for a user in Firestore.
 * Path: users/{uid}/usageStats/{YYYY-MM-DD}
 */
export async function trackUsage(userId: string, featureName: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const usageRef = admin.firestore()
    .collection("users")
    .doc(userId)
    .collection("usageStats")
    .doc(today);

  try {
    await usageRef.set({
      [featureName]: admin.firestore.FieldValue.increment(1),
      totalAIRequests: admin.firestore.FieldValue.increment(1),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`[Usage] Tracked ${featureName} for user ${userId}`);
  } catch (error) {
    console.error(`[Usage] Error tracking ${featureName} for user ${userId}:`, error);
  }
}
