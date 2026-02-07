
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { NotificationConfig, NotificationConfigSchema } from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';

const CONFIG_DOC_PATH = 'config/notifications';

const DEFAULT_CONFIG: NotificationConfig = {
    email: { enabled: false, target: '' },
    whatsapp: { enabled: false, target: '' },
    telegram: { enabled: false, apiKey: '', chatId: '' },
    events: { newUser: false, vetVerification: false }
};

export const notificationService = {
    async getSettings(): Promise<NotificationConfig> {
        try {
            const docRef = doc(db, CONFIG_DOC_PATH);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return validationService.validate(NotificationConfigSchema, snap.data(), 'getNotificationSettings');
            }
            return DEFAULT_CONFIG;
        } catch (error) {
            logger.error('Failed to fetch notification settings', error);
            return DEFAULT_CONFIG;
        }
    },

    async saveSettings(config: NotificationConfig): Promise<void> {
        try {
            validationService.validate(NotificationConfigSchema, config, 'saveNotificationSettings');
            const docRef = doc(db, CONFIG_DOC_PATH);
            await setDoc(docRef, config);
            logger.info('Notification settings saved');
        } catch (error) {
            logger.error('Failed to save notification settings', error);
            throw error;
        }
    },

    async sendNotification(event: 'newUser' | 'vetVerification', data: any): Promise<void> {
        try {
            const config = await this.getSettings();
            
            // Check if event is enabled
            if (!config.events[event]) {
                return;
            }

            const message = this.formatMessage(event, data);

            // Channel: Email
            if (config.email.enabled && config.email.target) {
                console.log(`[📧 EMAIL] To: ${config.email.target} | Subject: ${message.subject} | Body: ${message.body}`);
                // TODO: Integrate EmailJS or Cloud Function
            }

            // Channel: WhatsApp
            if (config.whatsapp.enabled && config.whatsapp.target) {
                console.log(`[📱 WHATSAPP] To: ${config.whatsapp.target} | Message: ${message.body}`);
                // TODO: Integrate Twilio/Meta API
            }

            // Channel: Telegram
            if (config.telegram.enabled && config.telegram.apiKey && config.telegram.chatId) {
                console.log(`[✈️ TELEGRAM] Chat: ${config.telegram.chatId} | Message: ${message.body}`);
                // TODO: Call Telegram Bot API
            }

        } catch (error) {
            logger.error('Failed to process notification', error);
        }
    },

    formatMessage(event: string, data: any) {
        switch (event) {
            case 'newUser':
                return {
                    subject: 'New User Registered',
                    body: `A new user just joined Paw Print: ${data.email} (${data.role})`
                };
            case 'vetVerification':
                return {
                    subject: 'New Vet Verification Request',
                    body: `Vet Verification Pending: ${data.clinicName} (${data.email}). License: ${data.licenseNumber}`
                };
            default:
                return { subject: 'Notification', body: JSON.stringify(data) };
        }
    }
};
