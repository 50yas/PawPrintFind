import { translations } from '../translations';
import * as fs from 'fs';
import * as path from 'path';

// Use environment variable for security
const API_KEY = process.env.GEMINI_API_KEY;

function getAllKeys(obj: any, prefix: string = ''): string[] {
    return Object.keys(obj).reduce((res: string[], el) => {
        if (Array.isArray(obj[el])) return res;
        if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getAllKeys(obj[el], `${prefix}${el}.`)];
        }
        return [...res, prefix + el];
    }, []);
}

function getValue(obj: any, key: string): string {
    return key.split('.').reduce((o, i) => o?.[i], obj);
}

async function translateBatch(toTranslate: any, lang: string) {
    const prompt = `You are a professional localization expert for the 'Paw Print' pet finder app. 
The app features a high-tech Cyberpunk/Glassmorphism aesthetic. 
Translate the following JSON values from English to the language code: ${lang}. 
Maintain the technical, futuristic tone (e.g., use terms equivalent to 'Node', 'Identity', 'Protocol', 'Sync', 'Core'). 
Return ONLY a valid JSON object with the keys and translated values.

ENGLISH JSON:
${JSON.stringify(toTranslate, null, 2)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    const data: any = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

async function sync() {
    const enKeys = getAllKeys(translations.en);
    const languages = Object.keys(translations).filter(l => l !== 'en');
    
    for (const lang of languages) {
        const content = (translations as any)[lang];
        const langKeys = getAllKeys(content);
        const missing = enKeys.filter(k => !langKeys.includes(k));
        
        if (missing.length === 0) {
            console.log(`[i18n] ${lang} is already synchronized.`);
            continue;
        }
        
        console.log(`[i18n] Synchronizing ${lang}... (${missing.length} keys missing)`);
        
        const batchSize = 40;
        const results: Record<string, string> = {};
        
        for (let i = 0; i < missing.length; i += batchSize) {
            const batch = missing.slice(i, i + batchSize);
            const toTranslate: any = {};
            batch.forEach(k => {
                toTranslate[k] = getValue(translations.en, k);
            });

            try {
                const translatedBatch = await translateBatch(toTranslate, lang);
                Object.assign(results, translatedBatch);
                console.log(`[i18n] Translated batch ${i / batchSize + 1} for ${lang}`);
                await new Promise(r => setTimeout(r, 2000)); // Sleep 2s
            } catch (error) {
                console.error(`[i18n] Error translating batch for ${lang}:`, error);
            }
        }
        
        // Merge and save
        const merged = { ...content };
        Object.entries(results).forEach(([key, val]) => {
            const parts = key.split('.');
            let curr: any = merged;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!curr[parts[i]]) curr[parts[i]] = {};
                curr = curr[parts[i]];
            }
            curr[parts[parts.length - 1]] = val;
        });
        
        const fileContent = `export const ${lang} = ${JSON.stringify(merged, null, 4)};\n`;
        fs.writeFileSync(path.join(process.cwd(), 'translations', `${lang}.ts`), fileContent);
        console.log(`[i18n] Updated translations/${lang}.ts`);
    }
}

sync().catch(console.error);