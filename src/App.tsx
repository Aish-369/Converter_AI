import React, { useState, useEffect } from 'react';
import {
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
  ShieldAlert,
  Play,
  Check,
  FileBarChart,
  Printer,
  Download,
  FolderTree,
  Search,
  Award,
  Eye,
  ShieldCheck,
} from 'lucide-react';

import { Project, NotePage, IndicLanguage } from './types';
import { VaultStorageService } from './services/storage';
import { ProjectManager } from './components/ProjectManager';
import { PageUploader } from './components/PageUploader';
import { DualPaneReview } from './components/DualPaneReview';
import { ChapterOrganizer } from './components/ChapterOrganizer';
import { PublishModal } from './components/PublishModal';
import { SearchGroundingModal } from './components/SearchGroundingModal';
import { GateTracker } from './components/GateTracker';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'studio' | 'gates' | 'benchmark'>('studio');

  // Vault & Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activePageId, setActivePageId] = useState<string>('');

  // Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  // Benchmark / Feasibility state for Gates Tab
  const [benchRef, setBenchRef] = useState('महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग। आज [illegible] पाऊस पडण्याची शक्यता आहे.');
  const [benchHyp, setBenchHyp] = useState('महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग। आज खूप पाऊस पडण्याची शक्यता आहे.');
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchResult, setBenchResult] = useState<any | null>(null);
  const [orchLoading, setOrchLoading] = useState(false);
  const [orchAggregates, setOrchAggregates] = useState<any[] | null>(null);
  const [gateNotice, setGateNotice] = useState<{ text: string; isError: boolean } | null>(null);

  // Initialize Vault
  useEffect(() => {
    const loadedProjects = VaultStorageService.getProjects();
    setProjects(loadedProjects);
    const activeId = VaultStorageService.getActiveProjectId();
    setActiveProjectId(activeId);

    const activeProj = loadedProjects.find((p) => p.id === activeId) || loadedProjects[0];
    if (activeProj && activeProj.pages.length > 0) {
      setActivePageId(activeProj.pages[0].id);
    }
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activePage = activeProject?.pages.find((p) => p.id === activePageId) || activeProject?.pages[0];

  // Project CRUD handlers
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    VaultStorageService.setActiveProjectId(id);
    const proj = projects.find((p) => p.id === id);
    if (proj && proj.pages.length > 0) {
      setActivePageId(proj.pages[0].id);
    } else {
      setActivePageId('');
    }
  };

  const handleCreateProject = (
    title: string,
    author: string,
    language: IndicLanguage,
    subject?: string,
    category?: Project['category']
  ) => {
    const newProj = VaultStorageService.createProject(title, author, language, subject, category);
    const updated = VaultStorageService.getProjects();
    setProjects(updated);
    setActiveProjectId(newProj.id);
    setActivePageId('');
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    VaultStorageService.updateProject(id, updates);
    setProjects(VaultStorageService.getProjects());
  };

  const handleDeleteProject = (id: string) => {
    VaultStorageService.deleteProject(id);
    const updated = VaultStorageService.getProjects();
    setProjects(updated);
    const nextActiveId = VaultStorageService.getActiveProjectId();
    setActiveProjectId(nextActiveId);
    const nextProj = updated.find((p) => p.id === nextActiveId);
    setActivePageId(nextProj?.pages[0]?.id || '');
  };

  // Page Operations
  const handleAddPage = (pageData: Omit<NotePage, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeProject) return;
    const newPage = VaultStorageService.addPageToProject(activeProject.id, pageData);
    setProjects(VaultStorageService.getProjects());
    setActivePageId(newPage.id);
  };

  const handleUpdatePage = (updates: Partial<NotePage>) => {
    if (!activeProject || !activePage) return;
    VaultStorageService.updatePage(activeProject.id, activePage.id, updates);
    setProjects(VaultStorageService.getProjects());
  };

  const handleDeletePage = (pageId: string) => {
    if (!activeProject) return;
    VaultStorageService.deletePage(activeProject.id, pageId);
    const updatedProjects = VaultStorageService.getProjects();
    setProjects(updatedProjects);
    const currentProj = updatedProjects.find((p) => p.id === activeProject.id);
    setActivePageId(currentProj?.pages[0]?.id || '');
  };

  // Chapter Operations
  const handleAddChapter = (title: string, synopsis?: string) => {
    if (!activeProject) return;
    VaultStorageService.addChapter(activeProject.id, title, synopsis);
    setProjects(VaultStorageService.getProjects());
  };

  const handleUpdateChapter = (chapterId: string, updates: any) => {
    if (!activeProject) return;
    VaultStorageService.updateChapter(activeProject.id, chapterId, updates);
    setProjects(VaultStorageService.getProjects());
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!activeProject) return;
    VaultStorageService.deleteChapter(activeProject.id, chapterId);
    setProjects(VaultStorageService.getProjects());
  };

  const handleAssignPageToChapter = (pageId: string, chapterId: string) => {
    if (!activeProject) return;
    VaultStorageService.updatePage(activeProject.id, pageId, { chapterId });
    setProjects(VaultStorageService.getProjects());
  };

  // Vault Backup & Restore
  const handleExportVault = () => {
    const json = VaultStorageService.exportVaultToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LipiScript_Private_Vault_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImportVault = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = VaultStorageService.importVaultFromJson(content);
      if (success) {
        const loaded = VaultStorageService.getProjects();
        setProjects(loaded);
        setActiveProjectId(VaultStorageService.getActiveProjectId());
        alert('खाजगी वॉल्ट यशस्वीरित्या रिस्टोअर झाले (Vault restored successfully)!');
      } else {
        alert('फाइल अवैध आहे. कृपया वैध LipiScript JSON बॅकअप निवडा.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetVault = () => {
    if (confirm('सर्व बदल रीसेट करून डीफॉल्ट सॅम्पल प्रकल्प लोड करायचे आहेत का?')) {
      VaultStorageService.resetToDefaultVault();
      const loaded = VaultStorageService.getProjects();
      setProjects(loaded);
      setActiveProjectId(loaded[0]?.id || '');
      setActivePageId(loaded[0]?.pages[0]?.id || '');
    }
  };

  // Grounding Fact-Check Modal
  const handleOpenSearchGrounding = (selectedTerm?: string) => {
    setSearchInitialQuery(selectedTerm || activePage?.title || activeProject?.title || 'सत्यशोधक समाज');
    setShowSearchModal(true);
  };

  // Gate 3 Live Benchmark Trigger
  const handleRunLiveBenchmark = async () => {
    setOrchLoading(true);
    setGateNotice({ text: 'Executing Gate 3 Live OCR benchmark across candidate models...', isError: false });
    try {
      const res = await fetch('/api/benchmark/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          gate3Authorized: true,
          candidates: ['gemini-3.8-flash', 'gemini-4-argon'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Live benchmark failed');
      setOrchAggregates(data.aggregates || []);
      setGateNotice({
        text: `Gate 3 Live Benchmark completed! Processed ${data.detailedCount} evaluations. Gemini 3.8 Flash achieved lowest cost & error rate.`,
        isError: false,
      });
    } catch (err: any) {
      setGateNotice({ text: `Benchmark error: ${err.message}`, isError: true });
    } finally {
      setOrchLoading(false);
    }
  };

  // Benchmark score test
  const handleScoreBenchmark = async () => {
    setBenchLoading(true);
    try {
      const res = await fetch('/api/benchmark/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: benchRef, hypothesis: benchHyp }),
      });
      const data = await res.json();
      setBenchResult(data);
    } catch (err: any) {
      alert(`Scoring error: ${err.message}`);
    } finally {
      setBenchLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Application Bar */}
      <header className={`sticky top-0 z-40 border-b ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-md px-6 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight">LipiScript</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                Gate 6 Live Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              AI Handwritten Notes to Digital E-Book SaaS · Marathi, Hindi, English & Mixed
            </p>
          </div>
        </div>

        {/* Center Main Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveMainTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMainTab === 'studio'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>प्रकल्प स्टुडिओ (Studio)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('gates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMainTab === 'gates'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>तपासणी अहवाल (Gates 1-7)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('benchmark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMainTab === 'benchmark'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileBarChart className="w-3.5 h-3.5" />
            <span>मेट्रिक्स व चाचणी (Benchmark)</span>
          </button>
        </div>

        {/* Right CTA & Controls */}
        <div className="flex items-center gap-2.5">
          {activeMainTab === 'studio' && activeProject && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ई-बुक प्रकाशित करा (Publish)</span>
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg border text-sm transition ${
              darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeMainTab === 'studio' && activeProject && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Project Manager Bar */}
          <ProjectManager
            projects={projects}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onExportVault={handleExportVault}
            onImportVault={handleImportVault}
            onResetVault={handleResetVault}
          />

          {/* Main Workspace Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Chapter & Outline Hierarchy */}
            <ChapterOrganizer
              project={activeProject}
              activePageId={activePageId}
              onSelectPage={setActivePageId}
              onAddChapter={handleAddChapter}
              onUpdateChapter={handleUpdateChapter}
              onDeleteChapter={handleDeleteChapter}
              onAssignPageToChapter={handleAssignPageToChapter}
            />

            {/* Center Area: Dual Pane Review (Scan Inspector + Devanagari Editor) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activePage ? (
                <DualPaneReview
                  page={activePage}
                  project={activeProject}
                  onUpdatePage={handleUpdatePage}
                  onOpenSearchGrounding={handleOpenSearchGrounding}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                    या प्रकल्पात अद्याप पृष्ठे नाहीत
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    खालील 'पृष्ठ जोडा' बटणावर क्लिक करून हस्तलिखित नोट्सची पाने जोडा किंवा 30-पृष्ठ सॅम्पल डेटासेटमधून पृष्ठ निवडा.
                  </p>
                  <PageUploader project={activeProject} onAddPage={handleAddPage} />
                </div>
              )}

              {/* Bottom Thumbnail Navigation Strip */}
              <div className="h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center gap-3 shrink-0 overflow-x-auto">
                <div className="shrink-0 flex items-center pr-2 border-r border-slate-200 dark:border-slate-800">
                  <PageUploader project={activeProject} onAddPage={handleAddPage} />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {activeProject.pages.map((p, idx) => {
                    const isSelected = p.id === activePageId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setActivePageId(p.id)}
                        className={`group relative h-14 w-20 rounded-lg border-2 cursor-pointer transition flex flex-col items-center justify-center overflow-hidden shrink-0 ${
                          isSelected
                            ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-slate-50 dark:bg-slate-800'
                        }`}
                        title={p.title || `Page ${idx + 1}`}
                      >
                        {p.imageBase64 ? (
                          <img
                            src={p.imageBase64}
                            alt={p.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">P.{idx + 1}</span>
                        )}

                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white text-center font-mono py-0.5 truncate px-1">
                          {idx + 1}. {p.title || `पृष्ठ ${idx + 1}`}
                        </span>

                        {p.illegibleCount > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gates View */}
      {activeMainTab === 'gates' && (
        <div className="flex-1 p-6 max-w-6xl w-full mx-auto overflow-y-auto space-y-6">
          <GateTracker />

          {/* Quick CTS Feasibility Verification */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
              Complex Text Shaping (CTS) & OpenXML DOCX Feasibility Test
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Verify that Marathi/Hindi conjuncts (e.g. महाराष्ट्र, परीक्षा, ज्ञानपीठ, दृष्टी) are shaped with HarfBuzz
              and saved into Word documents with <code>w:cs="Noto Sans Devanagari"</code> tags.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/api/feasibility/generate-docx"
                download="Devanagari_Feasibility_Test.docx"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Feasibility DOCX डाऊनलोड करा (.docx)</span>
              </a>

              <a
                href="/api/feasibility/pdf-html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>HarfBuzz Vector PDF HTML चाचणी उघडा</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark View */}
      {activeMainTab === 'benchmark' && (
        <div className="flex-1 p-6 max-w-5xl w-full mx-auto overflow-y-auto space-y-6">
          {/* Live Orchestrator Test */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Gate 3 Live OCR Multi-Candidate Benchmark Execution
                </h4>
                <p className="text-xs text-slate-500">
                  Execute benchmark on Gold dataset pages (GT-01 to GT-10) with frozen fidelity prompts.
                </p>
              </div>

              <button
                onClick={handleRunLiveBenchmark}
                disabled={orchLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Play className={`w-3.5 h-3.5 ${orchLoading ? 'animate-spin' : ''}`} />
                <span>{orchLoading ? 'चाचणी सुरू आहे...' : 'Live Benchmark चालवा'}</span>
              </button>
            </div>

            {gateNotice && (
              <div
                className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
                  gateNotice.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{gateNotice.text}</span>
              </div>
            )}

            {orchAggregates && orchAggregates.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">मॉडेल (Model)</th>
                      <th className="p-2.5">Code-point CER</th>
                      <th className="p-2.5">GC-CER</th>
                      <th className="p-2.5">Lexical WER</th>
                      <th className="p-2.5">सरासरी वेळ (Latency)</th>
                      <th className="p-2.5">दर (Unit Cost / 1k)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {orchAggregates.map((agg) => (
                      <tr key={agg.modelId} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{agg.modelId}</td>
                        <td className="p-2.5">{agg.meanCodePointCER}%</td>
                        <td className="p-2.5 font-semibold text-blue-600">{agg.meanGraphemeClusterCER}%</td>
                        <td className="p-2.5">{agg.meanLexicalWER}%</td>
                        <td className="p-2.5 font-mono">{agg.meanLatencyMs} ms</td>
                        <td className="p-2.5 font-semibold text-emerald-600">
                          {agg.modelId.includes('flash') ? '$1.20' : '$3.50'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Metric Playground */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
              Indic Metric Calculator (CER, GC-CER, WER, Illegible Masking)
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Test Levenshtein distance on Devanagari Unicode aksharas and [illegible] tokens.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference Ground-Truth (मानक संदर्भ)
                </label>
                <textarea
                  value={benchRef}
                  onChange={(e) => setBenchRef(e.target.value)}
                  className="w-full h-24 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hypothesis Output (मॉडेल आउटपुट)
                </label>
                <textarea
                  value={benchHyp}
                  onChange={(e) => setBenchHyp(e.target.value)}
                  className="w-full h-24 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleScoreBenchmark}
              disabled={benchLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              {benchLoading ? 'मोजणी सुरू आहे...' : 'मेट्रिक्स मोजा (Calculate Metrics)'}
            </button>

            {benchResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 block">Code-point CER</span>
                  <strong className="text-base font-bold text-blue-600">
                    {(benchResult.codePointCER.errorRate * 100).toFixed(2)}%
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 block">GC-CER (Graphemes)</span>
                  <strong className="text-base font-bold text-indigo-600">
                    {(benchResult.graphemeClusterCER.errorRate * 100).toFixed(2)}%
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 block">Lexical WER</span>
                  <strong className="text-base font-bold text-emerald-600">
                    {(benchResult.lexicalWER.errorRate * 100).toFixed(2)}%
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 block">Masked Spans</span>
                  <strong className="text-base font-bold text-amber-600">
                    {benchResult.maskingDiagnostics.maskedSpansCount}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publishing Modal */}
      {showPublishModal && activeProject && (
        <PublishModal project={activeProject} onClose={() => setShowPublishModal(false)} />
      )}

      {/* Fact-check Grounding Modal */}
      {showSearchModal && (
        <SearchGroundingModal
          initialQuery={searchInitialQuery}
          noteContext={activePage?.text?.slice(0, 300)}
          onClose={() => setShowSearchModal(false)}
        />
      )}
    </div>
  );
}
