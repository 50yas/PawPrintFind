
import {
    collection, getDocs, setDoc, doc, updateDoc, query, where, or, onSnapshot, orderBy, arrayUnion, addDoc, increment, deleteDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';
import { translateContent } from './geminiService';
import { ChatSession, ChatMessage, Donation, BlogPost } from '../types';
import { logger } from './loggerService';

export const contentService = {
    // --- CHAT ---
    async saveChatSession(session: ChatSession): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save chat session.");
            }
            await setDoc(doc(db, 'chats', session.id), session, { merge: true });
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
            await updateDoc(doc(db, 'chats', sessionId), { messages: arrayUnion(message) });
        } catch (error) {
            logger.error('Error sending chat message:', error);
            throw error;
        }
    },

    subscribeToChats(email: string, callback: (chats: ChatSession[]) => void) {
        // Subscriptions don't usually throw but call callback with empty or error
        // But onSnapshot returns unsub function.
        // We will just return the onSnapshot result.
        // Error handling inside onSnapshot?
        const q = query(collection(db, 'chats'), or(where('ownerEmail', '==', email), where('finderEmail', '==', email)));
        return onSnapshot(q, (s) => callback(s.docs.map(d => d.data() as ChatSession)), (error) => {
            logger.error('Error in chat subscription:', error);
        });
    },

    // --- DONATIONS ---
    async recordDonation(donation: Donation): Promise<void> {
        try {
            // Donations might be recorded by system (stripe webhook) or user interaction.
            // If strictly user interaction, should check auth? 
            // The original code didn't. 
            // `donationService.ts` calls this.
            // Let's add try/catch and log.
            await setDoc(doc(db, 'donations', donation.id), donation);
        } catch (error) {
            logger.error('Error recording donation:', error);
            throw error;
        }
    },

    async getDonations(): Promise<Donation[]> {
        try {
            const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as Donation);
        } catch (error) {
            logger.error('Error fetching donations:', error);
            throw error;
        }
    },

    subscribeToDonations(callback: (donations: Donation[]) => void) {
        const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (s) => callback(s.docs.map(d => d.data() as Donation)), (error) => {
             logger.error('Error in donation subscription:', error);
        });
    },

    // --- BLOG ---
    async saveBlogPost(post: BlogPost): Promise<void> {
        try {
            if (!auth.currentUser) throw new Error("Authentication required.");

            // Auto-Translation Logic
            // We verify if content has changed to avoid unnecessary API calls? 
            // For now, we assume if save is called, we want to update/translate.
            // Ideally we should check if fields changed.
            
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
                // Proceed to save without translations if AI fails
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
            return snap.docs.map(d => d.data() as BlogPost);
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
    async createCheckoutSession(amount: number, donationId: string): Promise<{ id: string, url: string }> {
        try {
            let user = auth.currentUser;
            if (!user) user = (await signInAnonymously(auth)).user;
            
            const docRef = await addDoc(collection(db, 'customers', user.uid, 'checkout_sessions'), {
                mode: 'payment',
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Support Paw Print Project' },
                    unit_amount: Math.round(amount * 100),
                },
                success_url: window.location.origin,
                cancel_url: window.location.origin,
                metadata: { donationId }
            });

            return new Promise((res, rej) => {
                const unsub = onSnapshot(docRef, (s) => {
                    const data = s.data();
                    if (data?.url) { 
                        unsub(); 
                        res({ id: docRef.id, url: data.url }); 
                    }
                    if (data?.error) {
                        unsub();
                        rej(new Error(data.error.message));
                    }
                }, (error) => {
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
