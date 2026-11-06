/**
 * LipiScript Phase 0 Benchmark Runner
 * Module: Google Gemini Multimodal Candidate Runner (gemini-3.8-flash & gemini-4-argon)
 * NOTE: Standalone research runner. Uses frozen system prompt.
 */

import { GoogleGenAI } from '@google/genai';
import { FROZEN_SYSTEM_INSTRUCTION, FROZEN_USER_PROMPT } from './frozen_prompt.ts';

export interface CandidateRunResult {
  modelId: string;
  rawText: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export async function runGeminiCandidate(
  modelId: 'gemini-3.8-flash' | 'gemini-4-argon',
  imageBase64: string,
  mimeType: string = 'image/png',
  apiKeyOverride?: string
): Promise<CandidateRunResult> {
  const startTime = Date.now();
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      modelId,
      rawText: '',
      latencyMs: Date.now() - startTime,
      error: 'GEMINI_API_KEY is not configured in environment or secrets.',
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: FROZEN_USER_PROMPT,
            },
          ],
        },
      ],
      config: {
        systemInstruction: FROZEN_SYSTEM_INSTRUCTION,
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text || '';
    const usage = response.usageMetadata;

    return {
      modelId,
      rawText,
      latencyMs,
      inputTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      modelId,
      rawText: '',
      latencyMs,
      error: err?.message || 'Gemini inference failed',
    };
  }
}
