import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FilePlus2,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileImage,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { NotePage, Project } from '../types';

interface BulkDropZoneProps {
  project: Project;
  onAddMultiplePages: (
    pagesData: Array<Omit<NotePage, 'id' | 'createdAt' | 'updatedAt'>>
  ) => void;
  onSelectPage?: (pageId: string) => void;
}

export const BulkDropZone: React.FC<BulkDropZoneProps> = ({
  project,
  onAddMultiplePages,
  onSelectPage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number; currentFileName?: string } | null>(null);
  const [importSummary, setImportSummary] = useState<{ count: number; timestamp: number } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  // Auto-clear success toast after 6 seconds
  useEffect(() => {
    if (importSummary) {
      const timer = setTimeout(() => setImportSummary(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [importSummary]);

  // Clean filename into human-readable title
  const sanitizeTitle = (fileName: string, pageNumber: number): string => {
    const rawName = fileName.replace(/\.[^/.]+$/, '');
    const cleaned = rawName
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If cleaned is purely numbers, prefix with 'पृष्ठ' / 'Page'
    if (/^\d+$/.test(cleaned)) {
      return `पृष्ठ ${cleaned}`;
    }
    return cleaned || `पृष्ठ ${pageNumber}`;
  };

  // Natural alphabetical/numerical sort
  const sortFilesNaturally = (files: File[]): File[] => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return [...files].sort((a, b) => collator.compare(a.name, b.name));
  };

  const processImageFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|bmp|tiff)$/i.test(file.name)
    );

    if (fileArray.length === 0) {
      alert('कृपया वैध प्रतिमा फाइल्स निवडा (PNG, JPG, WEBP, किंवा SVG).');
      return;
    }

    const sortedFiles = sortFilesNaturally(fileArray);
    setIsProcessing(true);
    setProgressInfo({ current: 0, total: sortedFiles.length, currentFileName: sortedFiles[0].name });

    const newPagesData: Array<Omit<NotePage, 'id' | 'createdAt' | 'updatedAt'>> = [];
    const basePageNumber = project.pages.length;

    try {
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        setProgressInfo({ current: i + 1, total: sortedFiles.length, currentFileName: file.name });

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsDataURL(file);
        });

        const targetPageNumber = basePageNumber + i + 1;
        const pageTitle = sanitizeTitle(file.name, targetPageNumber);

        newPagesData.push({
          pageNumber: targetPageNumber,
          title: pageTitle,
          imageBase64: base64Data,
          imageFileName: file.name,
          text: '',
          status: 'draft',
          illegibleCount: 0,
          charCount: 0,
          wordCount: 0,
          chapterId: project.chapters[0]?.id,
        });
      }

      onAddMultiplePages(newPagesData);
      setImportSummary({ count: newPagesData.length, timestamp: Date.now() });
    } catch (err: any) {
      console.error('Error during bulk image import:', err);
      alert(`प्रतिमा आयात करताना त्रुटी आली: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgressInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag-and-drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
      setIsCollapsed(false); // Auto-expand when dragged over
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragOver(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Hidden File Input for Multiple Selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processImageFiles(e.target.files);
          }
        }}
      />

      {/* Bulk Import Progress Bar */}
      {isProcessing && progressInfo && (
        <div className="bg-blue-600 text-white px-6 py-2.5 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span className="text-xs font-semibold">
              हस्तलिखित पृष्ठे आयात होत आहेत... ({progressInfo.current} / {progressInfo.total})
            </span>
            <span className="text-[11px] opacity-80 hidden md:inline truncate max-w-xs font-mono">
              {progressInfo.currentFileName}
            </span>
          </div>

          <div className="w-32 bg-blue-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-150"
              style={{
                width: `${Math.round((progressInfo.current / progressInfo.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Success Notification Bar */}
      {importSummary && !isProcessing && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>{importSummary.count} हस्तलिखित पृष्ठे</strong> यशस्वीरित्या प्रकल्पात जोडली गेली (स्वतंत्र NotePage नोंदी तयार केल्या)!
            </span>
          </div>
          <button
            onClick={() => setImportSummary(null)}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Main Drag-and-Drop Area */}
      {isCollapsed ? (
        /* Collapsed Compact Strip */
        <div className="px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
              <span>हस्तलिखित नोट्स बल्क इम्पोर्ट (Bulk Drop Zone)</span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              · ड्रॅग आणि ड्रॉप किंवा फाइल्स निवडा
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>फाइल्स निवडा (Browse)</span>
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Expand Drop Zone"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Full Drop Zone */
        <div className="px-6 py-3">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer text-center group flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-lg scale-[1.005] ring-4 ring-blue-500/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 bg-white/50 dark:bg-slate-900/40 shadow-xs'
            }`}
          >
            {/* Collapse Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(true);
              }}
              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Collapse drop zone"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
                  isDragOver
                    ? 'bg-blue-600 text-white animate-bounce'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                }`}
              >
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                    {isDragOver
                      ? 'येथे हस्तलिखित नोट्स सोडा (Release to Bulk-Import Images)'
                      : 'हस्तलिखित नोट्सची अनेक पृष्ठे येथे ड्रॅग आणि ड्रॉप करा (Bulk Drag & Drop Scans)'}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    अनेक फाइल्स समर्थित
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  PNG, JPG, JPEG, WEBP, किंवा SVG फाइल्स ड्रॉप करा. प्रत्येक प्रतिमेसाठी स्वतंत्र <strong>NotePage</strong> आपोआप अनुक्रमाने तयार होईल.
                </p>
              </div>

              <div className="ml-auto hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>फाइल्स निवडा (Browse Images)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
