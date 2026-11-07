import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  FileCheck,
  ExternalLink,
  X,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { Project } from '../types';

interface PublishModalProps {
  project: Project;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'docx'>('pdf');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Prepare project export payload
  const buildExportPayload = () => {
    return {
      title: project.title,
      author: project.author,
      subject: project.subject,
      language: project.language,
      description: project.description,
      chapters: project.chapters.map((chap) => ({
        id: chap.id,
        title: chap.title,
        synopsis: chap.synopsis,
        pages: project.pages
          .filter((p) => p.chapterId === chap.id)
          .map((p) => ({
            id: p.id,
            pageNumber: p.pageNumber,
            title: p.title,
            text: p.text,
          })),
      })),
    };
  };

  // Load PDF HTML preview on open
  React.useEffect(() => {
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const payload = buildExportPayload();
        const res = await fetch('/api/export/pdf-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const html = await res.text();
        setPreviewHtml(html);
      } catch (err) {
        console.error('Failed to load PDF preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [project.id]);

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      const payload = buildExportPayload();
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('DOCX export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('DOCX download error:', err);
      alert('DOCX download failed. Please check network logs.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleOpenPrintWindow = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
    }
  };

  const totalWords = project.pages.reduce((acc, p) => acc + (p.wordCount || 0), 0);
  const totalChars = project.pages.reduce((acc, p) => acc + (p.charCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  डिजिटल ई-बुक प्रकाशन केंद्र (Publishing Studio)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Vector CTS Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project.title} · {project.chapters.length} प्रकरणे · {project.pages.length} पृष्ठे · {totalWords} शब्द
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Action Buttons */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chromium HarfBuzz व्हेक्टर PDF (Vector PDF)</span>
            </button>

            <button
              onClick={() => setActiveTab('docx')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'docx'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Microsoft Word / LibreOffice (.docx)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'pdf' && (
              <>
                <button
                  onClick={handleOpenPrintWindow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>नवीन टॅबमध्ये उघडा</span>
                </button>
                <button
                  onClick={handleOpenPrintWindow}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>व्हेक्टर PDF प्रिंट / डाउनलोड करा (Ctrl+P)</span>
                </button>
              </>
            )}

            {activeTab === 'docx' && (
              <button
                onClick={handleDownloadDocx}
                disabled={isExportingDocx}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Download className={`w-3.5 h-3.5 ${isExportingDocx ? 'animate-spin' : ''}`} />
                <span>
                  {isExportingDocx
                    ? 'DOCX तयार होत आहे...'
                    : 'OpenXML Word (.docx) डाउनलोड करा'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'pdf' ? (
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-hidden flex flex-col">
              {loadingPreview ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  व्हेक्टर लेआउट तयार होत आहे...
                </div>
              ) : (
                <iframe
                  title="PDF Preview"
                  srcDoc={previewHtml}
                  className="w-full flex-1 rounded-xl shadow-lg border border-slate-300 dark:border-slate-800 bg-white"
                />
              )}
            </div>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
                  OpenXML DOCX देवनागरी टायपोग्राफी पडताळणी
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  LipiScript द्वारे निर्माण होणारा .docx दस्तऐवज थेट <code>w:cs="Noto Sans Devanagari"</code> आणि{' '}
                  <code>complexScript: true</code> ओपनएक्सएमएल टॅग्ज वापरतो. यामुळे मायक्रोसॉफ्ट वर्ड (Word for Windows/macOS)
                  किंवा लिबरऑफिस रायटर (LibreOffice Writer) मध्ये उघडल्यावर कोणतेही जोडाक्षर तुटत नाही (जसे: ष्ट्र, ज्ञ, क्ष, र्क).
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block mb-1">दस्तऐवज शीर्षक:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{project.title}</strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block mb-1">फॉन्ट कुटुंब:</span>
                    <strong className="text-slate-800 dark:text-slate-200">Noto Sans Devanagari</strong>
                  </div>
                </div>

                <button
                  onClick={handleDownloadDocx}
                  disabled={isExportingDocx}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className={`w-4 h-4 ${isExportingDocx ? 'animate-spin' : ''}`} />
                  <span>{isExportingDocx ? 'फाइल तयार होत आहे...' : 'आताच .docx फाइल सेव्ह करा'}</span>
                </button>
              </div>

              {/* Verified Feature Checklist */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                  प्रकाशन गुणवत्ता पडताळणी सूची (Quality Checklist)
                </h5>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Complex Text Shaping:</strong> OpenType GSUB/GPOS आधारित अखंड जोडाक्षरे.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Selectable & Searchable:</strong> Ctrl+F द्वारे सर्व मराठी/हिंदी शब्द शोधता येतात.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Strict Fidelity:</strong> शून्य छुपे बदल (Zero silent auto-corrections).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Unicode NFC:</strong> जागतिक प्रमाणबद्ध युनिकोड अक्षरांकन.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
