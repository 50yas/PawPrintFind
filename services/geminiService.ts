
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { PetProfile, Geolocation, PhotoWithMarks, Appointment, ChatSession, HealthCheck, BlogPost } from '../types';
import * as Prompts from './prompts';

/**
 * Helper to get a fresh instance of the Gemini AI client using the current environment API Key.
 * This is crucial for nano banana series models where the key may be selected via window.aistudio.
 */
const getAIClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("Gemini API Key is missing! Using Mock Mode. Please set VITE_GEMINI_API_KEY in your .env file.");
        // Return a mock object that mimics GoogleGenAI but returns "Mock Data"
        return {
            models: {
                generateContent: async () => ({
                    text: JSON.stringify({
                        visualIdentityCode: "MOCK-12345",
                        physicalDescription: "This is a mock description generated because the API key is missing.",
                        score: 0.95,
                        reasoning: "Mock reasoning",
                        keyMatches: ["Match 1", "Match 2"],
                        discrepancies: ["None"],
                        suggestions: ["Check the park", "Post flyers"],
                        title: "Mock Blog Post",
                        summary: "Mock summary",
                        content: "Mock content",
                        seoTitle: "Mock SEO Title",
                        seoDescription: "Mock SEO Description",
                        tags: ["mock", "test"]
                    }),
                    candidates: [{
                        content: { parts: [{ inlineData: { data: "" }, text: "Mock response" }] },
                        groundingMetadata: { groundingChunks: [] }
                    }]
                })
            }
        } as unknown as GoogleGenAI;
    }
    return new GoogleGenAI({ apiKey });
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

export const analyzeImageForDescription = async (photo: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const imagePart = await fileToGenerativePart(photo);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: Prompts.getImageDescriptionPrompt() }] },
        });
        return response.text || "No description generated.";
    });
};

export const identifyBreedFromImage = async (photo: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const imagePart = await fileToGenerativePart(photo);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: Prompts.getBreedIdentificationPrompt() }] },
        });
        return response.text?.trim() || "Unknown Breed";
    });
};

export const generatePetIdentikit = async (photo: File): Promise<{ code: string, description: string }> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const imagePart = await fileToGenerativePart(photo);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: Prompts.getPetIdentikitPrompt() }] },
            config: {
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
        });
        const json = JSON.parse(response.text?.trim() || "{}");
        return {
            code: json.visualIdentityCode || "UNKNOWN",
            description: json.physicalDescription || "No description generated."
        };
    });
};

export const comparePets = async (foundPetDesc: string, lostPet: PetProfile): Promise<{ score: number, reasoning: string, keyMatches: string[], discrepancies: string[] }> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const validPhotos = lostPet.photos.filter(p => p.file !== undefined);
        const lostPetPhotoParts = await Promise.all(validPhotos.map(p => fileToGenerativePart(p.file!)));
        const { systemInstruction, userPrompt } = Prompts.getPetComparisonParts(foundPetDesc, lostPet);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [...lostPetPhotoParts, { text: userPrompt }] },
            config: {
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
        });

        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const analyzeVideo = async (videoFile: File, onProgress?: (percent: number) => void): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const videoPart = await fileToGenerativePart(videoFile, onProgress);
        const prompt = Prompts.getVideoAnalysisPrompt();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [videoPart, { text: prompt }] },
        });
        if (onProgress) onProgress(100);
        return response.text || "";
    });
};

export const transcribeAudio = async (audioFile: File, onProgress?: (percent: number) => void): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const audioPart = await fileToGenerativePart(audioFile, onProgress);
        const prompt = Prompts.getAudioTranscriptionPrompt();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: prompt }] },
        });
        if (onProgress) onProgress(100);
        return response.text || "";
    });
};

export const findNearbyVets = async (location: Geolocation): Promise<{ text: string, places: any[] }> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        // Maps grounding is only supported in Gemini 2.5 series models
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: Prompts.getNearbyVetsPrompt(),
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } }
            },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", places: groundingChunks };
    });
};

export const findVetsByQuery = async (query: string): Promise<{ text: string, places: any[] }> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        // Maps grounding is only supported in Gemini 2.5 series models
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: Prompts.getVetsByQueryPrompt(query),
            config: { tools: [{ googleMaps: {} }] },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", places: groundingChunks };
    });
};

export const findClinicOnGoogleMaps = async (name: string, city: string): Promise<any[]> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        // Maps grounding is only supported in Gemini 2.5 series models
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: Prompts.getFindClinicPrompt(name, city),
            config: { tools: [{ googleMaps: {} }] },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return groundingChunks.map(chunk => {
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
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received.");
        return base64Audio;
    });
};

export const draftVetMessageToOwner = async (pet: PetProfile, topic: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getVetMessageDraftParts(pet, topic);
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: { systemInstruction }
        });
        return response.text || "";
    });
};

export const queryVetPatientData = async (patients: PetProfile[], appointments: Appointment[], query: string): Promise<string> => {
    const { systemInstruction, userPrompt } = Prompts.getVetDataQueryParts(patients, appointments, query);
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text || "";
    });
};

export const generateChatSuggestions = async (session: ChatSession, currentUserEmail: string): Promise<string[]> => {
    const userRole = session.ownerEmail === currentUserEmail ? 'owner' : 'finder';
    const { systemInstruction, userPrompt } = Prompts.getChatSuggestionParts(session.messages, userRole);
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ["suggestions"]
                }
            }
        });
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
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 16384 }
            }
        });
        return response.text || "Analysis unavailable.";
    });
};

export const generateBlogPost = async (topic: string): Promise<Partial<BlogPost>> => {
    const { systemInstruction, userPrompt } = Prompts.getBlogGenerationParts(topic);
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
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
        });
        return JSON.parse(response.text?.trim() || "{}");
    });
};

export const generateImage = async (prompt: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
        });

        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts;

        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image generated");
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
