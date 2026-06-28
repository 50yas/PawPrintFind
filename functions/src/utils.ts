/**
 * Robust JSON extraction from AI responses.
 * Handles Markdown code blocks and common conversational filler.
 */
export function parseAIJSON(text: string): any {
    if (!text) return null;

    try {
        // 1. Try direct parse first (cleanest case)
        return JSON.parse(text.trim());
    } catch (e) {
        // 2. Try to extract from Markdown code blocks
        const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
        const match = text.match(markdownRegex);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1].trim());
            } catch (e2) {
                // Continue to fallback if markdown parse fails
            }
        }

        // 3. Last resort: Find the first '{' or '[' and the last '}' or ']'
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');

        let start = -1;
        if (firstBrace !== -1 && firstBracket !== -1) {
            start = Math.min(firstBrace, firstBracket);
        } else {
            start = firstBrace !== -1 ? firstBrace : firstBracket;
        }

        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');

        let end = -1;
        if (lastBrace !== -1 && lastBracket !== -1) {
            end = Math.max(lastBrace, lastBracket);
        } else {
            end = lastBrace !== -1 ? lastBrace : lastBracket;
        }

        if (start !== -1 && end !== -1 && end > start) {
            const potentialJson = text.substring(start, end + 1);
            try {
                return JSON.parse(potentialJson);
            } catch (e3) {
                console.error("Final JSON parse attempt failed for content:", potentialJson);
            }
        }
    }
    return null;
}
