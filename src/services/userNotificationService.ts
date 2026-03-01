import {
    collection, query, orderBy, limit, onSnapshot,
    doc, writeBatch, getDocs, where
} from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification } from '../types';

function notifCol(userId: string) {
    return collection(db, 'user_notifications', userId, 'items');
}

export const userNotificationService = {
    subscribe(
        userId: string,
        callback: (notifications: AppNotification[]) => void
    ): () => void {
        const q = query(notifCol(userId), orderBy('timestamp', 'desc'), limit(20));
        return onSnapshot(q, (snap) => {
            const notifs: AppNotification[] = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
            } as AppNotification));
            callback(notifs);
        }, () => callback([]));
    },

    async markAllAsRead(userId: string): Promise<void> {
        const q = query(notifCol(userId), where('read', '==', false));
        const snap = await getDocs(q);
        if (snap.empty) return;
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.update(d.ref, { read: true }));
        await batch.commit();
    },

    async markAsRead(userId: string, notifId: string): Promise<void> {
        const ref = doc(db, 'user_notifications', userId, 'items', notifId);
        const batch = writeBatch(db);
        batch.update(ref, { read: true });
        await batch.commit();
    },
};
