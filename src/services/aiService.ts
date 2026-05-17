
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, Geolocation, ChatSession, BlogPost, AIInsight, Appointment } from '../types';
import * as Prompts from './prompts';
import { captureError } from './monitoringService';
import { identifyBreedLocally } from './localInferenceService';

// --- SPECIALIZED CLOUD FUNCTION CALLERS ---

const callVisionAI = async (image: string, task: 'autofill' | 'identikit' | 'describe', locale: string = 'en') => {
    const fn = httpsCallable(functions, 'visionIdentification');
    const result = await fn({ image, task, locale });
    return result.data as { success: boolean, text: string };
};

const callSmartSearchAI = async (query: string) => {
    const fn = httpsCallable(functions, 'smartSearch');
    const result = await fn({ query });
    return result.data as { success: boolean, text: string };
};

const callHealthAssessmentAI = async (pet: PetProfile, symptoms: string, locale: string = 'en') => {
    const fn = httpsCallable(functions, 'healthAssessment');
    const result = await fn({ pet, symptoms, locale });
    return result.data as { success: boolean, text: string };
};

const callBlogGenerationAI = async (topic: string) => {
    const fn = httpsCallable(functions, 'blogGeneration');
    const result = await fn({ topic });
    return result.data as { success: boolean, text: string };
};

const callUniversalAI = async (task: string, contents: any, config: any = {}) => {
    const fn = httpsCallable(functions, 'callGemini'); // Unified caller on backend
    const result = await fn({ task, contents, config });
    return result.data as { success: boolean, text: string, mediaData?: string, groundingMetadata?: any };
};

// --- ERROR HANDLING & RETRY ---

const checkRateLimitError = (error: any) => {
    if (error.code === 'functions/resource-exhausted' || error.message?.includes("quota") || error.message?.includes("exceeded")) {
        window.dispatchEvent(new CustomEvent('pawprint_rate_limit', {
            detail: { message: error.message || "Daily AI limit reached." }
        }));
        return true;
    }
    return false;
};

async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000,
    factor = 2
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (checkRateLimitError(error)) throw error;

        if (error.message?.includes("Requested entity was not found.")) {
            window.dispatchEvent(new CustomEvent('pawprint_api_error', { detail: { message: error.message } }));
        }

        if (retries === 0 || error.status === 400) {
            captureError(error, { context: "AI Request Final Failure", retries });
            throw error;
        }
        console.warn(`AI Request failed. Retrying in ${delay}ms... (${retries} attempts left). Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(operation, retries - 1, delay * factor, factor);
    }
}

// --- FILE UTILITIES ---

const fileToBase64 = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (onProgress) onProgress(100);
            resolve((reader.result as string).split(',')[1]);
        };
        reader.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 99);
                onProgress(percent);
            }
        };
        reader.readAsDataURL(file);
    });
};

const fileToGenerativePart = async (file: File, onProgress?: (percent: number) => void): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    const base64 = await fileToBase64(file, onProgress);
    return {
        inlineData: { data: base64, mimeType: file.type },
    };
};

// --- EXPORTED NAMED FUNCTIONS ---

export const autoFillPetDetails = async (photo: File, locale: string = 'en'): Promise<any> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const localResult = await identifyBreedLocally(photo);
        return { breed: localResult.breed, color: "Detected Offline", size: "Detected Offline", isLocal: true };
    }
    return retryWithBackoff(async () => {
        const base64 = await fileToBase64(photo);
        const response = await callVisionAI(base64, 'autofill', locale);
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const analyzeImageForDescription = async (photo: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const base64 = await fileToBase64(photo);
        const response = await callVisionAI(base64, 'describe');
        return response.text || "No description generated.";
    });
};

export const identifyBreedFromImage = async (photo: File, locale: string = 'en'): Promise<string> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const localResult = await identifyBreedLocally(photo);
        return localResult.breed;
    }
    return retryWithBackoff(async () => {
        const base64 = await fileToBase64(photo);
        const response = await callVisionAI(base64, 'describe', locale);
        return response.text?.trim() || "Unknown Breed";
    });
};

export const generatePetIdentikit = async (photo: File, locale: string = 'en'): Promise<{ code: string, description: string }> => {
    return retryWithBackoff(async () => {
        const base64 = await fileToBase64(photo);
        const response = await callVisionAI(base64, 'identikit', locale);
        const json = JSON.parse(response.text?.trim() || "{}");
        return {
            code: json.visualIdentityCode || "UNKNOWN",
            description: json.physicalDescription || "No description generated."
        };
    });
};

export const comparePets = async (foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> => {
    return retryWithBackoff(async () => {
        const validPhotos = lostPet.photos.filter(p => p.file !== undefined);
        const lostPetPhotoParts = await Promise.all(validPhotos.map(p => fileToGenerativePart(p.file!)));
        const { systemInstruction, userPrompt } = Prompts.getPetComparisonParts(foundPetDesc, lostPet);

        const response = await callUniversalAI('matching', {
            parts: [...lostPetPhotoParts, { text: userPrompt }]
        }, {
            systemInstruction,
            responseMimeType: "application/json"
        });
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const analyzeVideo = async (videoFile: File, onProgress?: (percent: number) => void): Promise<string> => {
    return retryWithBackoff(async () => {
        const videoPart = await fileToGenerativePart(videoFile, onProgress);
        const prompt = Prompts.getVideoAnalysisPrompt();
        const response = await callUniversalAI('vision', { parts: [videoPart, { text: prompt }] });
        if (onProgress) onProgress(100);
        return response.text || "";
    });
};

export const transcribeAudio = async (audioFile: File, onProgress?: (percent: number) => void): Promise<string> => {
    return retryWithBackoff(async () => {
        const audioPart = await fileToGenerativePart(audioFile, onProgress);
        const prompt = Prompts.getAudioTranscriptionPrompt();
        const response = await callUniversalAI('chat', { parts: [audioPart, { text: prompt }] });
        if (onProgress) onProgress(100);
        return response.text || "";
    });
};

export const findNearbyVets = async (location: Geolocation): Promise<{ text: string, places: any[] }> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', Prompts.getNearbyVetsPrompt(), {
            tools: [{ googleMaps: {} }],
            toolConfig: { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } }
        });
        const groundingChunks = response.groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", places: groundingChunks };
    });
};

export const findVetsByQuery = async (query: string): Promise<{ text: string, places: any[] }> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', Prompts.getVetsByQueryPrompt(query), {
            tools: [{ googleMaps: {} }]
        });
        const groundingChunks = response.groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", places: groundingChunks };
    });
};

export const findClinicOnGoogleMaps = async (name: string, city: string): Promise<any[]> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', Prompts.getFindClinicPrompt(name, city), {
            tools: [{ googleMaps: {} }]
        });
        const groundingChunks = response.groundingMetadata?.groundingChunks || [];
        return groundingChunks.map((chunk: any) => {
            if (!chunk.maps) return null;
            return {
                title: (chunk.maps as any).title,
                address: (chunk.maps as any).address,
                phone: (chunk.maps as any).phoneNumber,
                website: (chunk.maps as any).websiteUri,
                rating: (chunk.maps as any).rating,
                userRatingCount: (chunk.maps as any).userRatingCount,
                placeId: (chunk.maps as any).placeId
            };
        }).filter(Boolean);
    });
};

export const textToSpeech = async (text: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', [{ parts: [{ text }] }], {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        });
        if (!response.mediaData) throw new Error("No audio data received.");
        return response.mediaData;
    });
};

export const draftVetMessageToOwner = async (pet: PetProfile, topic: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getVetMessageDraftParts(pet, topic);
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', { parts: [{ text: userPrompt }] }, { systemInstruction });
        return response.text || "";
    });
};

export const queryVetPatientData = async (patients: PetProfile[], appointments: Appointment[], query: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getVetDataQueryParts(patients, appointments, query);
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', { parts: [{ text: userPrompt }] }, { systemInstruction });
        return response.text || "";
    });
};

export const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
    const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);
    try {
        const response = await callUniversalAI('chat', { parts: [{ text: userPrompt }] }, {
            systemInstruction,
            responseMimeType: "application/json"
        });
        const parsed = JSON.parse(response.text?.trim() || "{}");
        return parsed.suggestions || [];
    } catch (e) {
        console.error("Error generating chat suggestions:", e);
        return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
    }
};

export const performAIHealthCheck = async (pet: PetProfile, symptoms: string, locale: string = 'en'): Promise<string> => {
    return retryWithBackoff(async () => {
        const response = await callHealthAssessmentAI(pet, symptoms, locale);
        return response.text || "Analysis unavailable.";
    });
};

export const generateBlogPost = async (topic: string): Promise<Partial<BlogPost>> => {
    return retryWithBackoff(async () => {
        const response = await callBlogGenerationAI(topic);
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateSuccessStory = async (pet: PetProfile): Promise<Partial<BlogPost>> => {
    return retryWithBackoff(async () => {
        const response = await callBlogGenerationAI(`Success story for ${pet.name} (${pet.breed}) being reunited with owner.`);
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const parseSearchQuery = async (query: string): Promise<any> => {
    return retryWithBackoff(async () => {
        const response = await callSmartSearchAI(query);
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateImage = async (prompt: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('vision', { parts: [{ text: prompt }] }, {
            imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
        });
        if (!response.mediaData) throw new Error("No image data received.");
        return `data:image/png;base64,${response.mediaData}`;
    });
};

export const calculateProfileCompleteness = (pet: PetProfile): number => {
    let score = 0;
    if (pet.name && pet.breed) score += 20;
    if (pet.photos && pet.photos.length > 0) {
        const validPhotos = pet.photos.filter(p => p !== undefined).length;
        score += Math.min(5, validPhotos) * 10;
    }
    if (pet.homeLocations && pet.homeLocations.length > 0) score += 10;
    if (pet.medicalRecord) {
        if ((pet.medicalRecord.vaccinations?.length || 0) > 0 ||
            pet.medicalRecord.allergies ||
            pet.medicalRecord.chronicConditions) {
            score += 10;
        }
    }
    if (pet.aiIdentityCode || pet.videoAnalysis) score += 10;
    return Math.min(100, score);
};

export const translateContent = async (text: string, targetLangs: string[]): Promise<Record<string, string>> => {
    const { systemInstruction, userPrompt } = Prompts.getTranslationPrompt(text, targetLangs);
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', { parts: [{ text: userPrompt }] }, {
            systemInstruction,
            responseMimeType: "application/json",
        });
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateHealthInsights = async (pet: PetProfile): Promise<AIInsight[]> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('triage', { parts: [{ text: Prompts.getHealthInsightsPrompt(pet) }] }, {
            responseMimeType: "application/json"
        });
        const insights = JSON.parse(response.text?.trim() || "[]");
        return insights.map((insight: any) => ({
            ...insight,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        }));
    });
};

export const generateMatchExplanation = async (pet: PetProfile, filters: any): Promise<string> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('matching', { parts: [{ text: Prompts.getMatchExplanationPrompt(pet, filters) }] });
        return response.text?.trim() || "Matches your preferences.";
    });
};

export const chat = async (
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    systemPrompt: string
): Promise<string> => {
    return retryWithBackoff(async () => {
        const response = await callUniversalAI('chat', {
            parts: history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }))
        }, { systemInstruction: systemPrompt });
        return response.text?.trim() || "";
    });
};

export const fetchAvailableModels = async (): Promise<{ id: string, name: string }[]> => {
    return retryWithBackoff(async () => {
        const fn = httpsCallable(functions, 'fetchOpenRouterModels');
        const result = await fn();
        const data = result.data as { models: { id: string, name: string }[] };
        return data.models || [];
    });
};

// --- OBJECT EXPORT FOR BRIDGE ---
export const aiService = {
    autoFillPetDetails,
    analyzeImageForDescription,
    identifyBreedFromImage,
    generatePetIdentikit,
    comparePets,
    analyzeVideo,
    transcribeAudio,
    findNearbyVets,
    findVetsByQuery,
    findClinicOnGoogleMaps,
    textToSpeech,
    draftVetMessageToOwner,
    queryVetPatientData,
    generateChatSuggestions,
    performAIHealthCheck,
    generateBlogPost,
    generateSuccessStory,
    parseSearchQuery,
    generateImage,
    calculateProfileCompleteness,
    translateContent,
    generateHealthInsights,
    generateMatchExplanation,
    chat,
    fetchAvailableModels
};
