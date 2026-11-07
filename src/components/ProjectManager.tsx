import React, { useState } from 'react';
import { Project, IndicLanguage } from '../types';
import {
  FolderPlus,
  Lock,
  Download,
  Upload,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ShieldCheck,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onCreateProject: (
    title: string,
    author: string,
    language: IndicLanguage,
    subject?: string,
    category?: Project['category']
  ) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onExportVault: () => void;
  onImportVault: (file: File) => void;
  onResetVault: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onExportVault,
  onImportVault,
  onResetVault,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newLanguage, setNewLanguage] = useState<IndicLanguage>('Marathi');
  const [newCategory, setNewCategory] = useState<Project['category']>('study_notes');

  const [editTitle, setEditTitle] = useState(activeProject.title);
  const [editAuthor, setEditAuthor] = useState(activeProject.author);
  const [editSubject, setEditSubject] = useState(activeProject.subject || '');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle, newAuthor, newLanguage, newSubject, newCategory);
    setNewTitle('');
    setNewAuthor('');
    setNewSubject('');
    setShowNewModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    onUpdateProject(activeProject.id, {
      title: editTitle.trim(),
      author: editAuthor.trim(),
      subject: editSubject.trim(),
    });
    setShowEditModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Project Selector & Active Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={activeProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="appearance-none pl-3.5 pr-9 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-lg text-sm border border-slate-300 dark:border-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📂 {p.title} ({p.pages.length} पृष्ठे / {p.language})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              setEditTitle(activeProject.title);
              setEditAuthor(activeProject.author);
              setEditSubject(activeProject.subject || '');
              setShowEditModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Edit Project Details"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>नवीन प्रकल्प (New Project)</span>
          </button>
        </div>

        {/* Strict Privacy Badge & Vault Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>खाजगी वॉल्ट (100% User-Scoped Isolation)</span>
          </div>

          {/* Backup & Restore Controls */}
          <button
            onClick={onExportVault}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition"
            title="Export Entire User Vault as JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <label
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition"
            title="Restore Vault from Backup JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restore</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportVault(file);
              }}
            />
          </label>

          <button
            onClick={onResetVault}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset to Default Demo Projects"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              नवीन हस्तलिखित प्रकल्प तयार करा
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Create a new private handwritten notes project. All scans and transcriptions stay isolated in your private vault.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  प्रकल्प शीर्षक (Project Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. इयत्ता १२ वी रसायनशास्त्र सराव"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    लेखक / विद्यार्थी (Author)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. राहुल देशमुख"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    मुख्य भाषा (Language)
                  </label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value as IndicLanguage)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Marathi">मराठी (Marathi)</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="English">English</option>
                    <option value="Mixed">मिश्र (Hinglish/Maranglish)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  विषय / संक्षेप (Subject / Topic)
                </label>
                <input
                  type="text"
                  placeholder="उदा. सेंद्रिय रसायनशास्त्र व अभिक्रिया"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  प्रकल्प तयार करा (Create)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              प्रकल्प संपादन (Edit Project)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Update project details and publishing metadata.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  शीर्षक (Title)
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  लेखक (Author)
                </label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  विषय (Subject)
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`खात्री आहे का? '${activeProject.title}' हा प्रकल्प कायमचा हटवला जाईल.`)) {
                        onDeleteProject(activeProject.id);
                        setShowEditModal(false);
                      }
                    }}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटवा (Delete)</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    जतन करा (Save)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
