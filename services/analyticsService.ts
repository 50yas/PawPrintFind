
import { getAnalytics, logEvent as fbLogEvent } from "firebase/analytics";
import { auth } from './firebase';
import { logger } from './loggerService';

/**
 * Enterprise Analytics Service
 * Centralized portal for tracking user engagement and system milestones.
 */

// Types of events we want to track for Enterprise level reporting
export type AnalyticsEvent = 
  | 'adopt_inquiry' 
  | 'sighting_report' 
  | 'health_check_triggered' 
  | 'smart_search_performed'
  | 'biometric_identikit_generated'
  | 'donation_started'
  | 'donation_completed'
  | 'app_crash'
  | 'ai_failure';

export const analyticsService = {
    /**
     * Log a custom event to Firebase Analytics
     */
    logEvent(event: AnalyticsEvent, params?: Record<string, any>) {
        try {
            const analytics = typeof window !== 'undefined' ? getAnalytics() : null;
            if (analytics) {
                const enrichedParams = {
                    ...params,
                    user_id: auth.currentUser?.uid || 'anonymous',
                    timestamp: Date.now(),
                    environment: import.meta.env.MODE
                };
                
                fbLogEvent(analytics, event, enrichedParams);
                
                // Also mirror to our internal logger for trace correlation
                logger.info(`[Analytics] ${event}`, enrichedParams);
            }
        } catch (error) {
            // We never want analytics to crash the app
            console.warn("Analytics tracking failed:", error);
        }
    },

    /**
     * Special tracker for adoption inquiries
     */
    trackAdoptionInquiry(petId: string, petName: string) {
        this.logEvent('adopt_inquiry', { pet_id: petId, pet_name: petName });
    },

    /**
     * Track AI feature usage
     */
    trackAISearch(query: string, resultCount: number) {
        this.logEvent('smart_search_performed', { query_length: query.length, results: resultCount });
    },

    /**
     * Track health checks
     */
    trackHealthCheck(petId: string, breed: string) {
        this.logEvent('health_check_triggered', { pet_id: petId, pet_breed: breed });
    }
};
