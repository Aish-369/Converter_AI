/**
 * LipiScript Phase 0 Benchmark Dataset Utility
 * Module: Synthetic Handwritten Notebook Page Generator
 * Generates high-fidelity SVG notebook pages for all 30 benchmark pages (10 Gold + 20 Qualitative).
 */

import * as fs from 'fs';
import * as path from 'path';

const datasetDir = path.resolve(process.cwd(), 'benchmark', 'dataset');
const imagesDir = path.join(datasetDir, 'images');
const transcriptsDir = path.join(datasetDir, 'transcripts');
const manifestPath = path.join(datasetDir, 'manifest.json');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

function generateNotebookSvg(
  pageId: string,
  language: string,
  difficultyOrFocus: string,
  contentLines: string[],
  options: {
    hasInkBlot?: boolean;
    hasTable?: boolean;
    hasDiagram?: boolean;
    fontFamily?: string;
    inkColor?: string;
    rotation?: number;
  } = {}
): string {
  const width = 800;
  const height = 1100;
  const inkColor = options.inkColor || '#1e3a8a'; // classic blue fountain/ballpoint ink
  const fontFamily = options.fontFamily || (language === 'English' ? "'Caveat', cursive" : "'Kalam', cursive, sans-serif");
  const rotation = options.rotation || 0;

  // Ruled horizontal lines
  let ruledLinesSvg = '';
  for (let y = 140; y <= 1040; y += 34) {
    ruledLinesSvg += `<line x1="20" y1="${y}" x2="780" y2="${y}" stroke="#bfdbfe" stroke-width="1.2" stroke-dasharray="none" />\n`;
  }

  // Margin lines
  const marginLines = `
    <line x1="120" y1="20" x2="120" y2="1080" stroke="#fca5a5" stroke-width="1.4" />
    <line x1="124" y1="20" x2="124" y2="1080" stroke="#fca5a5" stroke-width="1.4" />
    <line x1="20" y1="120" x2="780" y2="120" stroke="#fca5a5" stroke-width="1.4" />
  `;

  // Render text lines aligned to ruled lines
  let textElements = '';
  let startY = 170;

  contentLines.forEach((line) => {
    if (!line.trim()) {
      startY += 34;
      return;
    }

    const isHeader = line.startsWith('#') || line.startsWith('###');
    const cleanText = line.replace(/^[#\-*\d.]+\s*/, '').replace(/\[illegible\]/g, '.....');
    const fontSize = isHeader ? 22 : 18;
    const fontWeight = isHeader ? 700 : 400;

    textElements += `
      <text x="135" y="${startY}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${inkColor}">
        ${escapeXml(cleanText)}
      </text>
    `;
    startY += 34;
  });

  // Ink blot artifact for ambiguous region if specified
  let inkBlotSvg = '';
  if (options.hasInkBlot) {
    inkBlotSvg = `
      <g opacity="0.88">
        <ellipse cx="320" cy="302" rx="34" ry="16" fill="#0f172a" />
        <ellipse cx="328" cy="298" rx="22" ry="12" fill="#1e3a8a" filter="blur(1px)" />
        <circle cx="355" cy="312" r="5" fill="#0f172a" />
        <circle cx="288" cy="306" r="3.5" fill="#1e3a8a" />
      </g>
    `;
  }

  // Diagram placeholder for diagram pages
  let diagramSvg = '';
  if (options.hasDiagram) {
    diagramSvg = `
      <g stroke="${inkColor}" stroke-width="1.8" fill="none" transform="translate(160, ${startY + 20})">
        <!-- Hand-drawn block diagram sketch -->
        <rect x="20" y="20" width="120" height="50" rx="8" stroke-dasharray="2,1" />
        <text x="35" y="50" font-family="${fontFamily}" font-size="14" fill="${inkColor}">Input Layer</text>
        
        <line x1="140" y1="45" x2="190" y2="45" marker-end="url(#arrow)" />
        
        <rect x="190" y="20" width="140" height="50" rx="8" />
        <text x="205" y="50" font-family="${fontFamily}" font-size="14" fill="${inkColor}">Shaping Engine</text>
        
        <line x1="330" y1="45" x2="380" y2="45" marker-end="url(#arrow)" />
        
        <rect x="380" y="20" width="120" height="50" rx="8" />
        <text x="395" y="50" font-family="${fontFamily}" font-size="14" fill="${inkColor}">Vector PDF</text>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&amp;family=Kalam:wght@300;400;700&amp;display=swap');
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${inkColor}"/>
    </marker>
    <filter id="paper-texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
      <feDiffuseLighting in="noise" lighting-color="#fffdfa" surfaceScale="1" result="light">
        <feDistantLight azimuth="45" elevation="60" />
      </feDiffuseLighting>
      <feBlend mode="multiply" in="SourceGraphic" in2="light" />
    </filter>
  </defs>

  <!-- Notebook Page Paper -->
  <rect width="100%" height="100%" fill="#faf8f5" filter="url(#paper-texture)" />

  <!-- Ruled & Margin Lines -->
  ${ruledLinesSvg}
  ${marginLines}

  <!-- Notebook Header Box -->
  <g font-family="'Caveat', cursive" font-size="14" fill="#64748b">
    <text x="610" y="60">Page No: <tspan font-weight="700" fill="#0f172a">${pageId}</tspan></text>
    <text x="610" y="90">Date: <tspan fill="#0f172a">05 / 11 / 2026</tspan></text>
    <text x="40" y="70" font-size="13" fill="#94a3b8">LipiScript Benchmark [${language}]</text>
    <text x="40" y="92" font-size="11" fill="#cbd5e1">${escapeXml(difficultyOrFocus)}</text>
  </g>

  <!-- Handwritten Body Content -->
  <g transform="rotate(${rotation} 400 550)">
    ${textElements}
    ${inkBlotSvg}
    ${diagramSvg}
  </g>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateAllPages() {
  console.log('Generating benchmark handwritten SVG notebook pages...');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const page of manifest.pages) {
    const isGold = page.type === 'gold';
    let lines: string[] = [];

    if (isGold) {
      const transcriptFile = path.join(transcriptsDir, page.transcriptFile);
      if (fs.existsSync(transcriptFile)) {
        const raw = fs.readFileSync(transcriptFile, 'utf8');
        lines = raw.split('\n').filter((l) => !l.startsWith('# Subject:') && !l.startsWith('# Difficulty:'));
      }
    } else {
      // For qualitative pages, generate authentic representative content based on focus
      lines = generateQualitativeContent(page.language, page.focus || '');
    }

    const hasInkBlot = page.ambiguousRegions && page.ambiguousRegions.length > 0;
    const hasDiagram = page.id === 'GT-10' || page.id === 'Q-03' || page.id === 'Q-08' || page.id === 'Q-13';
    const rotation = page.difficulty === 'Difficult' ? 0.35 : 0;

    const svgContent = generateNotebookSvg(
      page.id,
      page.language,
      page.characteristics || page.focus || '',
      lines,
      {
        hasInkBlot,
        hasDiagram,
        rotation,
        inkColor: page.id.endsWith('2') || page.id.endsWith('6') ? '#0f172a' : '#1e3a8a',
      }
    );

    const svgFileName = `${page.id}.svg`;
    fs.writeFileSync(path.join(imagesDir, svgFileName), svgContent, 'utf8');

    // Update manifest
    page.imageFile = svgFileName;
    page.imageStatus = 'ready';
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Successfully generated 30 SVG notebook pages in ${imagesDir}`);
}

function generateQualitativeContent(language: string, focus: string): string[] {
  if (language === 'Marathi') {
    return [
      '# मराठी स्वाध्याय व टिपणे',
      '१. न्यूटनचा गतिविषयक दुसरा नियम:',
      '   बल (F) = वस्तुमान (m) × त्वरण (a)',
      '२. ऊर्जा अक्षय्यतेचा नियम: ऊर्जा निर्माण करता येत नाही आणि नष्टही करता येत नाही.',
      '३. समीकरण: E = mc^2 (आईनस्टाईनचे वस्तुमान-ऊर्जा समीकरण)',
      'टीप: विज्ञानातील व्याख्या मराठीत समजून घेणे अधिक सुलभ होते.',
    ];
  } else if (language === 'Hindi') {
    return [
      '# रसायन शास्त्र एवं भौतिक सिद्धांत',
      '१. प्रकाश संश्लेषण प्रक्रिया समीकरण:',
      '   6CO2 + 6H2O + सूर्य का प्रकाश -> C6H12O6 + 6O2',
      '२. अम्ल और क्षार की परस्पर अभिक्रिया से लवण एवं जल बनता है।',
      '३. ओम का नियम: किसी चालक के सिरों पर विभवांतर प्रवाहित धारा के समानुपाती होता है (V = IR)।',
    ];
  } else if (language === 'English') {
    return [
      '# Calculus & Matrix Algebra Notes',
      '1. Differential calculus finds instantaneous rates of change.',
      '2. Fundamental Theorem of Calculus:',
      '   d/dx [ integral(a to x, f(t) dt) ] = f(x)',
      '3. Matrix multiplication is associative but non-commutative: AB != BA.',
      '4. Determinant condition: A^-1 exists if and only if det(A) != 0.',
    ];
  } else {
    return [
      '# Computer Science & Algorithms (Mixed Script)',
      'Sorting algorithms ची वेळ गुंतागुंत (Time Complexity) खालीलप्रमाणे आहे:',
      '- QuickSort average case: O(n log n)',
      '- MergeSort space complexity: O(n) auxiliary memory',
      '- Binary search array वर run करण्यासाठी array आधी sorted असणे mandatory आहे.',
    ];
  }
}

generateAllPages().catch(console.error);
