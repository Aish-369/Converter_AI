import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';

interface GateTrackerProps {
  onClose?: () => void;
}

export const GateTracker: React.FC<GateTrackerProps> = ({ onClose }) => {
  const [selectedGate, setSelectedGate] = useState<number>(6);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  const gates = [
    {
      num: 1,
      title: 'Phase 0 Feasibility Document',
      status: 'APPROVED',
      badge: 'Approved ✅',
      desc: 'Ratified language scope (Marathi, Hindi, English, Mixed), zero-hallucination guardrail, and benchmark metrics suite.',
    },
    {
      num: 2,
      title: 'Sample & Benchmark Preparation',
      status: 'APPROVED',
      badge: 'Approved ✅',
      desc: 'Curated 30 notebook pages (10 Gold GT-01 to GT-10 + 20 Qualitative Q-01 to Q-20) with frozen [illegible] masks.',
    },
    {
      num: 3,
      title: 'Live OCR Benchmark Execution',
      status: 'APPROVED',
      badge: 'Approved ✅',
      desc: 'Benchmarked candidate models under frozen prompts with safety lock verification.',
    },
    {
      num: 4,
      title: 'Feasibility Report & Decision',
      status: 'APPROVED',
      badge: 'Approved ✅',
      desc: 'Formally selected Gemini 3.8 Flash ($1.20/1k pages) and Chromium HarfBuzz Vector PDF Pipeline.',
    },
    {
      num: 5,
      title: 'Product Blueprint & Database Design',
      status: 'APPROVED',
      badge: 'Approved ✅',
      desc: 'Ratified strict user-scoped private vault architecture and zero-cloud-leakage security boundaries.',
    },
    {
      num: 6,
      title: 'Milestone-by-Milestone Development',
      status: 'ACTIVE',
      badge: 'Active & Deployed 🚀',
      desc: 'Full implementation: Private on-device vault, Gemini 3.8 Flash OCR, Dual-pane review, Chapter organizer, and Vector PDF & DOCX publishing.',
    },
    {
      num: 7,
      title: 'Final QA, Security & Deployment',
      status: 'READY',
      badge: 'Ready for Review 🏁',
      desc: 'End-to-end integration verification, multi-device layout audits, and production readiness.',
    },
  ];

  useEffect(() => {
    if (selectedGate === 4) {
      setLoadingReport(true);
      fetch('/api/feasibility/gate4-report')
        .then((res) => res.json())
        .then((data) => setReportMarkdown(data.markdown || ''))
        .catch(() => setReportMarkdown('Report not available'))
        .finally(() => setLoadingReport(false));
    } else if (selectedGate === 5) {
      setLoadingReport(true);
      fetch('/api/blueprint/gate5')
        .then((res) => res.json())
        .then((data) => setReportMarkdown(data.markdown || ''))
        .catch(() => setReportMarkdown('Blueprint not available'))
        .finally(() => setLoadingReport(false));
    }
  }, [selectedGate]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              LipiScript Sequential Approval Gates (Gate 1 ते 7)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rigorous 7-gate lifecycle ensuring strict privacy, fidelity, and Devanagari vector precision.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Gates Horizontal Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-6">
        {gates.map((g) => {
          const isSelected = selectedGate === g.num;
          return (
            <div
              key={g.num}
              onClick={() => setSelectedGate(g.num)}
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-850/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-500">
                  Gate {g.num}
                </span>
                {g.status === 'APPROVED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : g.status === 'ACTIVE' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 mb-1">
                {g.title}
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded self-start ${
                  g.status === 'APPROVED'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : g.status === 'ACTIVE'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {g.badge}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Gate Detail Box */}
      <div className="p-5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Gate {selectedGate}: {gates[selectedGate - 1].title}
            </span>
            <span className="text-xs text-slate-500">({gates[selectedGate - 1].status})</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedGate === 4 && (
              <span className="text-xs text-blue-600 font-semibold">
                ✓ Gemini 3.8 Flash Primary Decision
              </span>
            )}
            {selectedGate === 5 && (
              <span className="text-xs text-emerald-600 font-semibold">
                ✓ User-Scoped Vault Architecture
              </span>
            )}
            {selectedGate === 6 && (
              <span className="text-xs text-blue-600 font-semibold">
                ✓ Live Production Platform Active
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          {gates[selectedGate - 1].desc}
        </p>

        {/* Gate 4 & 5 Report Viewers */}
        {(selectedGate === 4 || selectedGate === 5) && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              दस्तऐवज मजकूर पूर्वावलोकन (Document Markdown):
            </span>
            {loadingReport ? (
              <div className="text-xs text-slate-400 py-4 text-center">दस्तऐवज लोड होत आहे...</div>
            ) : (
              <pre className="max-h-64 overflow-y-auto p-3 bg-white dark:bg-slate-900 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                {reportMarkdown || 'अहवाल उपलब्ध नाही.'}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
