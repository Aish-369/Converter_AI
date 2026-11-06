/**
 * LipiScript Phase 0 Feasibility Utility
 * Module: OpenXML DOCX Complex Text Shaping Generator
 * NOTE: Standalone research utility, NOT production application code.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateDevanagariFeasibilityDocx(): Promise<Buffer> {
  const doc = new Document({
    creator: 'LipiScript Feasibility Engine',
    title: 'Devanagari Complex Script Feasibility Test',
    description: 'Test document verifying Devanagari ligatures, conjuncts, and font fallback in Microsoft Word & LibreOffice',
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'LipiScript: Devanagari Complex Text Shaping Test Document',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: '१. मराठी जोडाक्षरे आणि संयुक्त वर्ण चाचणी (Marathi Conjuncts Test)',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                bold: true,
                size: 28,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: 'महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग, मंत्रालय, मुंबई.',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: 'या चाचणीमध्ये खालील कठीण जोडाक्षरांचे परीक्षण केले जात आहे: ',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                size: 24,
              }),
              new TextRun({
                text: '१) ष्ट्र (महाराष्ट्र), २) क्ष (परीक्षा), ३) ज्ञ (ज्ञानपीठ), ४) त्र (मंत्रालय), ५) र्क (कार्यक्रम), ६) ष्ट (दृष्टी).',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                bold: true,
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 250, after: 100 },
            children: [
              new TextRun({
                text: '२. हिंदी अनुच्छेद आणि मात्रा स्थान चाचणी (Hindi Matra Alignment)',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                bold: true,
                size: 28,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: 'यह एक आधिकारिक देवनागरी परीक्षण दस्तावेज़ है। इसमें सभी संयुक्त वर्ण, अनुस्वार और ह्रस्व-इ की मात्रा के उचित स्थान निर्धारण की जाँच की जा रही है। किसी भी शब्द में वर्ण पृथक नहीं होने चाहिए।',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 250, after: 100 },
            children: [
              new TextRun({
                text: '३. मिश्र-भाषा सारणी चाचणी (Mixed-Language Table Test)',
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
                bold: true,
                size: 28,
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'अनुक्रमांक (No.)', bold: true, font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'संकल्पना (Topic)', bold: true, font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'वर्णन (Description)', bold: true, font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'स्थिती (Status)', bold: true, font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '०१', font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Complex Text Shaping', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'HarfBuzz OpenType GSUB/GPOS tables for Devanagari ligatures.', font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'तपासणी पूर्ण (Verified)', font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: '०२', font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Devanagari Numerals', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'मराठी अंक: ०, १, २, ३, ४, ५, ६, ७, ८, ९ चाचणी.', font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'सक्रिय (Active)', font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' } })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'टीप: हा दस्तऐवज Microsoft Word (Windows/macOS) आणि LibreOffice Writer (Linux) मध्ये उघडून तपासण्यासाठी तयार केला आहे.',
                italics: true,
                size: 20,
                font: { name: 'Noto Sans Devanagari', cs: 'Noto Sans Devanagari' },
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Standalone execution test
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, 'Devanagari_Feasibility_Test.docx');
  generateDevanagariFeasibilityDocx().then((buffer) => {
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Generated DOCX successfully: ${filePath} (${buffer.length} bytes)`);
  });
}
