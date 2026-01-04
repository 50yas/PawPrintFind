
/**
 * Generates a localized adoption inquiry message by replacing placeholders.
 * @param template The localized template string with {{petName}} placeholder.
 * @param petName The name of the pet.
 * @returns The formatted inquiry string.
 */
export const generateAdoptionInquiry = (template: string, petName: string): string => {
    return template.replace(/{{petName}}/g, petName);
};
