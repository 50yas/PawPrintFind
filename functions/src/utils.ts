/**
 * Cleans and parses JSON from an LLM response.
 * Handles cases where the model returns Markdown code blocks or conversational filler.
 */
export function parseAIJSON(text: string): any {
    if (!text) return null;

    // 1. Try to extract from Markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let candidate = jsonBlockMatch ? jsonBlockMatch[1] : text;

    // 2. If no block, try to find the first '{' or '[' and the last '}' or ']'
    if (!jsonBlockMatch) {
        const firstBrace = candidate.indexOf('{');
        const firstBracket = candidate.indexOf('[');
        const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

        const lastBrace = candidate.lastIndexOf('}');
        const lastBracket = candidate.lastIndexOf(']');
        const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

        if (start !== -1 && end !== -1 && end > start) {
            candidate = candidate.substring(start, end + 1);
        }
    }

    try {
        return JSON.parse(candidate.trim());
    } catch (e) {
        console.error("[parseAIJSON] Failed to parse JSON. Candidate string:", candidate);
        return null;
    }
}
