import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  BookMarked,
  Info,
} from 'lucide-react';

interface GroundingSource {
  title: string;
  uri: string;
}

interface BenchmarkResult {
  codePointCER: { errorRate: number; totalErrors: number; referenceLength: number };
  graphemeClusterCER: { errorRate: number; totalErrors: number; referenceLength: number };
  lexicalWER: { errorRate: number; totalErrors: number; referenceLength: number };
  punctuationErrorRate: { errorRate: number; totalErrors: number; referenceLength: number };
  maskingDiagnostics: {
    maskedSpansCount: number;
    unsupportedGuessesCount: number;
    falseDeletionCount: number;
  };
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'searchGrounding' | 'benchmark' | 'dataset' | 'shaping'>('overview');

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('महाराष्ट्र शिक्षण मंडळ historical overview and curriculum');
  const [noteContext, setNoteContext] = useState('Found in 12th standard Marathi physics and history handwritten notes.');
  const [searchLanguage, setSearchLanguage] = useState('Marathi & English');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Benchmark State
  const [benchRef, setBenchRef] = useState('महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग। आज [illegible] पाऊस पडण्याची शक्यता आहे.');
  const [benchHyp, setBenchHyp] = useState('महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग। आज खूप पाऊस पडण्याची शक्यता आहे.');
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchResult, setBenchResult] = useState<BenchmarkResult | null>(null);
  const [benchError, setBenchError] = useState<string | null>(null);

  // Search Grounding Handler
  const handleExecuteSearchGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          noteContext,
          language: searchLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search grounding request failed');

      setSearchResponse(data.answer);
      setSearchSources(data.sources || []);
      setSearchQueries(data.searchQueries || []);
    } catch (err: any) {
      let message = err.message || 'Error executing search grounding';
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        message = 'Google API Quota limit reached (429 RESOURCE_EXHAUSTED). To increase your rate limits or use higher throughput, select a billing-enabled API key in the Settings > Secrets panel.';
      }
      setSearchError(message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Benchmark Scoring Handler
  const handleRunBenchmarkScore = async () => {
    setBenchLoading(true);
    setBenchError(null);
    try {
      const res = await fetch('/api/benchmark/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: benchRef,
          hypothesis: benchHyp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Benchmark scoring failed');
      setBenchResult(data);
    } catch (err: any) {
      setBenchError(err.message || 'Scoring error');
    } finally {
      setBenchLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-30 border-b ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-md px-6 py-3.5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">LipiScript</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">Phase 0 Console</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI Handwritten Notes to Digital E-Book SaaS Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg border text-sm transition-colors ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
            <span>Status: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gate 1 Approved · Gate 2 Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="md:col-span-3 space-y-2">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Project & Approval Gates</span>
            </button>

            <button
              onClick={() => setActiveTab('searchGrounding')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'searchGrounding' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span>Google Search Grounding</span>
                <span className="block text-[11px] opacity-80 font-normal">gemini-3.8-flash tool</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'benchmark' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Indic Scoring Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('dataset')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'dataset' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}
            >
              <BookMarked className="w-4 h-4 shrink-0" />
              <span>Dataset Ingestion Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('shaping')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'shaping' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Devanagari Shaping Lab</span>
            </button>
          </nav>

          {/* Quick Notice Card */}
          <div className={`mt-6 p-4 rounded-xl border text-xs space-y-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Strict Gate Rules</span>
            </div>
            <p>
              Live OCR calls require explicit <strong>Gate 3</strong> authorization. Production SaaS code is locked until <strong>Gate 6</strong>.
            </p>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="md:col-span-9">
          {/* TAB 1: OVERVIEW & APPROVAL GATES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className="text-xl font-bold tracking-tight mb-1">Approval Gate Tracker</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Phase 0 research and governance progress. No gate can be bypassed without explicit review.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Gate 1: Phase 0 Document Approval</div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-400">Plan and technical feasibility approved on November 3, 2026</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      APPROVED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
                      <div>
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">Gate 2: Sample & Benchmark Preparation</div>
                        <div className="text-xs text-blue-700 dark:text-blue-400">Day 1 scoring utilities built; awaiting 30 handwritten pages & 10 transcripts</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                      IN PROGRESS
                    </span>
                  </div>

                  {[
                    { gate: 'Gate 3', name: 'Live OCR Benchmark Execution', desc: 'Requires receipt of samples, transcripts & explicit user authorization' },
                    { gate: 'Gate 4', name: 'Feasibility Report Review & Decision', desc: 'Synthesize CER/WER scores, costs, and font shaping tests' },
                    { gate: 'Gate 5', name: 'Product Blueprint & Database Design', desc: 'Finalize private storage, schemas, and UI/UX flows' },
                    { gate: 'Gate 6', name: 'Milestone-by-Milestone Development', desc: 'Full-stack application implementation' },
                    { gate: 'Gate 7', name: 'Final QA, Security & Deployment', desc: 'End-to-end data isolation and production verification' },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border ${darkMode ? 'border-slate-800/80 bg-slate-900/40 text-slate-500' : 'border-slate-200/60 bg-slate-100/50 text-slate-400'}`}>
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 shrink-0 opacity-70" />
                        <div>
                          <div className="text-sm font-medium">{item.gate}: {item.name}</div>
                          <div className="text-xs opacity-80">{item.desc}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 font-medium">LOCKED</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Non-Negotiables Box */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100">Confirmed Product Guardrails</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Zero AI Hallucination Policy</span>
                    <p className="text-slate-500 dark:text-slate-400">No spelling fixes, no grammar rewrites, no translation. Unreadable content must be tagged [illegible].</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Real Vector Digital Text</span>
                    <p className="text-slate-500 dark:text-slate-400">Final PDF must contain selectable, searchable digital font text. Never embed whole handwritten page photos as the text body.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">4 Equal Languages</span>
                    <p className="text-slate-500 dark:text-slate-400">Marathi, Hindi, English, and Mixed scripts (Maranglish / Hinglish) have equal first-class status.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Individual Privacy & Data Isolation</span>
                    <p className="text-slate-500 dark:text-slate-400">Strict per-user data segregation. No shared workspaces, no teacher/admin snooping into personal student notes.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SEARCH GROUNDING (Requested Feature) */}
          {activeTab === 'searchGrounding' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold tracking-tight">Google Search Grounding</h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        gemini-3.8-flash + googleSearch
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Query real-time Google Search data to verify terms, dates, and concepts found in handwritten notes.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleExecuteSearchGrounding} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Search Query / Term to Verify
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Maharashtra State Board HSC syllabus updates or Shivaji Maharaj coronation date"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Context from Handwritten Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={noteContext}
                        onChange={(e) => setNoteContext(e.target.value)}
                        placeholder="Context where term appeared..."
                        className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Language Focus
                      </label>
                      <select
                        value={searchLanguage}
                        onChange={(e) => setSearchLanguage(e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                      >
                        <option value="Marathi">Marathi</option>
                        <option value="Hindi">Hindi</option>
                        <option value="English">English</option>
                        <option value="Marathi & English">Marathi & English (Mixed)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Grounded responses include direct source URLs from <code className="text-blue-600 dark:text-blue-400">groundingMetadata</code>.
                    </p>
                    <button
                      type="submit"
                      disabled={searchLoading || !searchQuery.trim()}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                    >
                      {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>Search & Verify Context</span>
                    </button>
                  </div>
                </form>

                {searchError && (
                  <div className="mt-4 p-3.5 rounded-lg border border-red-500/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}

                {searchResponse && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                        Grounded Synthesis Response
                      </span>
                      {searchQueries.length > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Search queries executed: {searchQueries.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      {searchResponse}
                    </div>

                    {/* Sources & Citations */}
                    {searchSources.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                          Verified Web Sources (Google Search Grounding):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {searchSources.map((source, idx) => (
                            <a
                              key={idx}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors hover:border-blue-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-blue-400' : 'bg-white border-slate-200 text-blue-600'}`}
                            >
                              <span className="truncate font-medium">{source.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INDIC SCORING HARNESS */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className="text-xl font-bold tracking-tight mb-1">Indic Benchmark Scoring Harness</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Test the mathematical Levenshtein CER, Extended Grapheme-Cluster CER (UAX #29), Lexical WER, and [illegible] masking algorithms.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Ground-Truth Reference Text ($T_&#123;\text&#123;ref&#125;&#125;$)
                    </label>
                    <textarea
                      rows={4}
                      value={benchRef}
                      onChange={(e) => setBenchRef(e.target.value)}
                      className={`w-full p-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      OCR Candidate Hypothesis ($T_&#123;\text&#123;hyp&#125;&#125;$)
                    </label>
                    <textarea
                      rows={4}
                      value={benchHyp}
                      onChange={(e) => setBenchHyp(e.target.value)}
                      className={`w-full p-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBenchRef('महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग।');
                        setBenchHyp('महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग।');
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      Sample: Exact Match
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBenchRef('परीक्षा');
                        setBenchHyp('परिक्षा');
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      Sample: Matra Variant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBenchRef('दिनांक १५/०८ रोजी [illegible] जाहीर होईल.');
                        setBenchHyp('दिनांक १५/०८ रोजी निकाल जाहीर होईल.');
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      Sample: Hallucinated Guess
                    </button>
                  </div>

                  <button
                    onClick={handleRunBenchmarkScore}
                    disabled={benchLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                  >
                    {benchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>Compute Metric Scores</span>
                  </button>
                </div>

                {benchError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs">
                    {benchError}
                  </div>
                )}

                {benchResult && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="font-semibold text-sm">Calculated Metric Outputs</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Code-point CER</span>
                        <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                          {(benchResult.codePointCER.errorRate * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Errors: {benchResult.codePointCER.totalErrors} / {benchResult.codePointCER.referenceLength}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Grapheme-Cluster CER</span>
                        <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                          {(benchResult.graphemeClusterCER.errorRate * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Clusters: {benchResult.graphemeClusterCER.totalErrors} / {benchResult.graphemeClusterCER.referenceLength}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Lexical WER</span>
                        <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {(benchResult.lexicalWER.errorRate * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Words: {benchResult.lexicalWER.totalErrors} / {benchResult.lexicalWER.referenceLength}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Unsupported Guesses</span>
                        <span className={`text-xl font-bold font-mono ${benchResult.maskingDiagnostics.unsupportedGuessesCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {benchResult.maskingDiagnostics.unsupportedGuessesCount}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Inside [illegible] spans
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DATASET INGESTION TRACKER */}
          {activeTab === 'dataset' && (
            <DatasetManager darkMode={darkMode} />
          )}

          {/* TAB 5: DEVANAGARI SHAPING LAB */}
          {activeTab === 'shaping' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className="text-xl font-bold tracking-tight mb-1">Devanagari Complex Text Shaping Lab</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Verify how HarfBuzz and modern browser rendering shape Marathi and Hindi conjuncts (*Jodakshare*) with Google Noto Sans Devanagari.
                </p>

                <div className="space-y-4">
                  {[
                    { title: 'Complex Conjunct (Jodakshar)', string: 'महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग', note: 'Checks: ष्ट्र (ष्+ट्+र्) compound ligature formation' },
                    { title: 'Matra Reordering & Half-Consonants', string: 'विद्यापीठ, दृष्टी, संपर्क, कार्यक्रम', note: 'Checks: short-i matra visual inversion and repha hook' },
                    { title: 'Numerals & Legal Danda', string: 'दिनांक १५/०८/२०२६ रोजी निर्णय घेण्यात आला।', note: 'Checks: Marathi/Devanagari numerals and danda (।)' },
                  ].map((test, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{test.title}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Selectable & Searchable</span>
                      </div>
                      <div className="text-2xl font-serif py-1 tracking-wide text-slate-900 dark:text-slate-100 select-all">
                        {test.string}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                        {test.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

interface DatasetPage {
  id: string;
  type: 'gold' | 'qualitative';
  language: string;
  difficulty?: string;
  characteristics?: string;
  focus?: string;
  imageFile?: string | null;
  imageStatus?: string;
  transcriptFile?: string | null;
  transcriptStatus?: string;
}

interface DatasetManifest {
  totalTargetPages: number;
  scoredGoldPagesCount: number;
  qualitativePagesCount: number;
  languageDistribution: { marathi: number; hindi: number; english: number; mixed: number };
  pages: DatasetPage[];
}

function DatasetManager({ darkMode }: { darkMode: boolean }) {
  const [manifest, setManifest] = useState<DatasetManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<DatasetPage | null>(null);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchManifest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/benchmark/dataset');
      if (!res.ok) throw new Error('Failed to load dataset manifest');
      const data = await res.json();
      setManifest(data);
    } catch (err: any) {
      setError(err.message || 'Error loading manifest');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchManifest();
  }, []);

  const handleOpenTranscriptEditor = (page: DatasetPage) => {
    setSelectedPage(page);
    setTranscriptInput('');
    setSaveSuccess(null);
  };

  const handleSaveTranscript = async () => {
    if (!selectedPage || !transcriptInput.trim()) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await fetch('/api/benchmark/save-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: selectedPage.id,
          transcriptText: transcriptInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save transcript');
      setSaveSuccess(`Transcript for ${selectedPage.id} saved and normalized to NFC successfully.`);
      fetchManifest();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageFileChange = async (pageId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/benchmark/register-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            fileName: file.name,
            base64Data,
          }),
        });
        if (res.ok) {
          fetchManifest();
        }
      } catch (err) {
        console.error('Image upload failed', err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        <span className="text-sm text-slate-500">Loading dataset manifest...</span>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
        {error || 'Unable to load dataset manifest.'}
      </div>
    );
  }

  const goldPages = manifest.pages.filter(p => p.type === 'gold');
  const qualPages = manifest.pages.filter(p => p.type === 'qualitative');

  const readyTranscripts = goldPages.filter(p => p.transcriptStatus === 'ready').length;
  const readyImages = manifest.pages.filter(p => p.imageStatus === 'ready' || p.imageFile).length;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Dataset Ingestion Tracker (Gate 2)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage the 30 handwritten image pages and 10 manually prepared reference transcripts.
            </p>
          </div>
          <button
            onClick={fetchManifest}
            className="p-2 rounded-lg border text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Total Target Pages</span>
            <span className="text-2xl font-bold font-mono">30</span>
            <span className="text-[10px] text-slate-400 block">8 Marathi · 8 Hindi · 7 En · 7 Mix</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Scored Gold Transcripts</span>
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{readyTranscripts} / 10</span>
            <span className="text-[10px] text-slate-400 block">{10 - readyTranscripts} transcripts pending</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Attached Page Scans</span>
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{readyImages} / 30</span>
            <span className="text-[10px] text-slate-400 block">{30 - readyImages} images pending</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Normalization Status</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">Unicode NFC Enforced</span>
            <span className="text-[10px] text-slate-400 block">Auto-applied upon save</span>
          </div>
        </div>

        {/* SECTION 1: THE 10 SCORED GOLD PAGES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
              The 10 Quantitative Scored Gold Pages (Manual Transcripts Required)
            </h3>
            <span className="text-xs text-slate-500">3 Marathi · 3 Hindi · 2 English · 2 Mixed</span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {goldPages.map((page) => (
              <div key={page.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{page.id}</span>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {page.language} <span className="font-normal text-slate-500">({page.difficulty})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm">{page.characteristics}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Transcript Status */}
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${page.transcriptStatus === 'ready' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'}`}>
                    {page.transcriptStatus === 'ready' ? 'Transcript Ready ✅' : 'Transcript Pending'}
                  </span>

                  {/* Image Status */}
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${page.imageStatus === 'ready' || page.imageFile ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {page.imageFile ? 'Image Attached' : 'No Image'}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => handleOpenTranscriptEditor(page)}
                    className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100"
                  >
                    Enter / Edit Transcript
                  </button>

                  <label className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span>Upload Scan</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleImageFileChange(page.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: THE 20 QUALITATIVE PAGES */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
              The 20 Qualitative Evaluation Pages (5 per language group)
            </h3>
            <span className="text-xs text-slate-500">Evaluated on formulas, tables & diagram labels</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {qualPages.map((page) => (
              <div key={page.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{page.id}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{page.language}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{page.focus}</p>
                </div>

                <label className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 text-[11px]">
                  <span>{page.imageFile ? 'Attached ✅' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleImageFileChange(page.id, e)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRANSCRIPT EDITOR MODAL */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-2xl w-full p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">
                  Ground-Truth Transcript: <span className="text-blue-600 dark:text-blue-400">{selectedPage.id} ({selectedPage.language} - {selectedPage.difficulty})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Type or paste the manual ground-truth text. Unreadable words must be marked <code className="text-blue-500">[illegible]</code>.
                </p>
              </div>
              <button
                onClick={() => setSelectedPage(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={8}
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder="Paste or type exact manual transcription here in Marathi, Hindi, English, or mixed script..."
              className={`w-full p-3.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />

            {saveSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs">
                {saveSuccess}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] text-slate-400">
                Rule: Zero auto-correct. Preserves author spelling and Unicode NFC.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPage(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTranscript}
                  disabled={saving || !transcriptInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs disabled:opacity-50"
                >
                  {saving ? 'Saving & Normalizing...' : 'Save & Normalize to NFC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
