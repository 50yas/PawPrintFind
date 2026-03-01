
/**
 * ChatModal.tsx
 *
 * Firebase-backed real-time chat modal for PawPrintFind.
 *
 * Features:
 * - Live Firestore subscription via contentService.subscribeToChats
 * - Send messages with Enter key (Shift+Enter for newline)
 * - Auto-scroll to latest message
 * - Own vs. other message bubble alignment
 * - Glassmorphism design matching the app's design system
 * - Framer Motion enter/exit animations
 * - Accessible: ARIA roles, keyboard navigation, focus management
 * - Respects prefers-reduced-motion
 *
 * Usage:
 * ```tsx
 * <ChatModal
 *   sessionId="abc123"
 *   currentUser={user}
 *   onClose={() => setActiveChatId(null)}
 * />
 * ```
 */

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useLayoutEffect,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { contentService } from '../services/contentService';
import type { ChatMessage, ChatSession, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatModalProps {
    sessionId: string;
    currentUser: User;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Unix millisecond timestamp into a HH:MM string.
 */
function formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns true when two consecutive messages should display a sender label
 * between them (i.e. the sender changed since the previous message).
 */
function showSenderLabel(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return true;
    return messages[index - 1].senderEmail !== messages[index].senderEmail;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    showLabel: boolean;
    otherEmail: string;
    t: (key: string, opts?: any) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwn,
    showLabel,
    t,
}) => {
    return (
        <div
            className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
        >
            {showLabel && (
                <span className="text-[10px] text-slate-500 font-mono px-1 select-none">
                    {isOwn ? t('chatYou') : message.senderEmail}
                </span>
            )}

            <div
                className={`
                    relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm border
                    ${isOwn
                        ? 'bg-primary/20 border-primary/30 text-white self-end'
                        : 'bg-white/10 border-white/10 text-slate-200 self-start'
                    }
                `}
            >
                {/* Preserve line breaks (Shift+Enter) */}
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.text}
                </p>
            </div>

            <span className="text-[10px] text-slate-500 font-mono px-1 select-none">
                {formatTime(message.timestamp)}
            </span>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ChatModal: React.FC<ChatModalProps> = ({
    sessionId,
    currentUser,
    onClose,
}) => {
    const { t } = useTranslations();

    // Session state
    const [session, setSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    // Input state
    const [inputText, setInputText] = useState('');

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ------------------------------------------------------------------
    // Subscribe to Firestore chats and filter to this session
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!currentUser?.email) return;

        const unsubscribe = contentService.subscribeToChats(
            currentUser.email,
            (sessions: ChatSession[]) => {
                const found = sessions.find((s) => s.id === sessionId) ?? null;
                setSession(found);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser.email, sessionId]);

    // ------------------------------------------------------------------
    // Auto-scroll to bottom when messages change
    // ------------------------------------------------------------------
    useLayoutEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [session?.messages]);

    // ------------------------------------------------------------------
    // Escape key to close
    // ------------------------------------------------------------------
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // ------------------------------------------------------------------
    // Focus textarea on open
    // ------------------------------------------------------------------
    useEffect(() => {
        const timer = setTimeout(() => textareaRef.current?.focus(), 150);
        return () => clearTimeout(timer);
    }, []);

    // ------------------------------------------------------------------
    // Send message
    // ------------------------------------------------------------------
    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isSending) return;

        setSendError(null);
        setIsSending(true);
        setInputText('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const message: ChatMessage = {
            senderEmail: currentUser.email,
            text,
            timestamp: Date.now(),
        };

        try {
            await contentService.sendChatMessage(sessionId, message);
        } catch {
            setSendError(t('chatSendError'));
            // Restore the text so the user doesn't lose their message
            setInputText(text);
        } finally {
            setIsSending(false);
        }
    }, [inputText, isSending, currentUser.email, sessionId, t]);

    // ------------------------------------------------------------------
    // Textarea keyboard handler
    // ------------------------------------------------------------------
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    // ------------------------------------------------------------------
    // Auto-grow textarea (1–3 rows)
    // ------------------------------------------------------------------
    const handleInput = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInputText(e.target.value);
            const el = e.target;
            el.style.height = 'auto';
            const maxHeight = parseInt(getComputedStyle(el).lineHeight) * 3 + 24;
            el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        },
        []
    );

    // ------------------------------------------------------------------
    // Derive the "other party" email for the header label
    // ------------------------------------------------------------------
    const otherEmail = session
        ? session.ownerEmail === currentUser.email
            ? session.finderEmail
            : session.ownerEmail
        : '';

    const otherRole =
        session?.ownerEmail === currentUser.email
            ? t('chatFinder')
            : t('chatOwner');

    // ------------------------------------------------------------------
    // Overlay click to close
    // ------------------------------------------------------------------
    const handleOverlayClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose();
        },
        [onClose]
    );

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <AnimatePresence>
            {/* Overlay */}
            <motion.div
                key="chat-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
                onClick={handleOverlayClick}
                aria-modal="true"
                role="dialog"
                aria-label={
                    session
                        ? t('chatWithPet', { petName: session.petName })
                        : t('chatTitle')
                }
            >
                {/* Modal card */}
                <motion.div
                    key="chat-modal-card"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{
                        duration: 0.3,
                        ease: [0.05, 0.7, 0.1, 1], // MD3 emphasized decelerate
                    }}
                    className="
                        relative w-full max-w-lg mx-4
                        max-h-[80vh] flex flex-col
                        bg-slate-900/95 border border-white/10
                        rounded-2xl shadow-2xl overflow-hidden
                    "
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* --------------------------------------------------
                        Header
                    -------------------------------------------------- */}
                    <div className="
                        flex items-center gap-3 px-4 py-3
                        border-b border-white/10
                        bg-white/5 flex-shrink-0
                    ">
                        {/* Pet photo */}
                        {session?.petPhotoUrl ? (
                            <img
                                src={session.petPhotoUrl}
                                alt={session.petName}
                                className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10"
                            />
                        ) : (
                            <div className="
                                w-10 h-10 rounded-xl flex-shrink-0
                                bg-primary/20 border border-primary/30
                                flex items-center justify-center
                                text-lg
                            ">
                                🐾
                            </div>
                        )}

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate leading-tight">
                                {session?.petName ?? t('chatTitle')}
                            </p>
                            <p className="text-slate-400 text-[11px] truncate font-mono leading-tight mt-0.5">
                                <span className="text-slate-500">{otherRole}:</span>{' '}
                                {otherEmail}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="
                                w-8 h-8 flex-shrink-0 rounded-lg
                                flex items-center justify-center
                                text-slate-400 hover:text-white
                                hover:bg-white/10 transition-all duration-200
                                focus-visible:outline-none focus-visible:ring-2
                                focus-visible:ring-primary/60
                            "
                            aria-label={t('closeButton')}
                        >
                            <svg
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="w-4 h-4"
                                aria-hidden="true"
                            >
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                        </button>
                    </div>

                    {/* --------------------------------------------------
                        Messages area
                    -------------------------------------------------- */}
                    <div
                        ref={scrollContainerRef}
                        className="
                            flex-1 overflow-y-auto
                            px-4 py-4 space-y-3
                            scrollbar-thin scrollbar-thumb-white/10
                            scrollbar-track-transparent
                        "
                        aria-live="polite"
                        aria-label={t('chatMessages')}
                    >
                        {isLoading ? (
                            /* Skeleton loader */
                            <div className="flex flex-col gap-3 animate-pulse">
                                {[60, 75, 55].map((w, i) => (
                                    <div
                                        key={i}
                                        className={`
                                            h-9 rounded-2xl bg-white/10
                                            ${i % 2 === 0 ? 'self-start' : 'self-end'}
                                        `}
                                        style={{ width: `${w}%` }}
                                    />
                                ))}
                            </div>
                        ) : session && session.messages.length > 0 ? (
                            <>
                                {session.messages.map((msg, idx) => (
                                    <MessageBubble
                                        key={`${msg.senderEmail}-${msg.timestamp}-${idx}`}
                                        message={msg}
                                        isOwn={msg.senderEmail === currentUser.email}
                                        showLabel={showSenderLabel(session.messages, idx)}
                                        otherEmail={otherEmail}
                                        t={t}
                                    />
                                ))}
                            </>
                        ) : (
                            /* Empty state */
                            <div className="
                                flex flex-col items-center justify-center
                                h-full min-h-[160px] gap-3
                                text-center
                            ">
                                <span
                                    className="text-4xl"
                                    role="img"
                                    aria-label="wave"
                                >
                                    👋
                                </span>
                                <p className="text-slate-400 text-sm">
                                    {t('chatNoMessages')}
                                </p>
                            </div>
                        )}

                        {/* Anchor for auto-scroll */}
                        <div ref={messagesEndRef} aria-hidden="true" />
                    </div>

                    {/* --------------------------------------------------
                        Send error banner
                    -------------------------------------------------- */}
                    <AnimatePresence>
                        {sendError && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.2 }}
                                className="
                                    mx-4 mb-0 px-3 py-2 rounded-xl
                                    bg-red-500/15 border border-red-500/30
                                    text-red-300 text-xs text-center
                                "
                                role="alert"
                            >
                                {sendError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --------------------------------------------------
                        Input row
                    -------------------------------------------------- */}
                    <div className="
                        flex items-end gap-2
                        px-4 py-3 border-t border-white/10
                        bg-white/5 flex-shrink-0
                    ">
                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder={t('typeMessagePlaceholder')}
                            rows={1}
                            disabled={isSending || isLoading}
                            aria-label={t('typeMessagePlaceholder')}
                            className="
                                flex-1 resize-none bg-white/5 border border-white/10
                                rounded-xl px-3 py-2.5 text-sm text-white
                                placeholder:text-slate-500
                                focus:outline-none focus:border-primary/50
                                focus:bg-white/8
                                transition-all duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed
                                leading-relaxed
                                min-h-[40px] max-h-[96px]
                            "
                            style={{ overflowY: 'hidden' }}
                        />

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || isSending || isLoading}
                            aria-label={t('chatSendButton')}
                            className="
                                w-10 h-10 flex-shrink-0 rounded-xl
                                flex items-center justify-center
                                bg-primary/80 hover:bg-primary
                                disabled:bg-white/10 disabled:cursor-not-allowed
                                text-white disabled:text-slate-500
                                transition-all duration-200
                                focus-visible:outline-none focus-visible:ring-2
                                focus-visible:ring-primary/60
                                active:scale-95
                            "
                        >
                            {isSending ? (
                                /* Spinner */
                                <svg
                                    className="w-4 h-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            ) : (
                                /* Send icon (paper plane) */
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                >
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Hint: Shift+Enter for newline */}
                    <p className="
                        text-center text-[10px] text-slate-600
                        pb-2 px-4 select-none flex-shrink-0
                    ">
                        {t('chatShiftEnterHint')}
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatModal;
