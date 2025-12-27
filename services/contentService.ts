
import {
    collection, getDocs, setDoc, doc, updateDoc, query, where, or, onSnapshot, orderBy, arrayUnion, addDoc, increment
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';
import { ChatSession, ChatMessage, Donation, BlogPost } from '../types';

export const contentService = {
    // --- CHAT ---
    async saveChatSession(session: ChatSession): Promise<void> {
        await setDoc(doc(db, 'chats', session.id), session, { merge: true });
    },

    async sendChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
        await updateDoc(doc(db, 'chats', sessionId), { messages: arrayUnion(message) });
    },

    subscribeToChats(email: string, callback: (chats: ChatSession[]) => void) {
        const q = query(collection(db, 'chats'), or(where('ownerEmail', '==', email), where('finderEmail', '==', email)));
        return onSnapshot(q, (s) => callback(s.docs.map(d => d.data() as ChatSession)));
    },

    // --- DONATIONS ---
    async recordDonation(donation: Donation): Promise<void> {
        await setDoc(doc(db, 'donations', donation.id), donation);
    },

    async getDonations(): Promise<Donation[]> {
        const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Donation);
    },

    subscribeToDonations(callback: (donations: Donation[]) => void) {
        const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (s) => callback(s.docs.map(d => d.data() as Donation)));
    },

    // --- BLOG ---
    async getBlogPosts(): Promise<BlogPost[]> {
        const q = query(collection(db, 'blog_posts'), orderBy('publishedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as BlogPost);
    },

    async incrementBlogPostView(id: string): Promise<void> {
        await updateDoc(doc(db, 'blog_posts', id), { views: increment(1) });
    },

    // --- STRIPE / CHECKOUT ---
    async createCheckoutSession(amount: number, donationId: string): Promise<{ id: string, url: string }> {
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
        return new Promise((res) => {
            const unsub = onSnapshot(docRef, (s) => {
                if (s.data()?.url) { unsub(); res({ id: docRef.id, url: s.data()!.url }); }
            });
        });
    }
};
