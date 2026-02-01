
// Minimal types needed for prompts in Functions
export interface PetProfile {
  name: string;
  breed: string;
  age: string;
  weight: string;
  behavior: string;
  type?: string;
  aiIdentityCode?: string;
  aiPhysicalDescription?: string;
  videoAnalysis?: string;
  audioNotes?: string;
  ownerEmail: string;
  photos: Array<{
    description: string;
    marks: Array<{ description: string }>;
  }>;
  medicalRecord?: {
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
    vaccinations?: any[];
  };
}

export const getAutoFillPetDetailsPrompt = (locale: string = 'en'): string => {
    return `
    Analyze the uploaded image of the pet and extract the following details to auto-fill a registration form.
    
    **Task:**
    Identify the pet's characteristics as accurately as possible.
    
    **Language:**
    Provide all string values (like breed, color) in "${locale}".

    **Output Schema (JSON ONLY):**
    {
      "breed": "string (e.g., 'Golden Retriever', 'Siamese Mix')",
      "color": "string (e.g., 'Golden', 'Black & White')",
      "age": "string (Estimate: 'Puppy/Kitten', 'Young', 'Adult', 'Senior')",
      "size": "string ('Small', 'Medium', 'Large')",
      "gender": "string ('Male', 'Female', 'Unknown')"
    }
    
    **Notes:**
    - If specific details (like exact age) are hard to determine, provide a best estimate based on visual cues (e.g., grey muzzle = Senior).
    - If unsure, provide the most likely option.
    `;
};

export const getPetIdentikitPrompt = (locale: string = 'en'): string => {
    return `
    Analyze this image and generate a unique "Visual Identity Code" and a detailed physical description.
    
    **Task:**
    1. Visual Identity Code: Create a short, unique alphanumeric code (format: ABC-123) based on the pet's visual features (e.g. 'BLK-LAB' for Black Lab).
    2. Physical Description: A detailed description of the pet's appearance, including distinctive markings, color patterns, and estimated build.
    
    **Language:**
    Write the Physical Description in "${locale}".

    Output JSON.
    `;
};

export const getSearchParsingPrompt = (query: string): string => {
    return `
    **Search Query:** "${query}"

    **Task:**
    Parse this natural language search query for finding pets and extract structured filter parameters.

    **Filters to extract:**
    - species: (e.g., "dog", "cat", "rabbit")
    - breed: (e.g., "Golden Retriever", "Siamese")
    - color: (e.g., "black", "brown", "white")
    - size: (e.g., "Small", "Medium", "Large")
    - age: (e.g., "Puppy", "Young", "Adult", "Senior")
    - gender: (e.g., "Male", "Female")
    - tags: (an array of strings representing personality or situation, e.g., ["friendly", "good for apartments", "house trained"])

    **Rules:**
    - If a parameter is not mentioned, return null for that field.
    - Be intelligent with 'tags'. If the user says "good for kids", add "kid-friendly" to tags.
    - Return the result in JSON format ONLY.
    `;
};

export const getAIHealthCheckParts = (pet: PetProfile, symptoms: string, locale: string = 'en'): { systemInstruction: string; userPrompt: string } => {
    const systemInstruction = `You are an AI Veterinary Health Assistant. Your role is to provide a preliminary analysis of a pet's symptoms based on its health record. You MUST NOT provide a definitive diagnosis. Your response MUST begin with the following disclaimer, formatted exactly like this:

"***Disclaimer: I am an AI assistant and not a veterinarian. This is a preliminary analysis and not a substitute for professional veterinary advice. Please consult a qualified veterinarian for an accurate diagnosis and treatment plan.***"

(Provide the disclaimer in ${locale} if possible, or keep it in English but provide the rest of the response in ${locale}).

After the disclaimer, provide a structured, helpful, and cautious response in ${locale}.`;

    const userPrompt = `
    **Pet's Profile:**
    - Name: ${pet.name}
    - Breed: ${pet.breed}
    - Age: ${pet.age}
    - Weight: ${pet.weight}
    - Known Allergies: ${pet.medicalRecord?.allergies || 'None specified'}
    - Chronic Conditions: ${pet.medicalRecord?.chronicConditions || 'None specified'}
    - Current Medications: ${pet.medicalRecord?.medications || 'None specified'}

    **Owner's Description of Symptoms:**
    "${symptoms}"

    **Task:**
    1.  Start your response with the mandatory disclaimer (localized to ${locale}).
    2.  Based on the pet's profile and the described symptoms, provide a potential analysis of what might be happening. Use cautious language (e.g., "could be related to," "it's possible that," "symptoms like these sometimes indicate").
    3.  Consider the pet's breed and medical history in your analysis.
    4.  Suggest general, safe, at-home care steps if applicable (e.g., "ensure the pet has access to fresh water," "monitor for changes").
    5.  List key signs or symptoms that would warrant an immediate vet visit (e.g., "difficulty breathing," "unresponsiveness").
    6.  Conclude by strongly reiterating the importance of consulting a veterinarian.
    
    **Language:**
    Respond in "${locale}".
    `;
    return { systemInstruction, userPrompt };
};

export const getBlogGenerationParts = (topic: string): { systemInstruction: string; userPrompt: string } => {
    const systemInstruction = `You are an expert content writer and SEO specialist for "Paw Print", an AI-powered pet safety application. Your tone is authoritative, compassionate, and informative. You write articles that are engaging for pet owners, tech enthusiasts, and veterinarians.`;

    const userPrompt = `
    **Topic:** "${topic}"

    **Goal:** Write a high-quality blog post optimized for SEO.

    **Requirements:**
    1.  **Title:** Catchy and SEO-friendly.
    2.  **Summary:** A short, engaging summary (max 150 characters).
    3.  **Content:** The full article body in HTML format. Use <h2> for headings, <p> for paragraphs, <ul>/<li> for lists. Do NOT include <html>, <head>, or <body> tags. Keep it clean.
    4.  **SEO Title:** A meta title optimized for search engines (under 60 chars).
    5.  **SEO Description:** A meta description (under 160 chars).
    6.  **Tags:** A list of 3-5 relevant tags.

    Return the result in JSON format ONLY with the following schema:
    {
      "title": "string",
      "summary": "string",
      "content": "html string",
      "seoTitle": "string",
      "seoDescription": "string",
      "tags": ["string"]
    }
    `;
    return { systemInstruction, userPrompt };
};
