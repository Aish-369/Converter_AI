/**
 * LipiScript Phase 0 Benchmark Runner
 * Module: Google Cloud Vision DOCUMENT_TEXT_DETECTION Candidate Runner
 * Script: Indic Devanagari (Marathi, Hindi) & Latin (English)
 *
 * NOTE: Google Cloud Vision's handwriting recognition for Devanagari script
 * is officially designated as EXPERIMENTAL.
 * This runner passes languageHints: ['mr', 'hi', 'en'].
 */

import { CandidateRunResult } from './gemini_runner.ts';

export interface CloudVisionConfig {
  apiKey?: string;
}

export async function runCloudVisionCandidate(
  imageBase64: string,
  config: CloudVisionConfig = {}
): Promise<CandidateRunResult> {
  const startTime = Date.now();
  const modelId = 'google-cloud-vision-document-text';
  const apiKey = config.apiKey || process.env.GOOGLE_VISION_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      modelId,
      rawText: '',
      latencyMs: 0,
      error: 'Google Cloud Vision API key is not configured (GOOGLE_VISION_API_KEY required).',
    };
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const requestBody = {
      requests: [
        {
          image: {
            content: cleanBase64,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ['mr', 'hi', 'en'],
          },
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'aistudio-build-lipiscript',
      },
      body: JSON.stringify(requestBody),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return {
        modelId,
        rawText: '',
        latencyMs,
        error: `Cloud Vision API HTTP ${response.status}: ${errText.slice(0, 300)}`,
      };
    }

    const data: any = await response.json();
    const annotation = data.responses?.[0]?.fullTextAnnotation;
    const rawText = annotation?.text || '';

    return {
      modelId,
      rawText,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      modelId,
      rawText: '',
      latencyMs,
      error: err?.message || 'Cloud Vision inference failed',
    };
  }
}
