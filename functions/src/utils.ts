/**
 * Robustly parses JSON from LLM responses, handling conversational filler and Markdown blocks.
 */
export function parseAIJSON(text: string): any {
    if (!text) return null;

    let jsonStr = text.trim();

    // 1. Try to extract from Markdown code blocks
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = jsonStr.match(markdownRegex);
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }

    // 2. Multi-stage extraction: find the first '{' or '[' and last '}' or ']'
    const firstBrace = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');
    const start = (firstBrace !== -1 && firstBracket !== -1)
        ? Math.min(firstBrace, firstBracket)
        : (firstBrace !== -1 ? firstBrace : firstBracket);

    const lastBrace = jsonStr.lastIndexOf('}');
    const lastBracket = jsonStr.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (start !== -1 && end !== -1 && end > start) {
        jsonStr = jsonStr.substring(start, end + 1);
    }

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse AI JSON:", e);
        console.error("Original text:", text);
        console.error("Cleaned text:", jsonStr);
        return null;
    }
}
