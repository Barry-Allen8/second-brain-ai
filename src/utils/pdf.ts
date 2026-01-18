import { createRequire } from 'node:module';

// pdf-parse is a CommonJS module, use createRequire for ESM compatibility
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF file');
    }
}
