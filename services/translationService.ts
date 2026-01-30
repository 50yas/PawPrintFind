
import { dbService } from './firebase';
import { translateContent } from './geminiService';
import { translations as allTranslations } from '../translations';

export interface I18nHealth {
    missingKeys: Record<string, string[]>;
    stats: Record<string, { total: number, missing: number, percent: number }>;
}

export const translationService = {
    /**
     * Audits all translation namespaces against the English source.
     */
    auditHealth(): I18nHealth {
        const enKeys = this.getAllKeys(allTranslations.en);
        const health: I18nHealth = {
            missingKeys: {},
            stats: {}
        };

        Object.entries(allTranslations).forEach(([lang, content]) => {
            if (lang === 'en') return;
            const langKeys = this.getAllKeys(content);
            const missing = enKeys.filter(k => !langKeys.includes(k));
            
            health.missingKeys[lang] = missing;
            health.stats[lang] = {
                total: enKeys.length,
                missing: missing.length,
                percent: Math.round(((enKeys.length - missing.length) / enKeys.length) * 100)
            };
        });

        return health;
    },

    /**
     * Recursive helper to get all flat dot-notation keys from a translation object.
     */
    getAllKeys(obj: any, prefix: string = ''): string[] {
        return Object.keys(obj).reduce((res: string[], el) => {
            if (Array.isArray(obj[el])) return res;
            if (typeof obj[el] === 'object' && obj[el] !== null) {
                return [...res, ...this.getAllKeys(obj[el], `${prefix}${el}.`)];
            }
            return [...res, prefix + el];
        }, []);
    },

    /**
     * Uses Gemini to translate missing keys for a specific language.
     * In a production app, this would likely call a backend function.
     */
    async fixMissingKeys(lang: string, keys: string[]): Promise<Record<string, string>> {
        const enContent = allTranslations.en as any;
        const toTranslate: Record<string, string> = {};

        keys.forEach(key => {
            const val = key.split('.').reduce((o, i) => o?.[i], enContent);
            if (typeof val === 'string') {
                toTranslate[key] = val;
            }
        });

        const results: Record<string, string> = {};
        
        // Batch translation to save tokens/time
        const texts = Object.values(toTranslate);
        if (texts.length === 0) return {};

        const translations = await translateContent(texts.join('\n---\n'), [lang]);
        const translatedLines = translations[lang].split('\n---\n');

        Object.keys(toTranslate).forEach((key, index) => {
            results[key] = translatedLines[index] || toTranslate[key];
        });

        return results;
    }
};
