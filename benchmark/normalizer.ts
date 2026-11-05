/**
 * LipiScript Phase 0 Benchmark Utility
 * Module: Unicode Normalization & Text Sanitization
 * NOTE: Standalone research utility, NOT production application code.
 */

/**
 * Normalizes text to Unicode Normalization Form C (NFC).
 * Prevents false character mismatches caused by decomposed vs precomposed diacritics
 * (e.g., Nukta characters like क़ vs क + ़).
 */
export function normalizeToNFC(text: string): string {
  if (!text) return '';
  return text.normalize('NFC');
}

/**
 * Standardizes line breaks and trailing whitespace without removing
 * meaningful internal punctuation or words.
 */
export function standardizeWhitespace(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Pre-processes text for reproducible scoring:
 * 1. NFC normalization
 * 2. Line break & whitespace standardization
 */
export function preprocessText(text: string): string {
  return standardizeWhitespace(normalizeToNFC(text));
}
