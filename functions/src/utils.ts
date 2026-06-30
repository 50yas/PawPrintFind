
/**
 * Clean and parse JSON from a potentially messy LLM response.
 * Handles Markdown code blocks and trailing/leading conversational text.
 */
export function parseAIJSON(text: string) {
    if (!text) return null;

    // 1. Try to extract from Markdown code block
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    let jsonString = codeBlockMatch ? codeBlockMatch[1] : text;

    // 2. If no code block, try to find the first '{' or '[' and last '}' or ']'
    if (!codeBlockMatch) {
        const startIdx = Math.min(
            text.indexOf('{') === -1 ? Infinity : text.indexOf('{'),
            text.indexOf('[') === -1 ? Infinity : text.indexOf('[')
        );
        const endIdx = Math.max(
            text.lastIndexOf('}'),
            text.lastIndexOf(']')
        );

        if (startIdx !== Infinity && endIdx !== -1 && endIdx > startIdx) {
            jsonString = text.substring(startIdx, endIdx + 1);
        }
    }

    try {
        return JSON.parse(jsonString.trim());
    } catch (e) {
        console.error("[parseAIJSON] Failed to parse extracted JSON:", jsonString);
        throw new Error("Failed to parse AI response as JSON.");
    }
}
