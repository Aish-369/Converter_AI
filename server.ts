import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { scoreBenchmarkPage } from './benchmark/metrics.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Shared server-side GoogleGenAI client (telemetry User-Agent required)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * API: Search Grounding via gemini-3.8-flash with googleSearch tool
 * Used for looking up up-to-date facts, Indic language context,
 * verifying technical terms from notes, and finding source citations.
 */
app.post('/api/search-grounding', async (req, res) => {
  try {
    const { query, noteContext, language } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const promptText = `
User Question or Term to Verify: ${query}
${noteContext ? `Context from Handwritten Notes: ${noteContext}` : ''}
${language ? `Language of interest: ${language}` : ''}

Please provide an accurate, up-to-date, factual explanation and verification based on Google Search results.
If this relates to Marathi or Hindi historical, linguistic, mathematical, or scientific terms, explain clearly.
Include direct source references.
`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text ?? 'No response generated.';

    // Extract grounding chunks and web citations
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources =
      chunks
        ?.map((chunk) => {
          if (chunk.web) {
            return {
              title: chunk.web.title || 'Web Reference',
              uri: chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean) || [];

    const searchQueries =
      response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    return res.json({
      answer,
      sources,
      searchQueries,
    });
  } catch (error: any) {
    console.error('Error in /api/search-grounding:', error);
    let errorMsg = error?.message || 'Failed to execute search-grounded inquiry';
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {
      // not JSON, keep original
    }
    return res.status(500).json({ error: errorMsg });
  }
});

/**
 * API: Run benchmark scoring on a sample
 */
app.post('/api/benchmark/score', (req, res) => {
  try {
    const { reference, hypothesis } = req.body;
    if (!reference || !hypothesis) {
      return res.status(400).json({ error: 'Both reference and hypothesis are required' });
    }
    const score = scoreBenchmarkPage(reference, hypothesis);
    return res.json(score);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
});

const manifestPath = path.resolve(__dirname, 'benchmark/dataset/manifest.json');
const transcriptsDir = path.resolve(__dirname, 'benchmark/dataset/transcripts');
const imagesDir = path.resolve(__dirname, 'benchmark/dataset/images');

import fs from 'fs';

// Ensure directories exist
if (!fs.existsSync(transcriptsDir)) fs.mkdirSync(transcriptsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

/**
 * API: Get benchmark dataset manifest
 */
app.get('/api/benchmark/dataset', (_req, res) => {
  try {
    if (!fs.existsSync(manifestPath)) {
      return res.status(404).json({ error: 'Manifest not found' });
    }
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

/**
 * API: Ingest / Save reference ground-truth transcript
 */
app.post('/api/benchmark/save-transcript', (req, res) => {
  try {
    const { pageId, transcriptText } = req.body;
    if (!pageId || transcriptText === undefined) {
      return res.status(400).json({ error: 'pageId and transcriptText are required' });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pageIndex = manifest.pages.findIndex((p: any) => p.id === pageId);

    if (pageIndex === -1) {
      return res.status(404).json({ error: `Page ${pageId} not found in manifest` });
    }

    // Normalize to NFC before saving
    const normalizedText = transcriptText.normalize('NFC').trim();
    const transcriptFilePath = path.join(transcriptsDir, `${pageId}_transcript.txt`);
    fs.writeFileSync(transcriptFilePath, normalizedText, 'utf8');

    // Update manifest
    manifest.pages[pageIndex].transcriptFile = `${pageId}_transcript.txt`;
    manifest.pages[pageIndex].transcriptStatus = 'ready';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return res.json({
      success: true,
      page: manifest.pages[pageIndex],
      normalizedLength: normalizedText.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

/**
 * API: Register / Upload sample image for a page
 */
app.post('/api/benchmark/register-image', (req, res) => {
  try {
    const { pageId, fileName, base64Data } = req.body;
    if (!pageId || !fileName) {
      return res.status(400).json({ error: 'pageId and fileName are required' });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pageIndex = manifest.pages.findIndex((p: any) => p.id === pageId);

    if (pageIndex === -1) {
      return res.status(404).json({ error: `Page ${pageId} not found in manifest` });
    }

    if (base64Data) {
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const savedPath = path.join(imagesDir, `${pageId}_${fileName}`);
      fs.writeFileSync(savedPath, buffer);
      manifest.pages[pageIndex].imageFile = `${pageId}_${fileName}`;
    } else {
      manifest.pages[pageIndex].imageFile = fileName;
    }

    manifest.pages[pageIndex].imageStatus = 'ready';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return res.json({
      success: true,
      page: manifest.pages[pageIndex],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Setup Vite development middleware or static production serve
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LipiScript Server running on port ${PORT}`);
  });
}

startServer();
