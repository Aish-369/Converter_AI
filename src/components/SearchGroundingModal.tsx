import React, { useState } from 'react';
import { Search, ExternalLink, X, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface SearchGroundingModalProps {
  initialQuery?: string;
  noteContext?: string;
  onClose: () => void;
}

export const SearchGroundingModal: React.FC<SearchGroundingModalProps> = ({
  initialQuery = 'सत्यशोधक समाज स्थापना व इतिहास',
  noteContext = '',
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [context, setContext] = useState(noteContext);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setIsQuotaError(false);
    setWarningMessage(null);

    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          noteContext: context.trim(),
          language: 'Marathi, Hindi & English',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.isQuotaError) {
          setIsQuotaError(true);
        }
        throw new Error(data.error || 'Search grounding request failed');
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
      if (data.warning) {
        setWarningMessage(data.warning);
      }
    } catch (err: any) {
      const msg = err.message || 'Error occurred';
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) {
        setIsQuotaError(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                तथ्य पडताळणी (Search Grounding & Fact-Check)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                हस्तलिखित नोट्समधील संकल्पना आणि ऐतिहासिक तथ्यांची Google Search द्वारे पडताळणी करा.
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

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              शोध संज्ञा किंवा पडताळायचा प्रश्न (Query / Term):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="उदा. सत्यशोधक समाजाची स्थापना कोणी केली?"
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'शोधत आहे...' : 'पडताळा'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              हस्तलिखित संदर्भ (Context from Notes - Optional):
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="उदा. इयत्ता १२ वी इतिहास प्रकरण १"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {warningMessage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">टीप (Notice):</strong>
                <span>{warningMessage}</span>
              </div>
            </div>
          )}

          {error && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                isQuotaError
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isQuotaError ? 'text-amber-600' : 'text-red-600'
                }`}
              />
              <div className="flex-1">
                {isQuotaError ? (
                  <div>
                    <strong className="block font-bold text-amber-950 dark:text-amber-100 mb-1">
                      Gemini API कोटा संपला आहे (429 RESOURCE_EXHAUSTED)
                    </strong>
                    <p className="text-[11px] leading-relaxed mb-2">
                      सध्याच्या मोफत API Key ची दर-मर्यादा (Rate limit / Quota) पूर्ण झाली आहे. अखंड आणि जलद शोधासाठी, कृपया <strong>Settings &gt; Secrets</strong> पॅनेलमधून बिलिंग-सक्षम (Billing-enabled) API Key निवडा.
                    </p>
                    <span className="inline-block text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200">
                      टीप: पूर्व-नोंदवलेले ऐतिहासिक व वैज्ञानिक शब्द (उदा. सत्यशोधक समाज, संयुक्त महाराष्ट्र, Newton's Laws) स्थानिक संदर्भासह उपलब्ध आहेत.
                    </span>
                  </div>
                ) : (
                  <span>{error}</span>
                )}
              </div>
            </div>
          )}

          {answer && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>पडताळलेले उत्तर (Grounding Verification Result):</span>
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </p>
              </div>

              {sources.length > 0 && (
                <div>
                  <h5 className="font-semibold text-xs text-slate-600 dark:text-slate-400 mb-2">
                    संदर्भ स्रोत (Verified Web Sources):
                  </h5>
                  <div className="space-y-1.5">
                    {sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-50 transition"
                      >
                        <span className="truncate pr-2">{s.title || s.uri}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
