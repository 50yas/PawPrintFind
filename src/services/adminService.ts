
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
    where,
    updateDoc,
    increment,
    arrayUnion
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User, AdminAuditLog, UserRole, UserSchema, AdminAuditLogSchema, AIUsageStats, AIUsageStatsSchema, AISettings, AISettingsSchema, AISecrets, AISecretsSchema, AIProvider, KarmaBalance, KarmaTier, KarmaAdminStats, PromoCode } from '../types';
import { karmaService } from './karmaService';
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
                    model: 'qwen/qwen-2.5-72b-instruct:free',
                    messages: [{ role: 'user', content: 'Reply with OK' }],
                    config: { max_tokens: 5 },
                    task: 'connection_test',
                    overrideApiKey: apiKey // Cloud function expects overrideApiKey
                });
                const data = result.data as { success: boolean, text?: string };
                if (data.success) return { success: true, message: 'OpenRouter connection verified' };
                return { success: false, message: 'OpenRouter returned an error' };
            } else {
                // Google Gemini — test via generic AI caller to verify secrets
                const fn = httpsCallable(functions, 'callGemini');
                const result = await fn({
                    task: 'chat',
                    contents: { parts: [{ text: 'Reply with OK' }] },
                    config: { maxOutputTokens: 5 }
                });
                const data = result.data as { success: boolean, text?: string };
                if (data.success) return { success: true, message: 'Gemini connection verified' };
                return { success: false, message: 'Gemini returned an error' };
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

            // Determine if current user has admin privileges to avoid 403 console errors
            let isAdmin = false;
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdTokenResult();
                    isAdmin = !!(token.claims.admin || token.claims.super_admin);
                } catch (e) {
                    // ignore
                }
            }

            const [petsCount, clinicsCount, matchesCount] = await Promise.all([
                fetchCount(petsColl),
                fetchCount(clinicsColl),
                fetchCount(petsColl, query(petsColl, where('isLost', '==', false)))
            ]);

            let totalDonations = 0;
            let usersCount = 0;

            if (isAdmin) {
                // Only count donations that have been confirmed as paid
                const paidDonationsQuery = query(
                    donationsColl,
                    where('status', '==', 'paid'),
                    where('approved', '==', true)
                );
                const [d, u] = await Promise.all([
                    fetchSum(paidDonationsQuery, 'numericValue'),
                    fetchCount(usersColl)
                ]);
                totalDonations = d;
                usersCount = u;
            }

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
    },

    async getKarmaAdminStats(): Promise<KarmaAdminStats> {
        const snap = await getDocs(collection(db, 'karma_balances'));
        const balances = snap.docs.map(d => d.data() as KarmaBalance);
        const dist: Record<KarmaTier, number> = { scout: 0, tracker: 0, ranger: 0, guardian: 0, legend: 0 };
        let totalEarned = 0;
        let totalKm = 0;
        balances.forEach(b => {
            dist[b.currentTier] = (dist[b.currentTier] || 0) + 1;
            totalEarned += b.totalEarned || 0;
            totalKm += b.monthlyStats?.patrolKm || 0;
        });
        const riderSnap = await getCountFromServer(query(collection(db, 'rider_profiles'), where('isOnDuty', '==', true)));
        return {
            totalKarmaAwarded: totalEarned,
            activeRiders: riderSnap.data().count,
            totalPatrolKm: totalKm,
            tierDistribution: dist,
        };
    },

    async adminAdjustKarma(adminEmail: string, targetUserId: string, points: number, reason: string): Promise<void> {
        const ref = doc(db, 'karma_balances', targetUserId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const current = (snap.data().totalEarned as number) || 0;
            const newTotal = Math.max(0, current + Math.max(0, points));
            await updateDoc(ref, {
                currentBalance: increment(points),
                totalEarned: points > 0 ? increment(points) : increment(0),
                currentTier: karmaService.calculateTier(newTotal),
            });
        } else {
            const safePoints = Math.max(0, points);
            await setDoc(ref, {
                userId: targetUserId,
                totalEarned: safePoints,
                currentBalance: safePoints,
                totalRedeemed: 0,
                currentTier: karmaService.calculateTier(safePoints),
                streakDays: 0,
                lastActiveDate: '',
                riderBonusMultiplier: 1.0,
                monthlyStats: { sightings: 0, patrolKm: 0, patrolMinutes: 0, missionsCompleted: 0, reunions: 0 },
            });
        }
        await addDoc(collection(db, 'karma_transactions'), {
            userId: targetUserId,
            action: 'admin_adjustment',
            points,
            multiplier: 1,
            metadata: { reason },
            timestamp: Date.now(),
        });
        await this.logAdminAction({
            adminEmail,
            action: points >= 0 ? 'AWARD_KARMA' : 'DEDUCT_KARMA',
            targetId: targetUserId,
            details: `Admin ${points >= 0 ? 'awarded' : 'deducted'} ${Math.abs(points)} karma. Reason: ${reason}`,
        });
    },

    async adminAwardBadge(adminEmail: string, targetUserId: string, badgeName: string): Promise<void> {
        const userDoc = await getDoc(doc(db, 'users', targetUserId));
        if (!userDoc.exists()) throw new Error('User not found');
        const badges: string[] = userDoc.data().badges || [];
        if (badges.includes(badgeName)) throw new Error('User already has this badge');
        await updateDoc(doc(db, 'users', targetUserId), { badges: arrayUnion(badgeName) });
        await this.logAdminAction({
            adminEmail,
            action: 'AWARD_BADGE',
            targetId: targetUserId,
            details: `Awarded badge "${badgeName}"`,
        });
    },

    // --- Promo Code / Coupon Management ---

    generateCouponCode(prefix = 'PAW'): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
        const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${prefix}-${rand.slice(0, 4)}-${rand.slice(4)}`;
    },

    async getCoupons(): Promise<PromoCode[]> {
        const snap = await getDocs(query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PromoCode));
    },

    async createCoupon(coupon: Omit<PromoCode, 'id' | 'currentUses' | 'createdAt'>): Promise<string> {
        if (!auth.currentUser) throw new Error('Auth required');
        const existing = await getDocs(query(collection(db, 'promo_codes'), where('code', '==', coupon.code)));
        if (!existing.empty) throw new Error('Code already exists');
        const ref = await addDoc(collection(db, 'promo_codes'), {
            ...coupon,
            currentUses: 0,
            createdAt: Date.now(),
            createdBy: auth.currentUser.email || 'admin',
        });
        await this.logAdminAction({
            adminEmail: auth.currentUser.email || 'admin',
            action: 'CREATE_COUPON' as any,
            targetId: ref.id,
            details: `Created promo code "${coupon.code}" — ${coupon.type}: ${coupon.value}`,
        });
        return ref.id;
    },

    async updateCouponStatus(id: string, status: 'active' | 'revoked' | 'expired'): Promise<void> {
        if (!auth.currentUser) throw new Error('Auth required');
        await updateDoc(doc(db, 'promo_codes', id), { status });
        await this.logAdminAction({
            adminEmail: auth.currentUser.email || 'admin',
            action: 'UPDATE_COUPON' as any,
            targetId: id,
            details: `Set promo code status to "${status}"`,
        });
    },

    async deleteCoupon(id: string): Promise<void> {
        if (!auth.currentUser) throw new Error('Auth required');
        await deleteDoc(doc(db, 'promo_codes', id));
        await this.logAdminAction({
            adminEmail: auth.currentUser.email || 'admin',
            action: 'DELETE_COUPON' as any,
            targetId: id,
            details: `Deleted promo code ${id}`,
        });
    },

    async getCouponUsageLogs(codeId: string): Promise<any[]> {
        const snap = await getDocs(query(
            collection(db, 'promo_usage_logs'),
            where('code', '==', codeId),
            orderBy('timestamp', 'desc'),
            limit(50)
        ));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
};
