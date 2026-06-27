/**
 * Helper to strip Markdown JSON wrappers from AI responses.
 */
export function parseAIJSON(text: string): string {
    if (!text) return "";

    // 1. Try to find content within Markdown code blocks (```json ... ``` or ``` ... ```)
    const markdownMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (markdownMatch && markdownMatch[1]) {
        return markdownMatch[1].trim();
    }

    // 2. If no markdown blocks, look for the first '{' and last '}' or '[' and ']'
    const jsonStart = text.search(/\{|\[/);
    if (jsonStart !== -1) {
        const jsonEnd = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
        if (jsonEnd !== -1 && jsonEnd > jsonStart) {
            return text.substring(jsonStart, jsonEnd + 1).trim();
        }
    }

    // 3. Fallback to original text trimmed
    return text.trim();
}
