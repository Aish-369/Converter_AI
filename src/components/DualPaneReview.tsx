import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  SunMedium,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Search,
  BookOpen,
  HelpCircle,
  Hash,
  Bold,
  Italic,
  Sigma,
  Table as TableIcon,
  Tag,
  Eye,
} from 'lucide-react';
import { NotePage, Project } from '../types';

interface DualPaneReviewProps {
  page: NotePage;
  project: Project;
  onUpdatePage: (updates: Partial<NotePage>) => void;
  onOpenSearchGrounding: (selectedTerm?: string) => void;
}

export const DualPaneReview: React.FC<DualPaneReviewProps> = ({
  page,
  project,
  onUpdatePage,
  onOpenSearchGrounding,
}) => {
  // Zoom & Viewer State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);

  // Editor State
  const [editorText, setEditorText] = useState<string>(page.text || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Illegible tokens modal/panel
  const [showIllegibleResolver, setShowIllegibleResolver] = useState<boolean>(false);
  const [replacementWord, setReplacementWord] = useState<string>('');

  useEffect(() => {
    setEditorText(page.text || '');
    setOcrError(null);
  }, [page.id, page.text]);

  const handleTextChange = (newText: string) => {
    setEditorText(newText);
    const charCount = newText.length;
    const wordCount = newText ? newText.split(/\s+/).filter(Boolean).length : 0;
    const illegibleMatches = newText.match(/\[illegible\]/g);
    const illegibleCount = illegibleMatches ? illegibleMatches.length : 0;

    onUpdatePage({
      text: newText,
      charCount,
      wordCount,
      illegibleCount,
      status: page.status === 'draft' && newText ? 'transcribed' : page.status,
    });
  };

  const handleRunOcr = async () => {
    if (!page.imageBase64) return;
    setOcrLoading(true);
    setOcrError(null);

    try {
      let base64Payload = page.imageBase64;
      // If image is a local server path (e.g. /api/benchmark/image/GT-01), fetch it first
      if (base64Payload.startsWith('/')) {
        const imgRes = await fetch(base64Payload);
        const blob = await imgRes.blob();
        base64Payload = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await fetch('/api/ocr/process-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Payload,
          mimeType: page.imageFileName.endsWith('.png')
            ? 'image/png'
            : page.imageFileName.endsWith('.svg')
            ? 'image/svg+xml'
            : 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OCR processing failed');
      }

      const result = data.result;
      setEditorText(result.text);

      onUpdatePage({
        text: result.text,
        charCount: result.charCount,
        wordCount: result.wordCount,
        illegibleCount: result.illegibleCount,
        ocrLatencyMs: result.latencyMs,
        ocrTokens: { input: result.inputTokens, output: result.outputTokens },
        status: 'transcribed',
      });
    } catch (err: any) {
      setOcrError(err.message || 'OCR request failed');
    } finally {
      setOcrLoading(false);
    }
  };

  // Helper formatting inserts
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('devanagari-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editorText.substring(start, end);
    const replacement = `${prefix}${selected || 'शब्द'}${suffix}`;

    const newText = editorText.substring(0, start) + replacement + editorText.substring(end);
    handleTextChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  const handleResolveFirstIllegible = () => {
    if (!replacementWord.trim()) return;
    const newText = editorText.replace('[illegible]', replacementWord.trim());
    handleTextChange(newText);
    setReplacementWord('');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editorText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Action / Toolbar Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{page.title || `पृष्ठ ${page.pageNumber}`}</span>
          </span>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              page.status === 'reviewed'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : page.status === 'transcribed'
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            {page.status === 'reviewed'
              ? '✓ पडताळणी पूर्ण (Reviewed)'
              : page.status === 'transcribed'
              ? '⚡ AI रुपांतरीत (Transcribed)'
              : '📝 प्राथमिक स्कॅन (Draft Scan)'}
          </span>

          {page.ocrLatencyMs && (
            <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
              Latency: {page.ocrLatencyMs}ms · Gemini 3.8 Flash
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Gemini 3.8 Flash OCR Trigger */}
          <button
            onClick={handleRunOcr}
            disabled={ocrLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            title="Transcribe note page using Gate 4 Selected Primary Engine (Gemini 3.8 Flash)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${ocrLoading ? 'animate-spin' : ''}`} />
            <span>
              {ocrLoading
                ? 'AI वाचन सुरू आहे (Processing OCR)...'
                : 'Gemini 3.8 Flash द्वारे वाचन करा'}
            </span>
          </button>

          {/* Mark Reviewed */}
          <button
            onClick={() =>
              onUpdatePage({
                status: page.status === 'reviewed' ? 'transcribed' : 'reviewed',
              })
            }
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              page.status === 'reviewed'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{page.status === 'reviewed' ? 'पडताळणी पूर्ण' : 'अंतिम करा'}</span>
          </button>

          {/* Fact-check with Grounding */}
          <button
            onClick={() => onOpenSearchGrounding()}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
            title="Fact-check handwritten historical, linguistic, or scientific terms via Google Search"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">तथ्य पडताळणी (Search Grounding)</span>
          </button>
        </div>
      </div>

      {ocrError && (
        <div
          className={`border-b px-6 py-2.5 text-xs flex items-center justify-between gap-3 ${
            /429|quota|RESOURCE_EXHAUSTED/i.test(ocrError)
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 ${
                /429|quota|RESOURCE_EXHAUSTED/i.test(ocrError)
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            />
            <span>{ocrError}</span>
          </div>
          <button onClick={() => setOcrError(null)} className="font-semibold underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Dual Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {/* Left Pane: Zoomable Scanned Note Inspector */}
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900/50 overflow-hidden">
          {/* Scan Controls Bar */}
          <div className="bg-slate-200/70 dark:bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-300/60 dark:border-slate-750 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>मूळ हस्तलिखित स्कॅन (Original Scan)</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 20))}
                className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] w-12 text-center text-slate-600 dark:text-slate-400">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(250, z + 20))}
                className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
              <button
                onClick={() => setInvertColors(!invertColors)}
                className={`p-1 rounded transition ${
                  invertColors
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                title="Invert Colors (High-Contrast Mode)"
              >
                <SunMedium className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Image Display Area */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            {page.imageBase64 ? (
              <div
                className="transition-transform duration-150 shadow-lg rounded border border-slate-300 dark:border-slate-700 bg-white"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  filter: invertColors ? 'invert(1) hue-rotate(180deg)' : 'none',
                }}
              >
                <img
                  src={page.imageBase64}
                  alt={page.title}
                  className="max-w-full max-h-[70vh] object-contain rounded select-none"
                />
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                या पृष्ठासाठी कोणतीही प्रतिमा जोडलेली नाही.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Devanagari Rich Text Editor */}
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
          {/* Formatting & Illegible Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => insertFormatting('# ')}
                className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => insertFormatting('## ')}
                className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => insertFormatting('**', '**')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('*', '*')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('$', '$')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                title="LaTeX Inline Math Formula"
              >
                <Sigma className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  insertFormatting(
                    '\n| घटक (Item) | वर्णन (Description) | मूल्य (Value) |\n|---|---|---|\n| १ |  |  |\n'
                  )
                }
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                title="Insert Markdown Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  insertFormatting(
                    '\n### Diagram Labels\n- आकृती १: \n- लेबल अ: \n- लेबल ब: \n'
                  )
                }
                className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                title="Insert Diagram Annotation Section"
              >
                Diagram Labels
              </button>
            </div>

            {/* Illegible Tag Counter & Quick Resolver */}
            <div className="flex items-center gap-2">
              {page.illegibleCount > 0 && (
                <button
                  onClick={() => setShowIllegibleResolver(!showIllegibleResolver)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-md text-xs font-semibold hover:bg-amber-200 transition"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{page.illegibleCount} अस्पष्ट शब्द ([illegible])</span>
                </button>
              )}

              <button
                onClick={handleCopyText}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Copy Text to Clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Illegible Resolver Quick Strip */}
          {showIllegibleResolver && page.illegibleCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  पहिले [illegible] बदला:
                </span>
                <input
                  type="text"
                  placeholder="मूळ हस्तलिखित शब्द येथे टाईप करा..."
                  value={replacementWord}
                  onChange={(e) => setReplacementWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResolveFirstIllegible()}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 w-64"
                />
                <button
                  onClick={handleResolveFirstIllegible}
                  disabled={!replacementWord.trim()}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded font-semibold text-xs transition"
                >
                  बदला (Replace)
                </button>
              </div>

              <button
                onClick={() => setShowIllegibleResolver(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                बंद करा
              </button>
            </div>
          )}

          {/* Main Textarea */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <textarea
              id="devanagari-editor"
              value={editorText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="हस्तलिखित नोट्सचे डिजिटल रूपांतर येथे दिसेल... तुम्ही थेट संपादन करू शकता."
              className="w-full flex-1 p-4 bg-transparent border-0 resize-none focus:outline-none font-sans text-slate-900 dark:text-slate-100 text-base leading-relaxed tracking-normal overflow-y-auto"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif",
                fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
              }}
            />
          </div>

          {/* Footer Statistics */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>अक्षरे (Characters): <strong className="text-slate-700 dark:text-slate-300">{page.charCount || 0}</strong></span>
              <span>शब्द (Words): <strong className="text-slate-700 dark:text-slate-300">{page.wordCount || 0}</strong></span>
              <span>ओळी (Lines): <strong className="text-slate-700 dark:text-slate-300">{editorText.split('\n').length}</strong></span>
              {page.illegibleCount > 0 && (
                <span className="text-amber-600 font-semibold">
                  अस्पष्ट: {page.illegibleCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Unicode NFC · Noto Sans Devanagari</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Auto-saved to private vault" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
