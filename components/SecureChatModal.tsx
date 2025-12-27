
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, User, ChatMessage } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { dbService, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { LoadingSpinner } from './LoadingSpinner';

interface SecureChatModalProps {
  session: ChatSession;
  currentUser: User;
  onClose: () => void;
}

export const SecureChatModal: React.FC<SecureChatModalProps> = ({ session: initialSession, currentUser, onClose }) => {
  const { t } = useTranslations();
  const [session, setSession] = useState(initialSession);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time Message Listener for this specific session
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'chats', session.id), (doc) => {
        if (doc.exists()) {
            setSession(doc.data() as ChatSession);
        }
    });
    return () => unsub();
  }, [session.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const msg: ChatMessage = {
        senderEmail: currentUser.email,
        text: newMessage.trim(),
        timestamp: Date.now()
    };

    try {
        await dbService.sendChatMessage(session.id, msg);
        setNewMessage('');
    } catch (err) {
        console.error("Chat send error:", err);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col h-[70vh] border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center space-x-3">
            <img src={session.petPhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary"/>
            <div>
                <h3 className="font-bold text-foreground">{session.petName} Chat</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secure Encryption Active</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
          {session.messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.senderEmail === currentUser.email ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.senderEmail === currentUser.email 
                  ? 'bg-primary text-white rounded-br-none shadow-md' 
                  : 'bg-muted text-foreground rounded-bl-none border border-border'
              }`}>
                {msg.text}
                <p className={`text-[8px] mt-1 opacity-60 ${msg.senderEmail === currentUser.email ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-muted/20 border-t border-border">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder={t('typeMessagePlaceholder')} 
                className="input-base flex-grow !rounded-full px-5" 
            />
            <button type="submit" disabled={!newMessage.trim() || isSending} className="btn btn-primary !rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg">
                {isSending ? <LoadingSpinner /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
