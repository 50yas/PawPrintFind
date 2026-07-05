/**
 * Sanitizes LLM output by extracting JSON content from Markdown code blocks if present.
 */
export function parseAIJSON(text: string): string {
    if (!text) return "";

    // 1. Try to find content between ```json and ```
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        return jsonBlockMatch[1].trim();
    }

    // 2. Try to find content between any ``` and ```
    const generalBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (generalBlockMatch && generalBlockMatch[1]) {
        return generalBlockMatch[1].trim();
    }

    // 3. If no markdown blocks, find first { and last } or first [ and last ]
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        return text.substring(firstBrace, lastBrace + 1).trim();
    }

    if (firstBracket !== -1 && lastBracket !== -1) {
        return text.substring(firstBracket, lastBracket + 1).trim();
    }

    return text.trim();
}
