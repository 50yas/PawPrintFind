
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PetProfile, Geolocation, PhotoWithMarks, Appointment, ChatSession, HealthCheck, BlogPost, AIInsight } from '../types';
import * as Prompts from './prompts';
import { captureError } from './monitoringService';

/**
 * Calls the Cloud Function to interact with Gemini AI.
 * This ensures the API key remains secret and allows for server-side rate limiting.
 */
const callGeminiFunction = async (model: string, contents: any, config?: any) => {
    const callGemini = httpsCallable(functions, 'callGemini');
    const result = await callGemini({ model, contents, config });
    return result.data as { success: boolean, text: string };
};

// --- UTILITY: Exponential Backoff Retry Wrapper ---
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000,
    factor = 2
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // If the request fails with "Requested entity was not found", it indicates an issue with the current key selection.
        if (error.message?.includes("Requested entity was not found.")) {
            window.dispatchEvent(new CustomEvent('pawprint_api_error', { detail: { message: error.message } }));
        }

        if (retries === 0 || error.status === 400) { // Don't retry Bad Requests
            captureError(error, { context: "Gemini AI Request Final Failure", retries });
            throw error;
        }
        console.warn(`AI Request failed. Retrying in ${delay}ms... (${retries} attempts left). Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(operation, retries - 1, delay * factor, factor);
    }
}

const fileToGenerativePart = async (file: File, onProgress?: (percent: number) => void) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (onProgress) onProgress(100);
            resolve((reader.result as string).split(',')[1])
        };
        reader.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 99);
                onProgress(percent);
            }
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const autoFillPetDetails = async (photo: File): Promise<any> => {
    return retryWithBackoff(async () => {
        const imagePart = await fileToGenerativePart(photo);
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [imagePart, { text: Prompts.getAutoFillPetDetailsPrompt() }] },
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        breed: { type: Type.STRING },
                        color: { type: Type.STRING },
                        age: { type: Type.STRING },
                        size: { type: Type.STRING },
                        gender: { type: Type.STRING }
                    },
                    required: ["breed", "color", "size"]
                }
            }
        );
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const analyzeImageForDescription = async (photo: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const imagePart = await fileToGenerativePart(photo);
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [imagePart, { text: Prompts.getImageDescriptionPrompt() }] }
        );
        return response.text || "No description generated.";
    });
};

export const identifyBreedFromImage = async (photo: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const imagePart = await fileToGenerativePart(photo);
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [imagePart, { text: Prompts.getBreedIdentificationPrompt() }] }
        );
        return response.text?.trim() || "Unknown Breed";
    });
};

export const generatePetIdentikit = async (photo: File): Promise<{ code: string, description: string }> => {
    return retryWithBackoff(async () => {
        const imagePart = await fileToGenerativePart(photo);
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [imagePart, { text: Prompts.getPetIdentikitPrompt() }] },
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        visualIdentityCode: { type: Type.STRING },
                        physicalDescription: { type: Type.STRING }
                    },
                    required: ["visualIdentityCode", "physicalDescription"]
                }
            }
        );
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

        const response = await callGeminiFunction(
            'gemini-2.5-pro',
            { parts: [...lostPetPhotoParts, { text: userPrompt }] },
            {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING },
                        keyMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
                        discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["score", "reasoning", "keyMatches", "discrepancies"],
                },
                thinkingConfig: { thinkingBudget: 32768 }
            }
        );

        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const analyzeVideo = async (videoFile: File, onProgress?: (percent: number) => void): Promise<string> => {
    return retryWithBackoff(async () => {
        const videoPart = await fileToGenerativePart(videoFile, onProgress);
        const prompt = Prompts.getVideoAnalysisPrompt();

        const response = await callGeminiFunction(
            'gemini-2.5-pro',
            { parts: [videoPart, { text: prompt }] }
        );
        if (onProgress) onProgress(100);
        return response.text || "";
    });
};

export const transcribeAudio = async (audioFile: File, onProgress?: (percent: number) => void): Promise<string> => {
    return retryWithBackoff(async () => {
        const audioPart = await fileToGenerativePart(audioFile, onProgress);
        const prompt = Prompts.getAudioTranscriptionPrompt();

        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [audioPart, { text: prompt }] }
        );
        if (onProgress) onProgress(100);
        return response.text || "";
    });
};

export const findNearbyVets = async (location: Geolocation): Promise<{ text: string, places: any[] }> => {
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            "gemini-2.5-flash",
            Prompts.getNearbyVetsPrompt(),
            {
                tools: [{ googleMaps: {} }],
                toolConfig: { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } }
            }
        );
        const groundingChunks = (response as any).groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", places: groundingChunks }; 
    });
};

export const findVetsByQuery = async (query: string): Promise<{ text: string, places: any[] }> => {
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            "gemini-2.5-flash",
            Prompts.getVetsByQueryPrompt(query),
            { tools: [{ googleMaps: {} }] }
        );
        const groundingChunks = (response as any).groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", places: groundingChunks };
    });
};

export const findClinicOnGoogleMaps = async (name: string, city: string): Promise<any[]> => {
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            "gemini-2.5-flash",
            Prompts.getFindClinicPrompt(name, city),
            { tools: [{ googleMaps: {} }] }
        );

        const groundingChunks = (response as any).groundingMetadata?.groundingChunks || [];
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
        const response = await callGeminiFunction(
            "gemini-2.5-flash-preview-tts",
            [{ parts: [{ text }] }],
            {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            }
        );
        const base64Audio = (response as any).audioData;
        if (!base64Audio) throw new Error("No audio data received.");
        return base64Audio;
    });
};

export const draftVetMessageToOwner = async (pet: PetProfile, topic: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getVetMessageDraftParts(pet, topic);
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            userPrompt,
            { systemInstruction }
        );
        return response.text || "";
    });
};

export const queryVetPatientData = async (patients: PetProfile[], appointments: Appointment[], query: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getVetDataQueryParts(patients, appointments, query);
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-pro',
            userPrompt,
            {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        );
        return response.text || "";
    });
};

export const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
    const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);
    try {
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            userPrompt,
            {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ["suggestions"]
                }
            }
        );
        const parsed = JSON.parse(response.text?.trim() || "{}");
        return parsed.suggestions || [];
    } catch (e) {
        console.error("Error generating chat suggestions:", e);
        return ["I'm on my way.", "Can you describe the collar?", "Is the pet friendly?"];
    }
};

export const performAIHealthCheck = async (pet: PetProfile, symptoms: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getAIHealthCheckParts(pet, symptoms);
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-pro',
            userPrompt,
            {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 16384 }
            }
        );
        return response.text || "Analysis unavailable.";
    });
};

export const generateBlogPost = async (topic: string): Promise<Partial<BlogPost>> => {
    const { systemInstruction, userPrompt } = Prompts.getBlogGenerationParts(topic);
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-pro',
            userPrompt,
            {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        content: { type: Type.STRING },
                        seoTitle: { type: Type.STRING },
                        seoDescription: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "summary", "content", "seoTitle", "seoDescription", "tags"]
                },
                thinkingConfig: { thinkingBudget: 16384 }
            }
        );
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateSuccessStory = async (pet: PetProfile): Promise<Partial<BlogPost>> => {
    const { systemInstruction, userPrompt } = Prompts.getSuccessStoryPrompt(pet);
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-pro',
            userPrompt,
            {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        content: { type: Type.STRING },
                        seoTitle: { type: Type.STRING },
                        seoDescription: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "summary", "content", "seoTitle", "seoDescription", "tags"]
                },
                thinkingConfig: { thinkingBudget: 16384 }
            }
        );
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const parseSearchQuery = async (query: string): Promise<any> => {
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [{ text: Prompts.getSearchParsingPrompt(query) }] },
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        species: { type: Type.STRING, nullable: true },
                        breed: { type: Type.STRING, nullable: true },
                        color: { type: Type.STRING, nullable: true },
                        size: { type: Type.STRING, nullable: true },
                        age: { type: Type.STRING, nullable: true },
                        gender: { type: Type.STRING, nullable: true },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }
                    }
                }
            }
        );
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateImage = async (prompt: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-3-pro-image-preview',
            { parts: [{ text: prompt }] },
            { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
        );

        const base64Image = (response as any).audioData; // Reusing the same field for now as it's the first part's inlineData
        if (!base64Image) throw new Error("No image data received.");
        return `data:image/png;base64,${base64Image}`;
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
    // Fix: Added null-safe medicalRecord check for completeness score
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
        const response = await callGeminiFunction(
            'gemini-2.5-flash', // Using Flash for speed and lower cost on batch translations
            userPrompt,
            {
                systemInstruction,
                responseMimeType: "application/json",
            }
        );
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateHealthInsights = async (pet: PetProfile): Promise<AIInsight[]> => {
    return retryWithBackoff(async () => {
        const response = await callGeminiFunction(
            'gemini-2.5-flash',
            { parts: [{ text: Prompts.getHealthInsightsPrompt(pet) }] },
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            type: { type: Type.STRING }
                        },
                        required: ["title", "content", "type"]
                    }
                }
            }
        );
        const insights = JSON.parse(response.text?.trim() || "[]");
        return insights.map((insight: any) => ({
            ...insight,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        }));
    });
};

