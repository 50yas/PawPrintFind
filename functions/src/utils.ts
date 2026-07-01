/**
 * Utility to parse JSON from AI responses that might contain markdown or conversational filler.
 */
export function parseAIJSON(text: string): string {
    if (!text) return "{}";

    // 1. Try to extract from markdown code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = text.match(codeBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }

    // 2. Fallback: Find the first '{' or '[' and the last '}' or ']'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    // Determine if we are looking for an object or an array
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = lastBrace;
    } else if (firstBracket !== -1) {
        start = firstBracket;
        end = lastBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start, end + 1).trim();
    }

    return text.trim();
}
