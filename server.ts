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

/**
 * API: Serve benchmark image (SVG or raster image)
 */
app.get('/api/benchmark/image/:pageId', (req, res) => {
  try {
    const { pageId } = req.params;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const page = manifest.pages.find((p: any) => p.id === pageId);

    if (!page || !page.imageFile) {
      // Fallback check if {pageId}.svg exists
      const fallbackSvg = path.join(imagesDir, `${pageId}.svg`);
      if (fs.existsSync(fallbackSvg)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.sendFile(fallbackSvg);
      }
      return res.status(404).send('Image not found');
    }

    const filePath = path.join(imagesDir, page.imageFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Image file missing on disk');
    }

    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    return res.sendFile(filePath);
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
});

/**
 * API: Get raw transcript for a page
 */
app.get('/api/benchmark/transcript/:pageId', (req, res) => {
  try {
    const { pageId } = req.params;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const page = manifest.pages.find((p: any) => p.id === pageId);

    if (!page || !page.transcriptFile) {
      return res.json({ transcript: '' });
    }

    const filePath = path.join(transcriptsDir, page.transcriptFile);
    if (!fs.existsSync(filePath)) {
      return res.json({ transcript: '' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return res.json({ transcript: content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

import { BenchmarkOrchestrator } from './benchmark/candidates/runner_orchestrator.ts';

/**
 * API: Run Benchmark Orchestrator (Dry-run or Authorized Live Run)
 */
app.post('/api/benchmark/orchestrate', async (req, res) => {
  try {
    const {
      gate3Authorized = false,
      dryRun = true,
      candidates,
      geminiApiKey,
      visionApiKey,
      openaiApiKey,
    } = req.body;

    const orchestrator = new BenchmarkOrchestrator({
      gate3Authorized,
      dryRun,
      candidates,
      geminiApiKey: geminiApiKey || process.env.GEMINI_API_KEY,
      visionApiKey: visionApiKey || process.env.GOOGLE_VISION_API_KEY,
      openaiApiKey: openaiApiKey || process.env.OPENAI_API_KEY,
    });

    const results = await orchestrator.runGoldBenchmark();
    return res.json({
      success: true,
      status: dryRun ? 'simulated_dry_run' : 'live_benchmark',
      aggregates: results.aggregates,
      detailedCount: results.detailedResults.length,
    });
  } catch (err: any) {
    const isGateLock = err.message.includes('GATE 3 LOCK');
    return res.status(isGateLock ? 403 : 500).json({
      error: err.message,
      isGateLock,
    });
  }
});

/**
 * API: Get Latest Benchmark Scorecard & Results
 */
app.get('/api/benchmark/results', (_req, res) => {
  try {
    const resultsPath = path.resolve(__dirname, 'benchmark', 'results', 'latest_benchmark_results.json');
    const scorecardPath = path.resolve(__dirname, 'benchmark', 'results', 'latest_scorecard.md');

    if (!fs.existsSync(resultsPath)) {
      return res.json({ exists: false, message: 'No benchmark results found yet' });
    }

    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const markdown = fs.existsSync(scorecardPath) ? fs.readFileSync(scorecardPath, 'utf8') : '';

    return res.json({
      exists: true,
      data,
      markdown,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * API: Get Gate 4 Feasibility Report & Decision Markdown
 */
app.get('/api/feasibility/gate4-report', (_req, res) => {
  try {
    const reportPath = path.resolve(__dirname, 'benchmark', 'results', 'Gate4_Feasibility_Report_and_Decision.md');
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: 'Gate 4 Feasibility Report not found' });
    }
    const markdown = fs.readFileSync(reportPath, 'utf8');
    return res.json({ success: true, markdown });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * API: Get Gate 5 Product Blueprint & Database Design Markdown
 */
app.get('/api/blueprint/gate5', (_req, res) => {
  try {
    const blueprintPath = path.resolve(__dirname, 'blueprint', 'Gate5_Product_Blueprint_and_Database_Design.md');
    if (!fs.existsSync(blueprintPath)) {
      return res.status(404).json({ error: 'Gate 5 Blueprint not found' });
    }
    const markdown = fs.readFileSync(blueprintPath, 'utf8');
    return res.json({ success: true, markdown });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

import { generateDevanagariFeasibilityDocx } from './benchmark/feasibility/test_docx_shaping.ts';

/**
 * API: Download Devanagari Feasibility DOCX
 * Generates an OpenXML Word document styled with Noto Sans Devanagari
 * for testing in Microsoft Word and LibreOffice Writer.
 */
app.get('/api/feasibility/generate-docx', async (_req, res) => {
  try {
    const buffer = await generateDevanagariFeasibilityDocx();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Devanagari_Feasibility_Test.docx"');
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

/**
 * API: Vector PDF Printable HTML Preview
 * Implements CSS Paged Media layout with Noto Sans Devanagari
 */
app.get('/api/feasibility/pdf-html', (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>LipiScript Devanagari Vector PDF Feasibility Test</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: 'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif;
      line-height: 1.7;
      color: #1e293b;
      margin: 0;
      padding: 30px;
      background: #ffffff;
    }
    .header-bar {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-bar h1 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }
    .badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }
    h2 {
      font-size: 16px;
      color: #1e3a8a;
      margin-top: 24px;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
    }
    p {
      margin: 10px 0;
      font-size: 14px;
    }
    .highlight-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin: 14px 0;
      font-size: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
    }
    .print-controls {
      position: fixed;
      top: 16px;
      right: 16px;
      background: #0f172a;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100;
    }
    @media print {
      .print-controls { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-controls" onclick="window.print()">🖨️ Print / Save Vector PDF</div>
  
  <div class="header-bar">
    <h1>LipiScript: देवनागरी व्हेक्टर PDF पडताळणी चाचणी (Vector PDF Test)</h1>
    <span class="badge">HarfBuzz CTS Engine</span>
  </div>

  <h2>१. मराठी जोडाक्षरे आणि संयुक्त वर्ण (Marathi Conjuncts & Ligatures)</h2>
  <div class="highlight-box">
    <strong>महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग, मंत्रालय, मुंबई.</strong><br>
    विद्यापीठ अनुदान आयोग (UGC) मान्यताप्राप्त पदवी अभ्यासक्रम.
  </div>
  <p>
    या चाचणीत खालील कठीण जोडाक्षरांचे परीक्षण केले जात आहे:
    <strong>१) ष्ट्र (महाराष्ट्र), २) क्ष (परीक्षा), ३) ज्ञ (ज्ञानपीठ), ४) त्र (मंत्रालय), ५) र्क (कार्यक्रम), ६) ष्ट (दृष्टी).</strong>
  </p>

  <h2>२. हिंदी अनुच्छेद (Hindi Paragraph & Matra Placement)</h2>
  <p>
    यह एक उच्च-गुणवत्ता देवनागरी वेक्टर पीडीएफ का परीक्षण पृष्ठ है। इसमें सभी संयुक्त वर्ण, अनुस्वार और ह्रस्व-इ की मात्रा के उचित स्थान निर्धारण की जाँच की जा रही है। आप इस पाठ को चुन सकते हैं (Select), कॉपी कर सकते हैं (Copy), और खोज सकते हैं (Ctrl+F Search)।
  </p>

  <h2>३. चाचणी सारणी (Verification Checklist Table)</h2>
  <table>
    <thead>
      <tr>
        <th>क्र. (No.)</th>
        <th>घटक (Component)</th>
        <th>वर्णन (Description)</th>
        <th>चाचणी निकष (Verification Criteria)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>०१</td>
        <td>Complex Text Shaping</td>
        <td>HarfBuzz shaping engine with OpenType GSUB/GPOS</td>
        <td>अक्षरे तुटत नाहीत, जोडाक्षरे अचूक तयार होतात.</td>
      </tr>
      <tr>
        <td>०२</td>
        <td>Searchable Text</td>
        <td>Ctrl+F search inside generated PDF</td>
        <td>'महाराष्ट्र' किंवा 'परीक्षा' शोधल्यास सापडते.</td>
      </tr>
      <tr>
        <td>०३</td>
        <td>Selectable & Copyable</td>
        <td>Clipboard copy and paste into Notepad</td>
        <td>Unicode NFC अखंड राहते.</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    LipiScript Phase 0 Feasibility Study · Chromium HarfBuzz Vector Pipeline · दिनांक ०५/११/२०२६.
  </p>
</body>
</html>`;
  return res.send(html);
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
