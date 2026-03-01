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
exports.checkQuota = checkQuota;
const admin = __importStar(require("firebase-admin"));
const QUOTAS = {
    visionIdentification: 10,
    smartSearch: 20,
    healthAssessment: 5,
    blogGeneration: 5,
    generic: 10
};
async function checkQuota(userId, featureName) {
    const today = new Date().toISOString().split('T')[0];
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
    }
    catch (error) {
        console.error(`[RateLimit] Error checking quota for ${userId}/${featureName}:`, error);
        return { allowed: true };
    }
}
//# sourceMappingURL=rateLimit.js.map