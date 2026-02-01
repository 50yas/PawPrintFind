import * as admin from "firebase-admin";

/**
 * Quotas for various AI features (per user per day).
 */
const QUOTAS: Record<string, number> = {
    visionIdentification: 10,
    smartSearch: 20,
    healthAssessment: 5,
    blogGeneration: 5,
    generic: 10
};

/**
 * Checks if a user has exceeded their daily quota for a specific feature.
 */
export async function checkQuota(userId: string, featureName: string): Promise<{ allowed: boolean; reason?: string }> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("usageStats")
        .doc(today);

    try {
        const doc = await usageRef.get();
        if (!doc.exists) {
            return { allowed: true };
        }

        const data = doc.data() || {};
        const currentUsage = data[featureName] || 0;
        const quota = QUOTAS[featureName] || 10;

        if (currentUsage >= quota) {
            return { 
                allowed: false, 
                reason: `Daily quota for ${featureName} exceeded (${currentUsage}/${quota}).` 
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error(`[RateLimit] Error checking quota for ${userId}/${featureName}:`, error);
        // Fail open to avoid blocking users if Firestore is down, but log the error
        return { allowed: true };
    }
}
