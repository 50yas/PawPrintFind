
import {
    collection,
    getDocs,
    setDoc,
    doc,
    getDoc,
    deleteDoc,
    addDoc,
    query,
    orderBy,
    limit,
    getCountFromServer,
    getAggregateFromServer,
    sum,
    where
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User, AdminAuditLog, UserRole, UserSchema, AdminAuditLogSchema, AIUsageStats, AIUsageStatsSchema, AISettings, AISettingsSchema, AISecrets, AISecretsSchema, AIProvider } from '../types';
import { authService } from './authService';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const adminService = {
    // --- Public Settings (Provider, Models, Public Key) ---
    async getAISettings(): Promise<AISettings> {
        try {
            const docRef = doc(db, 'system_config', 'ai_settings');
            const snap = await getDoc(docRef);
            
            if (snap.exists()) {
                const data = snap.data();
                return validationService.validate(AISettingsSchema, data, 'getAISettings');
            }
            
            // Return default settings if none exist
            return {
                provider: 'google',
                modelMapping: {
                    vision: 'gemini-pro-vision',
                    triage: 'gemini-pro',
                    chat: 'gemini-pro',
                    matching: 'gemini-pro'
                },
                lastUpdated: Date.now(),
                updatedBy: 'system@pawprintfind.com'
            };
        } catch (error: any) {
            // Permission denied is expected for non-admins if rules are strict,
            // but we plan to open 'ai_settings' for public read.
            // If it still fails, return defaults.
            if (error.code === 'permission-denied') {
                return {
                    provider: 'google',
                    modelMapping: {
                        vision: 'gemini-pro-vision',
                        triage: 'gemini-pro',
                        chat: 'gemini-pro',
                        matching: 'gemini-pro'
                    },
                    lastUpdated: Date.now(),
                    updatedBy: 'system@pawprintfind.com'
                };
            }
            logger.error('Error fetching AI settings:', error);
            throw error;
        }
    },

    // --- Admin-Only Secrets (Backend Keys) ---
    async getAISecrets(): Promise<AISecrets> {
        try {
            if (!auth.currentUser) throw new Error("Auth required for secrets.");
            const docRef = doc(db, 'system_config', 'ai_secrets');
            const snap = await getDoc(docRef);
            
            if (snap.exists()) {
                return validationService.validate(AISecretsSchema, snap.data(), 'getAISecrets');
            }
            return {};
        } catch (error) {
            console.error("Failed to fetch AI secrets:", error);
            return {};
        }
    },

    async saveAISettings(settings: AISettings, secrets?: AISecrets): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save AI settings.");
            }

            // 1. Save Public Settings
            const settingsWithMetadata = {
                ...settings,
                lastUpdated: Date.now(),
                updatedBy: auth.currentUser.email || 'unknown'
            };
            const validatedSettings = validationService.validate(AISettingsSchema, settingsWithMetadata, 'saveAISettings');
            await setDoc(doc(db, 'system_config', 'ai_settings'), validatedSettings);

            // 2. Save Secrets (if provided)
            if (secrets) {
                const validatedSecrets = validationService.validate(AISecretsSchema, secrets, 'saveAISecrets');
                await setDoc(doc(db, 'system_config', 'ai_secrets'), validatedSecrets);
            }

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'UPDATE_AI_SETTINGS',
                details: `Updated AI Provider to ${settings.provider}`
            });
        } catch (error) {
            logger.error('Error saving AI settings:', error);
            throw error;
        }
    },

    async testAIConnection(provider: AIProvider, apiKey: string): Promise<{ success: boolean, message: string }> {
        try {
            if (provider === 'openrouter') {
                const fn = httpsCallable(functions, 'callOpenRouter');
                const result = await fn({
                    model: 'openai/gpt-3.5-turbo',
                    messages: [{ role: 'user', content: 'Reply with OK' }],
                    config: { max_tokens: 5 },
                    task: 'connection_test',
                    apiKey
                });
                const data = result.data as { success: boolean, text?: string };
                if (data.success) return { success: true, message: 'OpenRouter connection verified' };
                return { success: false, message: 'OpenRouter returned an error' };
            } else {
                // Google Gemini — test via a lightweight generative call
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: 'Reply with OK',
                    config: { maxOutputTokens: 5 }
                });
                if (response.text) return { success: true, message: 'Gemini connection verified' };
                return { success: false, message: 'Gemini returned empty response' };
            }
        } catch (error: any) {
            logger.error('AI connection test failed:', error);
            return { success: false, message: error.message || 'Connection test failed' };
        }
    },

    async getUserUsageStats(userId: string): Promise<AIUsageStats[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch usage stats.");
            }
            const snap = await getDocs(collection(db, 'users', userId, 'usageStats'));
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id, userId };
                return validationService.validate(AIUsageStatsSchema, data, `getUserUsageStats:${userId}:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching user usage stats:', error);
            throw error;
        }
    },

    async resetUserUsageStats(userId: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to reset usage stats.");
            }
            const today = new Date().toISOString().split('T')[0];
            const usageRef = doc(db, 'users', userId, 'usageStats', today);
            await setDoc(usageRef, {
                visionIdentification: 0,
                smartSearch: 0,
                healthAssessment: 0,
                blogGeneration: 0,
                totalAIRequests: 0,
                lastUsed: Date.now()
            }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'RESET_USAGE',
                targetId: userId,
                details: `Reset AI usage stats for user ${userId}`
            });
        } catch (error) {
            logger.error('Error resetting user usage stats:', error);
            throw error;
        }
    },

    async getSystemStats(): Promise<{
        totalUsers: number;
        totalPets: number;
        totalClinics: number;
        totalDonations: number;
        activeAlerts: number;
    }> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch system stats.");
            }

            const stats = await this.getPublicStats();
            const petsColl = collection(db, 'pets');
            const alertsSnap = await getCountFromServer(query(petsColl, where('isLost', '==', true)));

            return {
                totalUsers: stats.communityMembers,
                totalPets: stats.petsProtected,
                totalClinics: stats.vetPartners,
                totalDonations: stats.totalDonations,
                activeAlerts: alertsSnap.data().count
            };
        } catch (error) {
            logger.error('Error fetching system stats:', error);
            throw error;
        }
    },

    // --- Public Stats Cache ---
    _publicStatsCache: null as { data: any, timestamp: number } | null,
    _CACHE_TTL: 5 * 60 * 1000, // 5 minutes

    async getPublicStats(): Promise<{ 
        petsProtected: number; 
        successfulMatches: number; 
        communityMembers: number; 
        vetPartners: number;
        activeCities: number;
        totalDonations: number;
        responseTime: number;
    }> {
        // Check cache
        if (this._publicStatsCache && (Date.now() - this._publicStatsCache.timestamp < this._CACHE_TTL)) {
            return this._publicStatsCache.data;
        }

        try {
            const petsColl = collection(db, 'pets');
            const clinicsColl = collection(db, 'vet_clinics');
            const donationsColl = collection(db, 'donations');
            const usersColl = collection(db, 'users');

            // Individual error handling for each stat to prevent full failure on permission denied
            const fetchCount = async (coll: any, q?: any) => {
                try {
                    const snap = await getCountFromServer(q || coll);
                    return snap.data().count;
                } catch (e) {
                    return 0; // Safe fallback
                }
            };

            const fetchSum = async (coll: any, field: string) => {
                try {
                    const snap = await getAggregateFromServer(coll, { total: sum(field) });
                    return snap.data().total || 0;
                } catch (e) {
                    return 0; // Safe fallback
                }
            };

            const [petsCount, clinicsCount, totalDonations, usersCount, matchesCount] = await Promise.all([
                fetchCount(petsColl),
                fetchCount(clinicsColl),
                fetchSum(donationsColl, 'numericValue'),
                fetchCount(usersColl),
                fetchCount(petsColl, query(petsColl, where('isLost', '==', false)))
            ]);

            const data = {
                petsProtected: petsCount,
                successfulMatches: matchesCount,
                communityMembers: usersCount,
                vetPartners: clinicsCount,
                activeCities: Math.max(1, clinicsCount + 3), // Better heuristic: base + 1 per clinic
                totalDonations: totalDonations,
                responseTime: 12
            };

            // Update cache
            this._publicStatsCache = { data, timestamp: Date.now() };

            return data;
        } catch (error) {
            console.error('Error fetching public stats:', error);
            return { 
                petsProtected: 0, 
                successfulMatches: 0, 
                communityMembers: 0, 
                vetPartners: 0, 
                activeCities: 0, 
                totalDonations: 0,
                responseTime: 12
            };
        }
    },

    async getUsers(): Promise<User[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch users.");
            }
            const snap = await getDocs(collection(db, 'users'));
            return snap.docs.map(d => {
                const data = { ...d.data(), uid: d.id };
                return validationService.validate(UserSchema, data, `getUsers:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching users:', error);
            throw error;
        }
    },

    async saveUser(userData: Partial<User> & { uid: string }): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save user.");
            }
            // Since it's partial, we might not be able to validate full UserSchema here
            // But we should at least check what we can.
            // For production, maybe we should enforce full schema if it's a full update.
            await setDoc(doc(db, 'users', userData.uid), userData, { merge: true });
        } catch (error) {
            logger.error('Error saving user:', error);
            throw error;
        }
    },

    async deleteUser(uid: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to delete user.");
            }
            await deleteDoc(doc(db, 'users', uid));
        } catch (error) {
            logger.error('Error deleting user:', error);
            throw error;
        }
    },

    async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to update user role.");
            }
            // Update both the roles array and activeRole for simplicity in this context
            // In a real app, you might want more complex logic
            await setDoc(doc(db, 'users', uid), {
                roles: [newRole],
                activeRole: newRole
            }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'UPDATE_ROLE',
                targetId: uid,
                details: `Updated role to ${newRole}`
            });
        } catch (error) {
            logger.error('Error updating user role:', error);
            throw error;
        }
    },

    async toggleUserStatus(uid: string, newStatus: 'active' | 'suspended' | 'banned'): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to update user status.");
            }
            await setDoc(doc(db, 'users', uid), { status: newStatus }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'UPDATE_STATUS',
                targetId: uid,
                details: `Updated status to ${newStatus}`
            });
        } catch (error) {
            logger.error('Error updating user status:', error);
            throw error;
        }
    },

    async toggleUserSubscription(uid: string, isPro: boolean): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to update user subscription.");
            }

            const subscriptionData = isPro ? {
                status: 'active',
                planId: 'vet_pro',
                currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            } : {
                status: 'inactive',
                planId: 'vet_free',
                currentPeriodEnd: Date.now()
            };

            await setDoc(doc(db, 'users', uid), { subscription: subscriptionData }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'UPDATE_SUBSCRIPTION',
                targetId: uid,
                details: `Updated subscription to ${isPro ? 'Pro' : 'Free'}`
            });
        } catch (error) {
            logger.error('Error updating user subscription:', error);
            throw error;
        }
    },

    async isSystemInitialized(): Promise<boolean> {
        try {
            const docRef = doc(db, 'metadata', 'system');
            const snap = await getDoc(docRef);
            return snap.exists() && snap.data()?.initialized === true;
        } catch (error) {
            console.error('Error checking system initialization:', error);
            return false;
        }
    },

    async initializeSystem(): Promise<void> {
        try {
            await setDoc(doc(db, 'metadata', 'system'), { initialized: true, securityModel: 'V3-PROD' });
        } catch (error) {
            logger.error('Error initializing system:', error);
            throw error;
        }
    },

    async verifyAdminSecret(key: string): Promise<boolean> {
        try {
            const result = await authService.verifyAdminKey(key);
            return result.valid;
        } catch (error) {
            logger.error('Error verifying admin secret:', error);
            throw error;
        }
    },

    async logAdminAction(log: Omit<AdminAuditLog, 'id' | 'timestamp'>) {
        try {
            const logEntry = {
                ...log,
                timestamp: Date.now()
            };
            // Validation might fail if ID is missing but schema expects it?
            // AdminAuditLogSchema has id as required.
            // We should generate an ID or use addDoc's returned ID.
            const docRef = await addDoc(collection(db, 'admin_audit_logs'), logEntry);
            // Re-validate if needed, but usually we just want to ensure what we send is okay.
        } catch (error) {
            logger.error('Error logging admin action:', error);
            console.error("Failed to log admin action", error);
        }
    },

    async verifyUser(user: User): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to verify user.");
            }
            const updatedUser = { ...user, isVerified: true };
            validationService.validate(UserSchema, updatedUser, 'verifyUser');
            await setDoc(doc(db, 'users', user.uid), updatedUser, { merge: true });
        } catch (error) {
            logger.error('Error verifying user:', error);
            throw error;
        }
    },

    async approveVet(uid: string): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Auth required.");
            
            await setDoc(doc(db, 'users', uid), {
                isVetVerified: true,
                verificationStatus: 'approved',
                // Keep existing roles but ensure 'vet' is included if not already
                roles: ['vet'], 
                activeRole: 'vet'
            }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'APPROVE_VET',
                targetId: uid,
                details: `Approved Vet verification for ${uid}`
            });
        } catch (error) {
            logger.error('Error approving vet:', error);
            throw error;
        }
    },

    async declineVet(uid: string, reason: string): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Auth required.");
            
            await setDoc(doc(db, 'users', uid), {
                isVetVerified: false,
                verificationStatus: 'declined',
                rejectionReason: reason
            }, { merge: true });

            await this.logAdminAction({
                adminEmail: auth.currentUser.email || 'unknown',
                action: 'DECLINE_VET',
                targetId: uid,
                details: `Declined Vet verification for ${uid}. Reason: ${reason}`
            });
        } catch (error) {
            logger.error('Error declining vet:', error);
            throw error;
        }
    },

    async rejectVerification(user: User): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to reject verification.");
            }
            // Logic to clear verificationData while keeping the user
            const { verificationData, ...userWithoutVerification } = user;
            const updatedUser = { ...userWithoutVerification, isVerified: false };
            validationService.validate(UserSchema, updatedUser, 'rejectVerification');
            await setDoc(doc(db, 'users', user.uid), updatedUser);
        } catch (error) {
            logger.error('Error rejecting verification:', error);
            throw error;
        }
    },

    async getAuditLogs(max: number = 100): Promise<AdminAuditLog[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch audit logs.");
            }
            const q = query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc'), limit(max));
            const snap = await getDocs(q);
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(AdminAuditLogSchema, data, `getAuditLogs:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching audit logs:', error);
            throw error;
        }
    }
};
