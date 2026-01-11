
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob, FunctionDeclaration, Type } from "@google/genai";
import { decode, encode, decodeAudioData } from '../services/audioService';
import { useTranslations } from '../hooks/useTranslations';
import { CameraCaptureModal } from './CameraCaptureModal';
import { UserRole } from '../types';

type ChatEntry = {
    speaker: 'user' | 'model';
    text?: string;
    imageUrl?: string;
};

export type AssistantTools = {
    navigateToView: (view: string) => void;
};

interface LiveAssistantProps {
    currentUserRole?: UserRole | null;
    tools?: AssistantTools;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

const AudioVisualizer: React.FC<{ stream: MediaStream | null, isActive: boolean }> = ({ stream, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const contextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!isActive || !stream) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        contextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                const hue = i * 5 + 170; // Teal hue
                ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;

                const y = (canvas.height - barHeight) / 2;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, 5);
                ctx.fill();

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            audioContext.close();
        };
    }, [stream, isActive]);

    if (!isActive) return (
        <div className="h-12 w-full flex items-center justify-center">
            <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    );

    return <canvas ref={canvasRef} width={300} height={48} className="w-full h-12" />;
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ currentUserRole, tools }) => {
    const { t } = useTranslations();

    // State
    const [status, setStatus] = useState(t('statusNotConnected'));
    const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
    const [textInput, setTextInput] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isError, setIsError] = useState(false);

    // Refs
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const chatLogContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const scrollToBottom = useCallback(() => {
        if (chatLogContainerRef.current) {
            chatLogContainerRef.current.scrollTop = chatLogContainerRef.current.scrollHeight;
        }
    }, []);

    useEffect(scrollToBottom, [chatLog]);

    const stopMicrophone = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        setIsMicActive(false);
    }, []);

    // Tool Declarations for Logged-In Users
    const getTools = (): FunctionDeclaration[] => {
        if (!currentUserRole) return [];
        return [
            {
                name: "navigate_to_section",
                description: "Navigates the user to a specific section of the app.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        view: {
                            type: Type.STRING,
                            description: "The view ID to navigate to. Options: 'dashboard', 'myPatients', 'myClinic', 'smartCalendar', 'community', 'donors'.",
                        }
                    },
                    required: ["view"]
                }
            }
        ];
    };

    // Core session management
    const startSession = useCallback(() => {
        if (sessionPromiseRef.current) return;

        setStatus(t('statusConnecting'));
        setIsError(false);

        const systemInstruction = currentUserRole
            ? t('aiSystemPromptUser', { role: currentUserRole })
            : t('liveAssistantSystemPrompt');

        // FIX: Guidelines state we must create the GoogleGenAI instance right before connecting
        // Use the new standard for Vite env vars
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
          console.error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
          setChatLog(prev => [...prev, { speaker: 'model', text: "System Error: AI Identity Module not initialized (Missing API Key)." }]);
          setStatus(t('statusError'));
          return;
      }
      const ai = new GoogleGenAI({ apiKey });
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => setStatus(t('statusReady')),
                onmessage: async (message: LiveServerMessage) => {
                    const { inputTranscription, outputTranscription, turnComplete } = message.serverContent || {};

                    if (inputTranscription?.text) {
                        currentInputTranscriptionRef.current += inputTranscription.text;
                        setChatLog(prev => {
                            const newLog = [...prev];
                            const last = newLog[newLog.length - 1];
                            if (last?.speaker === 'user' && !last.imageUrl) {
                                last.text = currentInputTranscriptionRef.current;
                            } else {
                                newLog.push({ speaker: 'user', text: currentInputTranscriptionRef.current });
                            }
                            return newLog;
                        });
                    }

                    if (outputTranscription?.text) {
                        if (currentInputTranscriptionRef.current) {
                            currentInputTranscriptionRef.current = '';
                        }
                        currentOutputTranscriptionRef.current += outputTranscription.text;
                        setChatLog(prev => {
                            const newLog = [...prev];
                            const last = newLog[newLog.length - 1];
                            if (last?.speaker === 'model') {
                                last.text = currentOutputTranscriptionRef.current;
                            } else {
                                newLog.push({ speaker: 'model', text: currentOutputTranscriptionRef.current });
                            }
                            return newLog;
                        });
                    }

                    if (turnComplete) {
                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        }
                        const ctx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }

                    // Handle Tool Calls
                    if (message.toolCall?.functionCalls) {
                        for (const fc of message.toolCall.functionCalls) {
                            let result = { result: "ok" };

                            if (fc.name === "navigate_to_section" && tools?.navigateToView) {
                                const view = (fc.args as any).view;
                                tools.navigateToView(view);
                                setChatLog(prev => [...prev, { speaker: 'model', text: t('aiToolNavigating', { view }) }]);
                            }

                            sessionPromise.then(session => {
                                session.sendToolResponse({
                                    functionResponses: [{
                                        id: fc.id,
                                        name: fc.name,
                                        response: result
                                    }]
                                });
                            });
                        }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    // If key selection error, notify main app
                    if (e.message?.includes("Requested entity was not found.")) {
                        window.dispatchEvent(new CustomEvent('pawprint_api_error', { detail: { message: e.message } }));
                    }

                    const msg = e.message?.includes('unavailable')
                        ? 'Service temporarily unavailable'
                        : (e.message || 'Connection error');
                    setStatus(`${t('statusError')}: ${msg}`);
                    setIsError(true);
                    sessionPromiseRef.current = null;
                    stopMicrophone();
                },
                onclose: () => {
                    setStatus(t('statusConnectionClosed'));
                    sessionPromiseRef.current = null;
                    stopMicrophone();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                outputAudioTranscription: {},
                inputAudioTranscription: {},
                systemInstruction: systemInstruction,
                tools: currentUserRole ? [{ functionDeclarations: getTools() }] : undefined,
            },
        });
        sessionPromiseRef.current = sessionPromise;
    }, [t, stopMicrophone, currentUserRole, tools]);

    const startMicrophone = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob: GenAIBlob = {
                    data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                // CRITICAL: Solely rely on sessionPromise resolves to send input
                sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);
            setIsMicActive(true);
            setStatus(t('statusConnected'));
        } catch (err) {
            console.error('Failed to start microphone:', err);
            setStatus(t('statusMicError'));
        }
    }, [t]);

    const toggleMicrophone = () => {
        if (isMicActive) {
            stopMicrophone();
            setStatus(t('statusReady'));
        } else {
            if (!sessionPromiseRef.current) {
                startSession();
            }
            startMicrophone();
        }
    };

    const retryConnection = () => {
        sessionPromiseRef.current = null;
        startSession();
    };

    const sendText = (text: string) => {
        if (!text.trim()) return;
        if (!sessionPromiseRef.current) startSession();
        setChatLog(prev => [...prev, { speaker: 'user', text }]);
        sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ text: text.trim() }));
        setTextInput('');
    };

    const sendImage = async (blob: Blob) => {
        try {
            if (!sessionPromiseRef.current) startSession();
            const base64Data = await blobToBase64(blob);
            const mimeType = blob.type;
            const imageUrl = URL.createObjectURL(blob);
            setChatLog(prev => [...prev, { speaker: 'user', imageUrl }]);
            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: { data: base64Data, mimeType } }));
        } catch (error) {
            console.error("Error sending image:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            sendImage(e.target.files[0]);
        }
    };

    // Auto-start session on mount
    useEffect(() => {
        startSession();
        return () => {
            sessionPromiseRef.current?.then(s => s.close());
        };
    }, [startSession]);

    return (
        <div className="h-full flex flex-col bg-background/50">
            {/* Visualizer Area */}
            <div className={`flex-shrink-0 border-b border-white/5 bg-black/5 p-1 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${isMicActive ? 'h-14' : 'h-8'}`}>
                <AudioVisualizer stream={mediaStreamRef.current} isActive={isMicActive} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/10 pointer-events-none"></div>
                {!isMicActive && <p className="text-[10px] text-muted-foreground absolute font-medium tracking-wide opacity-70">{t('tapMicToSpeak')}</p>}
            </div>

            {/* Chat Messages */}
            <div ref={chatLogContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4 scroll-smooth pb-20">
                {chatLog.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-90 p-4">
                        <div className="w-40 h-40 mb-4 relative rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border-4 border-white/20 shadow-inner">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
                                alt="AI Assistant"
                                className="w-28 h-28 object-cover animate-pulse-glow"
                            />
                        </div>
                        <h4 className="text-xl font-bold text-foreground">{t('liveAssistantWelcomeTitle')}</h4>
                        <p className="text-muted-foreground mt-2 text-base leading-relaxed max-w-xs">{t('liveAssistantWelcomeDesc')}</p>
                    </div>
                )}
                {chatLog.map((entry, index) => (
                    <div key={index} className={`flex items-end gap-2 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        {entry.speaker === 'model' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm overflow-hidden border border-white/20">
                                <span className="text-white text-[10px] font-bold">{t('aiLabel')}</span>
                            </div>
                        )}
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-base ${entry.speaker === 'user'
                            ? 'bg-primary text-white rounded-br-none shadow-md'
                            : 'bg-card/90 backdrop-blur-md border border-white/20 text-foreground rounded-bl-none shadow-sm'
                            }`}>
                            {entry.text && <p className="leading-relaxed">{entry.text}</p>}
                            {entry.imageUrl && <img src={entry.imageUrl} alt="User upload" className="rounded-lg max-w-full h-auto mt-2 border border-white/20" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 bg-card/90 backdrop-blur-xl border-t border-white/10 pb-safe">
                <form onSubmit={(e) => { e.preventDefault(); sendText(textInput); }} className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>

                    <button type="button" onClick={() => setIsCameraOpen(true)} className="p-3 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>

                    <input
                        type="text"
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        placeholder={t('typeMessagePlaceholder')}
                        className="flex-grow bg-muted/50 border border-transparent focus:border-primary/50 rounded-full px-4 py-3 text-base focus:ring-0 transition-all placeholder:text-muted-foreground/60"
                    />

                    {textInput.trim() ? (
                        <button type="submit" className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-md transform active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={toggleMicrophone}
                            disabled={isError}
                            className={`p-3 rounded-full transition-all duration-300 shadow-lg transform active:scale-95 ${isMicActive ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white'} ${isError ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                        </button>
                    )}
                </form>
                <div className="flex items-center justify-center mt-2 h-4">
                    {isError ? (
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-red-500">{status}</p>
                            <button onClick={retryConnection} className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded hover:bg-red-200 font-bold">{t('retryButton')}</button>
                        </div>
                    ) : (
                        <p className="text-[10px] text-muted-foreground/60">{status}</p>
                    )}
                </div>
            </div>
            <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={sendImage}
            />
        </div>
    );
};
