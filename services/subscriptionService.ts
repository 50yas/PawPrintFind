
import { addDoc, collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth, functions } from './firebase'; // Ensure functions is exported if we switch to Callable, but mostly Firestore here
import { logger } from './loggerService';
import { User } from '../types';

export const subscriptionService = {
    /**
     * Starts a Stripe Checkout Session for a recurring subscription.
     * @param priceId The Stripe Price ID (e.g. 'price_12345')
     */
    async subscribeToPlan(priceId: string): Promise<void> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Authentication required.");

            const docRef = await addDoc(collection(db, 'customers', user.uid, 'checkout_sessions'), {
                mode: 'subscription',
                price: priceId,
                success_url: `${window.location.origin}/vetDashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: window.location.origin,
            });

            // Listen for the redirect URL
            const unsub = onSnapshot(docRef, (snap) => {
                const { error, url } = snap.data() || {};
                if (error) {
                    unsub();
                    logger.error("Stripe Checkout Error:", error.message);
                    alert(`Payment Error: ${error.message}`);
                }
                if (url) {
                    unsub();
                    window.location.href = url;
                }
            });

        } catch (error) {
            logger.error("Error starting subscription:", error);
            throw error;
        }
    },

    /**
     * Redirects the user to the Stripe Customer Portal to manage their subscription.
     */
    async openBillingPortal(): Promise<void> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Authentication required.");

            // This relies on the Stripe Extension being configured to listen to this collection?
            // Usually extension listens to "checkout_sessions" but for portal...
            // Standard generic way: use a Callable Function usually. 
            // Or typically the extension supports a simplified URL. 
            // Let's assume we use the standard "ext-firestore-stripe-payments" way via function call if available,
            // or write to a collection if configured. 
            
            // Standard Extension way: 
            // The extension creates a `httpsCallable` named `ext-firestore-stripe-payments-createPortalLink`.
            // We need to import it. Since we don't have it imported, let's try writing to collection if applicable,
            // OR use the function name standard.
            
            // Let's rely on the function which is safer.
            const { httpsCallable } = await import('firebase/functions');
            const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
            
            const { data }: any = await createPortalLink({
                returnUrl: window.location.origin + '/vetDashboard'
            });
            
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No portal URL returned.");
            }

        } catch (error) {
            logger.error("Error opening billing portal:", error);
            throw error;
        }
    },

    /**
     * Checks if the current user has an active Pro subscription.
     */
    async checkSubscriptionStatus(uid: string): Promise<boolean> {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (!userDoc.exists()) return false;
            
            const userData = userDoc.data() as User;
            return userData.subscription?.status === 'active' || userData.subscription?.status === 'trialing';
        } catch (error) {
            console.error("Error checking subscription:", error);
            return false;
        }
    }
};
