import { GoogleGenAI } from '@google/genai';
import { FROZEN_SYSTEM_INSTRUCTION, FROZEN_USER_PROMPT } from './benchmark/candidates/frozen_prompt.ts';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, PageBreak } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PageOcrResult {
  text: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  illegibleCount: number;
  model: string;
  charCount: number;
  wordCount: number;
  lineCount: number;
}

/**
 * Process handwritten note page with Gemini 3.8 Flash
 * Strict adherence to Gate 4 frozen prompt: Zero auto-correction, verbatim transcription
 */
export async function processPageOcr(
  imageBase64: string,
  mimeType: string = 'image/png',
  apiKeyOverride?: string
): Promise<PageOcrResult> {
  const startTime = Date.now();
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment. Please provide a valid API key.');
  }

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
    model: 'gemini-3.8-flash',
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
  const rawText = (response.text || '').normalize('NFC').trim();
  const usage = response.usageMetadata;

  // Count [illegible] tokens
  const illegibleMatches = rawText.match(/\[illegible\]/g);
  const illegibleCount = illegibleMatches ? illegibleMatches.length : 0;

  const charCount = rawText.length;
  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const lineCount = rawText ? rawText.split('\n').length : 0;

  return {
    text: rawText,
    latencyMs,
    inputTokens: usage?.promptTokenCount,
    outputTokens: usage?.candidatesTokenCount,
    illegibleCount,
    model: 'gemini-3.8-flash',
    charCount,
    wordCount,
    lineCount,
  };
}

export interface ProjectExportData {
  title: string;
  author: string;
  subject?: string;
  language?: string;
  createdAt?: string;
  description?: string;
  chapters: Array<{
    id: string;
    title: string;
    synopsis?: string;
    pages: Array<{
      id: string;
      pageNumber: number;
      title?: string;
      text: string;
    }>;
  }>;
}

/**
 * Generate OpenXML DOCX document styled for Devanagari (Marathi, Hindi) & English
 * Enforces w:cs="Noto Sans Devanagari" complex script typography
 */
export async function generateProjectDocxBuffer(project: ProjectExportData): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // Title Page
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 300 },
      children: [
        new TextRun({
          text: project.title || 'LipiScript Digital E-Book',
          font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
          bold: true,
          size: 48, // 24pt
          color: '1E3A8A',
        }),
      ],
    })
  );

  if (project.subject) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: project.subject,
            font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
            size: 28,
            color: '475569',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `लेखक / Author: ${project.author || 'LipiScript User'}`,
          font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
          italics: true,
          size: 24,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [
        new TextRun({
          text: `भाषा: ${project.language || 'मराठी / Hindi / English'} · तयार केले: ${new Date().toLocaleDateString('mr-IN')}`,
          font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
          size: 20,
          color: '64748B',
        }),
      ],
    })
  );

  // Page break after title page
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Table of Contents Section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: 'अनुक्रमणिका (Table of Contents)',
          font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
          bold: true,
          size: 32,
          color: '1E3A8A',
        }),
      ],
    })
  );

  project.chapters.forEach((chap, idx) => {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `${idx + 1}. ${chap.title}`,
            font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: ` (${chap.pages.length} पृष्ठे / ${chap.pages.reduce((acc, p) => acc + (p.text?.length || 0), 0)} अक्षरे)`,
            font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
            color: '64748B',
            size: 20,
          }),
        ],
      })
    );
  });

  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // Chapter Content Sections
  project.chapters.forEach((chap, chapIdx) => {
    // Chapter Title
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: `प्रकरण ${chapIdx + 1}: ${chap.title}`,
            font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
            bold: true,
            size: 34,
            color: '1E3A8A',
          }),
        ],
      })
    );

    if (chap.synopsis) {
      children.push(
        new Paragraph({
          spacing: { after: 250 },
          children: [
            new TextRun({
              text: `प्रस्तावना: ${chap.synopsis}`,
              font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
              italics: true,
              size: 22,
              color: '334155',
            }),
          ],
        })
      );
    }

    // Pages in Chapter
    chap.pages.forEach((page) => {
      if (page.title) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: page.title,
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                bold: true,
                size: 26,
                color: '2563EB',
              }),
            ],
          })
        );
      }

      // Parse paragraphs from page text
      const lines = (page.text || '').split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          children.push(new Paragraph({ spacing: { after: 80 } }));
          continue;
        }

        if (line.startsWith('# ')) {
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              children: [
                new TextRun({
                  text: line.replace('# ', ''),
                  font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                  bold: true,
                  size: 26,
                  color: '1E3A8A',
                }),
              ],
            })
          );
        } else if (line.startsWith('## ')) {
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 180, after: 80 },
              children: [
                new TextRun({
                  text: line.replace('## ', ''),
                  font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                  bold: true,
                  size: 24,
                  color: '2563EB',
                }),
              ],
            })
          );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: line.substring(2),
                  font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                  size: 22,
                }),
              ],
            })
          );
        } else {
          children.push(
            new Paragraph({
              spacing: { after: 140 },
              children: [
                new TextRun({
                  text: line,
                  font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                  size: 22,
                }),
              ],
            })
          );
        }
      }
    });

    // Page break between chapters
    if (chapIdx < project.chapters.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  });

  const doc = new Document({
    creator: 'LipiScript AI Handwritten Notes Engine',
    title: project.title,
    description: 'High fidelity digital document with Devanagari Complex Text Shaping',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (1440 twips = 1 inch)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate Vector Printable HTML Document with Chromium HarfBuzz Pipeline
 * Provides dynamic TOC, @page rules, running headers, and 100% accurate Indic ligatures
 */
export function generateProjectPrintableHtml(project: ProjectExportData): string {
  const totalPagesCount = project.chapters.reduce((acc, c) => acc + c.pages.length, 0);

  const chaptersHtml = project.chapters
    .map((chap, cIdx) => {
      const pagesContent = chap.pages
        .map((p) => {
          const formattedText = (p.text || '')
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return '<br>';
              if (trimmed.startsWith('# ')) return `<h3>${escapeHtml(trimmed.slice(2))}</h3>`;
              if (trimmed.startsWith('## ')) return `<h4>${escapeHtml(trimmed.slice(3))}</h4>`;
              if (trimmed.startsWith('### ')) return `<h5>${escapeHtml(trimmed.slice(4))}</h5>`;
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return `<li>${escapeHtml(trimmed.slice(2))}</li>`;
              }
              // Highlight [illegible] spans
              const withIllegible = escapeHtml(trimmed).replace(
                /\[illegible\]/g,
                '<span class="illegible-chip">[illegible]</span>'
              );
              return `<p>${withIllegible}</p>`;
            })
            .join('\n');

          return `
          <div class="page-container" id="page-${p.id}">
            <div class="page-meta-header">
              <span class="page-title">${escapeHtml(p.title || `पृष्ठ ${p.pageNumber}`)}</span>
              <span class="page-indicator">मूळ स्कॅन पृष्ठ ${p.pageNumber}</span>
            </div>
            <div class="page-body">
              ${formattedText}
            </div>
          </div>
        `;
        })
        .join('\n');

      return `
      <section class="chapter-section" id="chap-${chap.id}">
        <div class="chapter-header">
          <div class="chapter-number">प्रकरण ०${cIdx + 1}</div>
          <h2 class="chapter-title">${escapeHtml(chap.title)}</h2>
          ${chap.synopsis ? `<p class="chapter-synopsis">${escapeHtml(chap.synopsis)}</p>` : ''}
        </div>
        <div class="chapter-pages">
          ${pagesContent}
        </div>
      </section>
    `;
    })
    .join('\n');

  const tocHtml = project.chapters
    .map(
      (c, idx) => `
    <div class="toc-item">
      <span class="toc-title"><a href="#chap-${c.id}">प्रकरण ०${idx + 1}: ${escapeHtml(c.title)}</a></span>
      <span class="toc-leader"></span>
      <span class="toc-meta">${c.pages.length} पृष्ठे</span>
    </div>
  `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(project.title)} — LipiScript Vector E-Book</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm;
      @top-right {
        content: "${escapeHtml(project.title)}";
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
      @bottom-right {
        content: counter(page);
        font-family: 'Noto Sans Devanagari', sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans Devanagari', 'Plus Jakarta Sans', system-ui, sans-serif;
      line-height: 1.75;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    }

    .toolbar-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.01em;
    }

    .toolbar-actions {
      display: flex;
      gap: 12px;
    }

    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
    }

    .btn-print:hover {
      background: #1d4ed8;
    }

    .doc-wrapper {
      max-width: 860px;
      margin: 40px auto;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 60px 80px;
    }

    /* Cover Page */
    .cover-page {
      min-height: 750px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 60px;
      margin-bottom: 60px;
      page-break-after: always;
    }

    .cover-badge {
      display: inline-block;
      align-self: flex-start;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 24px;
    }

    .cover-title {
      font-family: 'Noto Serif Devanagari', 'Noto Sans Devanagari', serif;
      font-size: 38px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      margin: 0 0 16px 0;
    }

    .cover-subject {
      font-size: 20px;
      color: #475569;
      font-weight: 500;
      margin: 0 0 40px 0;
    }

    .cover-meta {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 13px;
    }

    .cover-author {
      font-weight: 600;
      color: #1e293b;
    }

    /* Table of Contents */
    .toc-section {
      margin-bottom: 60px;
      padding-bottom: 40px;
      border-bottom: 1px solid #e2e8f0;
      page-break-after: always;
    }

    .toc-header {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 24px;
      border-left: 4px solid #2563eb;
      padding-left: 12px;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      margin-bottom: 14px;
      font-size: 15px;
    }

    .toc-title a {
      color: #1e3a8a;
      text-decoration: none;
      font-weight: 600;
    }

    .toc-title a:hover {
      text-decoration: underline;
    }

    .toc-leader {
      flex: 1;
      border-bottom: 1px dotted #cbd5e1;
      margin: 0 12px;
    }

    .toc-meta {
      font-size: 13px;
      color: #64748b;
    }

    /* Chapters */
    .chapter-section {
      margin-bottom: 60px;
      page-break-after: always;
    }

    .chapter-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 30px;
    }

    .chapter-number {
      font-size: 13px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .chapter-title {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .chapter-synopsis {
      font-size: 14px;
      color: #475569;
      font-style: italic;
      margin: 0;
    }

    /* Pages */
    .page-container {
      margin-bottom: 36px;
    }

    .page-meta-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 16px;
    }

    .page-title {
      font-weight: 600;
      color: #334155;
    }

    .page-body h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 20px 0 10px 0;
    }

    .page-body h4 {
      font-size: 16px;
      font-weight: 600;
      color: #2563eb;
      margin: 16px 0 8px 0;
    }

    .page-body p {
      margin: 0 0 14px 0;
      font-size: 15px;
      text-align: justify;
    }

    .page-body li {
      margin-bottom: 8px;
      font-size: 15px;
    }

    .illegible-chip {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    @media print {
      .toolbar-header {
        display: none !important;
      }
      body {
        background: #ffffff;
      }
      .doc-wrapper {
        box-shadow: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
      }
      .chapter-section {
        page-break-after: always;
      }
      .cover-page {
        page-break-after: always;
      }
      .toc-section {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar-header">
    <div class="toolbar-brand">
      <span>📖 LipiScript HarfBuzz Vector Preview</span>
      <span style="font-size: 11px; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px;">Searchable Vector PDF</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print" onclick="window.print()">
        🖨️ Print / Save as Vector PDF (Ctrl+P)
      </button>
    </div>
  </div>

  <div class="doc-wrapper">
    <!-- Cover Page -->
    <div class="cover-page">
      <span class="cover-badge">LipiScript Digital Edition</span>
      <h1 class="cover-title">${escapeHtml(project.title)}</h1>
      ${project.subject ? `<div class="cover-subject">${escapeHtml(project.subject)}</div>` : ''}
      
      <div style="flex: 1;"></div>

      <div class="cover-meta">
        <div>
          <div>लेखक / Author: <span class="cover-author">${escapeHtml(project.author || 'LipiScript Author')}</span></div>
          <div>भाषा: ${escapeHtml(project.language || 'मराठी / Hindi / English')}</div>
        </div>
        <div style="text-align: right;">
          <div>एकूण पृष्ठे: ${totalPagesCount}</div>
          <div>तारीख: ${new Date().toLocaleDateString('mr-IN')}</div>
        </div>
      </div>
    </div>

    <!-- Table of Contents -->
    <div class="toc-section">
      <div class="toc-header">अनुक्रमणिका (Table of Contents)</div>
      ${tocHtml}
    </div>

    <!-- Chapter Bodies -->
    ${chaptersHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
