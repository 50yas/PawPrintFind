
import { PetProfile, Appointment, ChatMessage } from '../types';

export const getImageDescriptionPrompt = (): string => {
  return "Describe this pet in detail for identification. Mention breed, colors, patterns, and any unique physical features visible. Be very specific.";
};

export const getBreedIdentificationPrompt = (): string => {
    return "Based on this image, what is the most likely breed of this pet? If it's a mix, suggest the most prominent breed. Respond with only the breed name.";
};

// New Prompt for Generating the AI Identikit
export const getPetIdentikitPrompt = (): string => {
    return `
    Analyze the provided image of the pet to create a unique "Biometric Identity".
    
    1. **Visual Identity Code**: Generate a short, uppercase, hyphen-separated string that acts as a visual hash. It should follow this format: [SPECIES]-[BREED_ABBR]-[COLOR]-[DISTINCTIVE_FEATURE]. 
       - Example: DOG-LAB-BLK-SCARLEFTEYE or CAT-SIAM-CRM-BLUEEYES.
       - Keep it under 30 characters.
    
    2. **Physical Description**: Provide a concise, clinical description of the pet's physical appearance, focusing on distinguishing marks that would help in recovery (e.g., "White sock on front left paw," "Notch in right ear," "Heterochromia").
    
    Return the result in JSON format.
    `;
};

export const getPetComparisonParts = (foundPetDesc: string, lostPet: PetProfile): { systemInstruction: string; userPrompt: string } => {
  const lostPetMarks = lostPet.photos.flatMap(p =>
    p.marks.map(m => `- A mark described as '${m.description}' on the ${p.description}.`)
  ).join('\n');

  const systemInstruction = "You are an AI expert in pet identification, acting as a \"Comparative Biometric Analyzer\". Your task is to compare a description of a found pet with a detailed profile of a lost pet and provide a compatibility score.";

  const userPrompt = `
    **Found Pet Description:**
    ${foundPetDesc}

    **Lost Pet Profile:**
    - Name: ${lostPet.name}
    - Breed: ${lostPet.breed}
    - Age: ${lostPet.age}
    - Weight: ${lostPet.weight}
    - Behavior Notes: ${lostPet.behavior}
    - **AI Visual Identity Code**: ${lostPet.aiIdentityCode || 'N/A'}
    - **AI Physical Identification**: ${lostPet.aiPhysicalDescription || 'N/A'}
    - Video Analysis Summary: ${lostPet.videoAnalysis || 'Not provided.'}
    - Transcribed Audio Notes: ${lostPet.audioNotes || 'Not provided.'}
    - Manually Tagged Unique Marks (CRITICAL - Give these 10x importance):
    ${lostPetMarks || 'No specific marks tagged.'}

    **Task:**
    1. Analyze both profiles. Pay extremely close attention to the **AI Visual Identity Code** and manually tagged unique marks. Also consider color patterns, morphology, and breed characteristics.
    2. Provide a compatibility score from 0 to 100, where 100 is a perfect match.
    3. Provide a brief reasoning for your score in 2-3 sentences.
    4. List 3-5 specific key features that match (e.g. "White socks", "Blue collar", "Golden Retriever breed").
    5. List specific discrepancies or differences if any (e.g. "Found pet has long tail, lost pet has docked tail", "Size mismatch").
  `;
  return { systemInstruction, userPrompt };
};

export const getVideoAnalysisPrompt = (): string => {
  return "Analyze this video of a pet. Describe its key behaviors and temperament. Is it playful, shy, energetic, calm? Note any unique movements or habits that could be used for identification.";
};

export const getAudioTranscriptionPrompt = (): string => {
  return "Transcribe the following audio recording, which contains notes about a pet.";
};

export const getNearbyVetsPrompt = (): string => {
    return "What are some good animal shelters or veterinary clinics near my location?";
};

export const getVetsByQueryPrompt = (query: string): string => {
    return `Find veterinary clinics or animal shelters near "${query}".`;
};

export const getFindClinicPrompt = (name: string, city: string): string => {
    return `Find a veterinary clinic named "${name}" in or near the city of "${city}".`;
};

export const getVetMessageDraftParts = (pet: PetProfile, topic: string): { systemInstruction: string; userPrompt: string } => {
  const systemInstruction = "You are a helpful veterinary assistant AI.";
  const userPrompt = `Draft a friendly and professional message from a vet to the owner of a pet named ${pet.name}. The topic is: "${topic}". Keep it concise. The owner's email is ${pet.ownerEmail}.`;
  return { systemInstruction, userPrompt };
};

export const getVetDataQueryParts = (patients: PetProfile[], appointments: Appointment[], query: string): { systemInstruction: string; userPrompt: string } => {
  // Fix: Include medicalRecord property in serialized patient data
  const patientData = JSON.stringify(patients.map(p => ({id: p.id, name: p.name, breed: p.breed, age: p.age, medicalRecord: p.medicalRecord})));
  const appointmentData = JSON.stringify(appointments);

  const systemInstruction = "You are an AI assistant for a veterinarian. Analyze the following data and answer the query based ONLY on the data provided.";

  const userPrompt = `
  **Patient Data:**
  ${patientData}

  **Appointment Data:**
  ${appointmentData}

  **Query:**
  "${query}"

  Provide a clear, concise answer.
  `;
  return { systemInstruction, userPrompt };
};

export const getChatSuggestionParts = (chatHistory: ChatMessage[], userRole: 'owner' | 'finder'): { systemInstruction: string; userPrompt: string } => {
    const systemInstruction = "You are a mediator AI in a secure chat between a pet owner and a person who found their pet. Your goal is to help them safely coordinate the reunion. DO NOT suggest exchanging personal information like phone numbers or exact home addresses. Instead, suggest meeting in a safe, public place like a vet clinic. Suggest questions the finder can ask to verify ownership (e.g., 'What color is the collar?', 'Does the pet respond to a specific nickname?'). Suggest reassuring messages for the owner. Provide 3 short, helpful, and safe suggestions for the next reply.";

    const history = chatHistory.map(m => `${m.senderEmail === 'owner' ? 'Owner' : 'Finder'}: ${m.text}`).join('\n');

    const userPrompt = `
    **Conversation History:**
    ${history}

    **My Role:**
    I am the ${userRole}.

    **Task:**
    Based on the conversation, provide 3 short, helpful, and safe suggestions for my next reply.
    `;
    return { systemInstruction, userPrompt };
};

export const getAIHealthCheckParts = (pet: PetProfile, symptoms: string): { systemInstruction: string; userPrompt: string } => {
    const systemInstruction = `You are an AI Veterinary Health Assistant. Your role is to provide a preliminary analysis of a pet's symptoms based on its health record. You MUST NOT provide a definitive diagnosis. Your response MUST begin with the following disclaimer, formatted exactly like this:

"***Disclaimer: I am an AI assistant and not a veterinarian. This is a preliminary analysis and not a substitute for professional veterinary advice. Please consult a qualified veterinarian for an accurate diagnosis and treatment plan.***"

After the disclaimer, provide a structured, helpful, and cautious response.`;

    const userPrompt = `
    **Pet's Profile:**
    - Name: ${pet.name}
    - Breed: ${pet.breed}
    - Age: ${pet.age}
    - Weight: ${pet.weight}
    // Fix: Access medicalRecord properties safely using the updated PetProfile type
    - Known Allergies: ${pet.medicalRecord?.allergies || 'None specified'}
    - Chronic Conditions: ${pet.medicalRecord?.chronicConditions || 'None specified'}
    - Current Medications: ${pet.medicalRecord?.medications || 'None specified'}

    **Owner's Description of Symptoms:**
    "${symptoms}"

    **Task:**
    1.  Start your response with the mandatory disclaimer.
    2.  Based on the pet's profile and the described symptoms, provide a potential analysis of what might be happening. Use cautious language (e.g., "could be related to," "it's possible that," "symptoms like these sometimes indicate").
    3.  Consider the pet's breed and medical history in your analysis.
    4.  Suggest general, safe, at-home care steps if applicable (e.g., "ensure the pet has access to fresh water," "monitor for changes").
    5.  List key signs or symptoms that would warrant an immediate vet visit (e.g., "difficulty breathing," "unresponsiveness").
    6.  Conclude by strongly reiterating the importance of consulting a veterinarian.
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
