import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  FileText,
  MoveUp,
  MoveDown,
  Layers,
  Sparkles,
  BookMarked,
  Check,
} from 'lucide-react';
import { Chapter, NotePage, Project } from '../types';

interface ChapterOrganizerProps {
  project: Project;
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddChapter: (title: string, synopsis?: string) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  onDeleteChapter: (chapterId: string) => void;
  onAssignPageToChapter: (pageId: string, chapterId: string) => void;
}

export const ChapterOrganizer: React.FC<ChapterOrganizerProps> = ({
  project,
  activePageId,
  onSelectPage,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  onAssignPageToChapter,
}) => {
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddChapter(newTitle.trim(), newSynopsis.trim() || undefined);
    setNewTitle('');
    setNewSynopsis('');
    setShowNewChapter(false);
  };

  const handleEditSubmit = (chapterId: string) => {
    if (!editTitle.trim()) return;
    onUpdateChapter(chapterId, { title: editTitle.trim() });
    setEditingChapterId(null);
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
            प्रकरणे व रूपरेषा (Chapters & Outline)
          </span>
        </div>
        <button
          onClick={() => setShowNewChapter(!showNewChapter)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-600 dark:text-blue-400"
          title="Add New Chapter"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* New Chapter Inline Form */}
      {showNewChapter && (
        <form onSubmit={handleCreateSubmit} className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900 space-y-2">
          <input
            type="text"
            required
            placeholder="प्रकरण शीर्षक (उदा. प्रकरण ३: स्वातंत्र्य लढा)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
          <input
            type="text"
            placeholder="प्रस्तावना (पर्यायी)"
            value={newSynopsis}
            onChange={(e) => setNewSynopsis(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowNewChapter(false)}
              className="px-2 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
            >
              जोडा
            </button>
          </div>
        </form>
      )}

      {/* Chapters & Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {project.chapters.map((chap, cIdx) => {
          const chapterPages = project.pages.filter((p) => p.chapterId === chap.id);

          return (
            <div
              key={chap.id}
              className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40 overflow-hidden"
            >
              {/* Chapter Header */}
              <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-between group">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                    {cIdx + 1}
                  </span>
                  {editingChapterId === chap.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit(chap.id)}
                        className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-900 border rounded flex-1"
                      />
                      <button
                        onClick={() => handleEditSubmit(chap.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate cursor-pointer"
                      title={chap.title}
                    >
                      {chap.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      setEditingChapterId(chap.id);
                      setEditTitle(chap.title);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                    title="Rename Chapter"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {project.chapters.length > 1 && (
                    <button
                      onClick={() => onDeleteChapter(chap.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-950/50 rounded text-red-500"
                      title="Delete Chapter"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pages in Chapter */}
              <div className="p-1.5 space-y-1">
                {chapterPages.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-1.5 px-2 text-center italic">
                    या प्रकरणात अद्याप पृष्ठे नाहीत.
                  </div>
                ) : (
                  chapterPages.map((page) => {
                    const isActive = page.id === activePageId;
                    return (
                      <div
                        key={page.id}
                        onClick={() => onSelectPage(page.id)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition text-xs ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                          <span className="truncate">{page.title || `पृष्ठ ${page.pageNumber}`}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {page.illegibleCount > 0 && (
                            <span
                              className={`text-[9px] px-1 rounded font-bold ${
                                isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {page.illegibleCount} !
                            </span>
                          )}
                          <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                            {page.charCount || 0} अक्षरे
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Unassigned Pages (if any) */}
        {(() => {
          const unassigned = project.pages.filter(
            (p) => !p.chapterId || !project.chapters.some((c) => c.id === p.chapterId)
          );
          if (unassigned.length === 0) return null;

          return (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-2">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                वर्ग न केलेली पृष्ठे ({unassigned.length})
              </span>
              <div className="space-y-1">
                {unassigned.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => onSelectPage(page.id)}
                    className="p-1.5 rounded hover:bg-amber-100 text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{page.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (project.chapters[0]) {
                          onAssignPageToChapter(page.id, project.chapters[0].id);
                        }
                      }}
                      className="text-[10px] text-blue-600 underline"
                    >
                      प्रकरण १ ला जोडा
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer Metrics */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
        <div className="flex justify-between mb-1">
          <span>एकूण प्रकरणे:</span>
          <strong className="text-slate-700 dark:text-slate-300">{project.chapters.length}</strong>
        </div>
        <div className="flex justify-between mb-1">
          <span>एकूण पृष्ठे:</span>
          <strong className="text-slate-700 dark:text-slate-300">{project.pages.length}</strong>
        </div>
        <div className="flex justify-between">
          <span>एकूण मजकूर लांबी:</span>
          <strong className="text-slate-700 dark:text-slate-300">
            {project.pages.reduce((acc, p) => acc + (p.charCount || 0), 0)} अक्षरे
          </strong>
        </div>
      </div>
    </div>
  );
};
