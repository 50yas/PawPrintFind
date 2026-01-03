
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { dbService } from '../services/firebase';
import { LoadingSpinner } from './LoadingSpinner';

export const ContactForm: React.FC = () => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email && message) {
            setLoading(true);
            try {
                await dbService.saveContactMessage({
                    name,
                    email,
                    subject: 'Contact Form Submission', // Add a default subject
                    message,
                    timestamp: Date.now()
                });
                setSubmitted(true);
            } catch (error) {
                console.error("Error submitting contact form:", error);
                addSnackbar(t('genericError'), 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    if (submitted) {
        return (
            <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-fade-in">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">{t('messageSentSuccess')}</h3>
                <button onClick={() => {setSubmitted(false); setName(''); setEmail(''); setMessage('');}} className="mt-4 text-sm font-bold text-green-700 underline">Send another message</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto text-left">
            <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('yourNameLabel')}</label>
                <input
                    type="text"
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('yourEmailLabel')}</label>
                <input
                    type="email"
                    id="contact-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('yourMessageLabel')}</label>
                <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-white"
                ></textarea>
            </div>
            <div className="text-center pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto py-3 px-8 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <LoadingSpinner /> : t('sendMessageButton')}
                </button>
            </div>
        </form>
    );
};
