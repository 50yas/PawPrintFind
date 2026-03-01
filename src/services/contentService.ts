
import {
    collection, getDocs, setDoc, doc, updateDoc, query, where, or, onSnapshot, orderBy, arrayUnion, addDoc, increment, deleteDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';
import { translateContent } from './geminiService';
import { ChatSession, ChatMessage, Donation, BlogPost, ChatSessionSchema, ChatMessageSchema, DonationSchema, BlogPostSchema } from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { sanitizationPipeline } from './sanitizationPipeline';

export const contentService = {
    // --- CHAT ---
    async saveChatSession(session: ChatSession): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save chat session.");
            }
            // SECURITY: Sanitize chat session data (CRITICAL for XSS prevention)
            const sanitized = sanitizationPipeline.chatSession(session);
            validationService.validate(ChatSessionSchema, sanitized, 'saveChatSession');
            await setDoc(doc(db, 'chats', session.id), sanitized, { merge: true });
        } catch (error) {
            logger.error('Error saving chat session:', error);
            throw error;
        }
    },

    async sendChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to send chat message.");
            }
            // SECURITY: Sanitize chat message (CRITICAL - high-risk XSS vector)
            const sanitized = sanitizationPipeline.chatMessage(message);
            validationService.validate(ChatMessageSchema, sanitized, 'sendChatMessage');
            await updateDoc(doc(db, 'chats', sessionId), { messages: arrayUnion(sanitized) });
        } catch (error) {
            logger.error('Error sending chat message:', error);
            throw error;
        }
    },

    subscribeToChats(email: string, callback: (chats: ChatSession[]) => void) {
        const q = query(collection(db, 'chats'), or(where('ownerEmail', '==', email), where('finderEmail', '==', email)));
        return onSnapshot(q, (s) => {
            const sessions = s.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(ChatSessionSchema, data, `subscribeToChats:${d.id}`);
            });
            callback(sessions);
        }, (error) => {
            logger.error('Error in chat subscription:', error);
        });
    },

    // --- DONATIONS ---
    async recordDonation(donation: Donation): Promise<void> {
        try {
            validationService.validate(DonationSchema, donation, 'recordDonation');
            await setDoc(doc(db, 'donations', donation.id), donation);
        } catch (error) {
            logger.error('Error recording donation:', error);
            throw error;
        }
    },

    async deleteDonation(id: string): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Authentication required.");
            await deleteDoc(doc(db, 'donations', id));
        } catch (error) {
            logger.error('Error deleting donation:', error);
            throw error;
        }
    },

    async confirmDonation(id: string): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Authentication required.");
            await updateDoc(doc(db, 'donations', id), { isConfirmed: true, approved: true });
        } catch (error) {
            logger.error('Error confirming donation:', error);
            throw error;
        }
    },

    async getDonations(all: boolean = false): Promise<Donation[]> {
        try {
            let q;
            if (all) {
                q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
            } else {
                q = query(collection(db, 'donations'), where('isPublic', '==', true), where('isConfirmed', '==', true), orderBy('timestamp', 'desc'));
            }
            const snap = await getDocs(q);
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(DonationSchema, data, `getDonations:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching donations:', error);
            throw error;
        }
    },

    subscribeToDonations(callback: (donations: Donation[]) => void, onError?: (error: any) => void, all: boolean = false) {
        const buildQuery = (useComposite: boolean) => {
            if (all) {
                return query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
            }
            if (useComposite) {
                // Requires index: isPublic (ASC), isConfirmed (ASC), timestamp (DESC)
                return query(collection(db, 'donations'), where('isPublic', '==', true), where('isConfirmed', '==', true), orderBy('timestamp', 'desc'));
            }
            // Fallback query (less precise but won't fail if index is missing)
            return query(collection(db, 'donations'), where('isPublic', '==', true), orderBy('timestamp', 'desc'));
        };

        let q = buildQuery(true);

        let unsub = onSnapshot(q, (s) => {
            const donations = s.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(DonationSchema, data, `subscribeToDonations:${d.id}`);
            });
            callback(donations);
        }, (error) => {
            if (error.code === 'failed-precondition' && !all) {
                console.warn("Donation composite index missing. Falling back to simple query.");
                unsub(); // Stop current listener
                // Retry with simple query
                q = buildQuery(false);
                unsub = onSnapshot(q, (s) => {
                    const donations = s.docs.map(d => {
                        const data = { ...d.data(), id: d.id };
                        return validationService.validate(DonationSchema, data, `subscribeToDonations:${d.id}`);
                    });
                    // Filter confirms manually if in fallback
                    callback(donations.filter(d => d.isConfirmed));
                }, (innerError) => {
                    if (onError) onError(innerError);
                    else logger.error('Donation fallback subscription failed:', innerError);
                });
            } else {
                if (onError) onError(error);
                else logger.error('Error in donation subscription:', error);
            }
        });

        return () => unsub();
    },

    // --- BLOG ---
    async saveBlogPost(post: BlogPost): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Authentication required.");

            validationService.validate(BlogPostSchema, post, 'saveBlogPost');

            const targetLangs = ['es', 'fr', 'de', 'it', 'nl'];
            const translations: Record<string, { title: string, summary: string, content: string }> = {};

            try {
                // Execute translations in parallel
                const [titles, summaries, contents] = await Promise.all([
                    translateContent(post.title, targetLangs),
                    translateContent(post.summary, targetLangs),
                    translateContent(post.content, targetLangs)
                ]);

                targetLangs.forEach(lang => {
                    translations[lang] = {
                        title: titles[lang] || post.title,
                        summary: summaries[lang] || post.summary,
                        content: contents[lang] || post.content
                    };
                });
            } catch (translationError) {
                logger.warn('Auto-translation failed, saving without translations:', translationError);
            }

            const postToSave = { ...post, translations: Object.keys(translations).length > 0 ? translations : post.translations };
            await setDoc(doc(db, 'blog_posts', post.id), postToSave, { merge: true });
        } catch (error) {
            logger.error('Error saving blog post:', error);
            throw error;
        }
    },

    async deleteBlogPost(id: string): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Authentication required.");
            await deleteDoc(doc(db, 'blog_posts', id));
        } catch (error) {
            logger.error('Error deleting blog post:', error);
            throw error;
        }
    },

    async getBlogPosts(): Promise<BlogPost[]> {
        try {
            const q = query(collection(db, 'blog_posts'), orderBy('publishedAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(BlogPostSchema, data, `getBlogPosts:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching blog posts:', error);
            throw error;
        }
    },

    async incrementBlogPostView(id: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'blog_posts', id), {
                views: increment(1)
            });
        } catch (error) {
            // Se fallisce su 'blog_posts', prova su 'blog' (legacy fallback)
            try {
                await updateDoc(doc(db, 'blog', id), { views: increment(1) });
            } catch (e) {
                logger.error('Error incrementing blog view:', error);
            }
        }
    },

    // --- STRIPE / CHECKOUT ---
    async createCheckoutSession(amount: number, donationId: string, donorEmail?: string, donorName?: string): Promise<{ id: string, url: string }> {
        try {
            let user = auth.currentUser;
            if (!user) user = (await signInAnonymously(auth)).user;

            // Primary path: Call our custom Cloud Function (works without Stripe Extension)
            try {
                const { httpsCallable } = await import('firebase/functions');
                const { functions } = await import('./firebase');
                const createCheckout = httpsCallable(functions, 'createDonationCheckout');
                const result = await createCheckout({ amount, donationId, donorEmail, donorName }) as any;
                if (result.data?.url) {
                    return { id: result.data.id || donationId, url: result.data.url };
                }
            } catch (cfError: any) {
                // If the Cloud Function isn't deployed or STRIPE_SECRET_KEY isn't set,
                // fall through to the Extension-based approach below
                logger.warn('createDonationCheckout Cloud Function unavailable, falling back to Stripe Extension:', cfError.message);
            }

            // Fallback: Firebase Stripe Extension (checkout_sessions subcollection)
            const docRef = await addDoc(collection(db, 'customers', user.uid, 'checkout_sessions'), {
                mode: 'payment',
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Support Paw Print Project' },
                    unit_amount: Math.round(amount * 100),
                },
                success_url: `${window.location.origin}/payment-success?donationId=${donationId}`,
                cancel_url: `${window.location.origin}/donors`,
                metadata: { donationId }
            });

            return new Promise((res, rej) => {
                // 20 s timeout — if the Stripe Extension never responds the user won't be stuck
                const timeout = setTimeout(() => {
                    unsub();
                    rej(new Error('Payment gateway timeout. Please ensure the Stripe Firebase Extension is installed and the secret key is configured.'));
                }, 20_000);

                const unsub = onSnapshot(docRef, (s) => {
                    const data = s.data();
                    if (data?.url) {
                        clearTimeout(timeout);
                        unsub();
                        res({ id: docRef.id, url: data.url });
                    }
                    if (data?.error) {
                        clearTimeout(timeout);
                        unsub();
                        rej(new Error(data.error.message));
                    }
                }, (error) => {
                    clearTimeout(timeout);
                    unsub();
                    rej(error);
                });
            });
        } catch (error) {
            logger.error('Error creating checkout session:', error);
            throw error;
        }
    }
};
