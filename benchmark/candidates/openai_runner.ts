/**
 * LipiScript Phase 0 Benchmark Runner
 * Module: OpenAI GPT-4o Exploratory Candidate Runner
 *
 * NOTE: As documented in Phase 0 Feasibility Study, gpt-4o / gpt-4o-2024-11-20
 * is deprecated with an announced API shutdown date of January 14, 2027.
 * This runner is strictly for exploratory benchmarking comparison.
 */

import { FROZEN_SYSTEM_INSTRUCTION, FROZEN_USER_PROMPT } from './frozen_prompt.ts';
import { CandidateRunResult } from './gemini_runner.ts';

export interface OpenAIRunnerConfig {
  apiKey?: string;
  modelId?: string;
}

export async function runOpenAICandidate(
  imageBase64: string,
  config: OpenAIRunnerConfig = {}
): Promise<CandidateRunResult> {
  const startTime = Date.now();
  const modelId = config.modelId || 'gpt-4o';
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      modelId,
      rawText: '',
      latencyMs: 0,
      error: 'OPENAI_API_KEY is not configured in environment or options.',
    };
  }

  const cleanBase64 = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: FROZEN_SYSTEM_INSTRUCTION,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: FROZEN_USER_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: cleanBase64,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        temperature: 0.1, // Minimal sampling temperature for deterministic benchmark
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return {
        modelId,
        rawText: '',
        latencyMs,
        error: `OpenAI API HTTP ${response.status}: ${errText.slice(0, 300)}`,
      };
    }

    const data: any = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
      modelId,
      rawText,
      latencyMs,
      inputTokens: usage?.prompt_tokens,
      outputTokens: usage?.completion_tokens,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      modelId,
      rawText: '',
      latencyMs,
      error: err?.message || 'OpenAI inference failed',
    };
  }
}
