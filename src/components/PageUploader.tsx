import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Layers,
  Sparkles,
  FilePlus,
  X,
  Check,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { NotePage, Project } from '../types';

interface PageUploaderProps {
  project: Project;
  onAddPage: (pageData: Omit<NotePage, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const PageUploader: React.FC<PageUploaderProps> = ({ project, onAddPage }) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera' | 'sample'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Sample Dataset Pages
  const [datasetManifest, setDatasetManifest] = useState<any | null>(null);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');

  useEffect(() => {
    // Fetch manifest if modal opened
    if (showModal && !datasetManifest) {
      fetch('/api/benchmark/dataset')
        .then((res) => res.json())
        .then((data) => setDatasetManifest(data))
        .catch((err) => console.error('Failed to load dataset manifest:', err));
    }
  }, [showModal, datasetManifest]);

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access failed, falling back to simulator:', err);
      setCameraError('कॅमेरा ॲक्सेस उपलब्ध नाही. कृपया फाइल अपलोड किंवा सॅम्पल डेटासेट वापरा.');
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onAddPage({
        pageNumber: project.pages.length + 1,
        title: `कॅमेरा स्कॅन पृष्ठ ${project.pages.length + 1}`,
        imageBase64: dataUrl,
        imageFileName: `camera_scan_${Date.now()}.jpg`,
        text: '',
        status: 'draft',
        illegibleCount: 0,
        charCount: 0,
        wordCount: 0,
        chapterId: project.chapters[0]?.id,
      });
      handleStopCamera();
      setShowModal(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onAddPage({
          pageNumber: project.pages.length + 1 + idx,
          title: file.name.replace(/\.[^/.]+$/, ''),
          imageBase64: base64,
          imageFileName: file.name,
          text: '',
          status: 'draft',
          illegibleCount: 0,
          charCount: 0,
          wordCount: 0,
          chapterId: project.chapters[0]?.id,
        });
      };
      reader.readAsDataURL(file);
    });

    setShowModal(false);
  };

  const handleSelectSamplePage = (samplePage: any) => {
    // Fetch reference transcript if available
    fetch(`/api/benchmark/transcript/${samplePage.id}`)
      .then((res) => res.json())
      .then((data) => {
        onAddPage({
          pageNumber: project.pages.length + 1,
          title: `${samplePage.id}: ${samplePage.category || samplePage.domain}`,
          imageBase64: `/api/benchmark/image/${samplePage.id}`,
          imageFileName: samplePage.imageFile || `${samplePage.id}.svg`,
          text: data.transcript || '',
          status: data.transcript ? 'reviewed' : 'draft',
          illegibleCount: data.transcript ? (data.transcript.match(/\[illegible\]/g) || []).length : 0,
          charCount: data.transcript ? data.transcript.length : 0,
          wordCount: data.transcript ? data.transcript.split(/\s+/).filter(Boolean).length : 0,
          chapterId: project.chapters[0]?.id,
        });
      })
      .catch(() => {
        onAddPage({
          pageNumber: project.pages.length + 1,
          title: `${samplePage.id}: ${samplePage.category || samplePage.domain}`,
          imageBase64: `/api/benchmark/image/${samplePage.id}`,
          imageFileName: samplePage.imageFile || `${samplePage.id}.svg`,
          text: '',
          status: 'draft',
          illegibleCount: 0,
          charCount: 0,
          wordCount: 0,
          chapterId: project.chapters[0]?.id,
        });
      });

    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
      >
        <FilePlus className="w-4 h-4" />
        <span>पृष्ठ जोडा (Add Page)</span>
      </button>

      {/* Ingestion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    हस्तलिखित पृष्ठे समाविष्ट करा (Add Note Pages)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload handwritten notes, capture with camera, or load verified benchmark samples.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleStopCamera();
                  setShowModal(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pt-3 mb-4">
              <button
                onClick={() => {
                  handleStopCamera();
                  setActiveMode('upload');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  activeMode === 'upload'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>फाइल अपलोड (File Upload)</span>
              </button>

              <button
                onClick={() => {
                  setActiveMode('camera');
                  handleStartCamera();
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  activeMode === 'camera'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>कॅमेरा स्कॅन (Camera Scan)</span>
              </button>

              <button
                onClick={() => {
                  handleStopCamera();
                  setActiveMode('sample');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  activeMode === 'sample'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>सॅम्पल डेटासेट (30 Benchmark Pages)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 pr-1">
              {activeMode === 'upload' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center min-h-[240px] ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
                    हस्तलिखित नोट्सच्या प्रतिमा येथे ड्रॅग आणि ड्रॉप करा
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                    PNG, JPG, WEBP, किंवा SVG फाइल्स स्वीकारल्या जातात. एकाच वेळी अनेक पृष्ठे निवडता येतात.
                  </p>

                  <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition">
                    संगणकावरून निवडा (Browse Files)
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </label>
                </div>
              )}

              {activeMode === 'camera' && (
                <div className="flex flex-col items-center">
                  {cameraError ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 mb-4 w-full">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-md bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center mb-4 shadow-inner">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-4 border border-white/40 border-dashed rounded-lg pointer-events-none flex items-center justify-center">
                        <span className="text-[11px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                          नोटबुक पृष्ठ फ्रेममध्ये ठेवा
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      disabled={!cameraActive}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>फोटो काढा (Capture Page)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>कॅमेरा रीलोड</span>
                    </button>
                  </div>
                </div>
              )}

              {activeMode === 'sample' && (
                <div>
                  {/* Language Filters */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-500 font-medium">भाषा फिल्टर:</span>
                    {['All', 'Marathi', 'Hindi', 'English', 'Mixed'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguageFilter(lang)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                          selectedLanguageFilter === lang
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  {/* Grid of benchmark pages */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {datasetManifest?.pages
                      ?.filter(
                        (p: any) =>
                          selectedLanguageFilter === 'All' ||
                          p.language?.toLowerCase().includes(selectedLanguageFilter.toLowerCase())
                      )
                      ?.map((sample: any) => (
                        <div
                          key={sample.id}
                          onClick={() => handleSelectSamplePage(sample)}
                          className="group border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-2.5 bg-white dark:bg-slate-800/80 cursor-pointer transition shadow-sm hover:shadow-md flex flex-col"
                        >
                          <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden mb-2 relative flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <img
                              src={`/api/benchmark/image/${sample.id}`}
                              alt={sample.id}
                              className="w-full h-full object-contain p-1 group-hover:scale-105 transition"
                            />
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {sample.id}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {sample.category || sample.domain || sample.id}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {sample.language} · {sample.script}
                              </div>
                            </div>
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 group-hover:underline">
                              + प्रकल्पात जोडा (Add)
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
