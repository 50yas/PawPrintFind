
/**
 * Local Inference Service
 * 
 * This service provides local, on-device AI capabilities for Paw Print.
 * Currently it acts as a lightweight fallback for when the user is offline.
 * In a production environment, this would load a quantized TFLite or TFJS model.
 */

export interface LocalInferenceResult {
    breed: string;
    confidence: number;
    isLocal: boolean;
}

/**
 * Simulates a local breed recognition using a lightweight heuristic.
 * In the future, this will be replaced with:
 * import * as mobilenet from '@tensorflow-models/mobilenet';
 */
export const identifyBreedLocally = async (photo: File): Promise<LocalInferenceResult> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Heuristic: Using filename or size to simulate a model's prediction
    // In a real scenario, this would be a TFJS inference call
    const name = photo.name.toLowerCase();
    
    let breed = "Unknown Mixed Breed (Offline)";
    let confidence = 0.5;

    if (name.includes('dog')) {
        breed = "Dog (Offline Detection)";
        confidence = 0.7;
    } else if (name.includes('cat')) {
        breed = "Cat (Offline Detection)";
        confidence = 0.7;
    } else if (name.includes('gold')) {
        breed = "Golden Retriever (Local Heuristic)";
        confidence = 0.6;
    }

    return {
        breed,
        confidence,
        isLocal: true
    };
};

/**
 * Checks if the current environment supports local inference.
 */
export const supportsLocalInference = (): boolean => {
    return typeof window !== 'undefined' && 'FileReader' in window;
};
