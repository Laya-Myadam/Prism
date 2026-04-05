import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import {
  Upload, FolderOpen, Loader2, AlertCircle,
  CheckCircle, ChevronRight, FileText, X
} from "lucide-react";
import { uploadAndClassify, buildProject } from "../../api/client";
import type { ClassifiedDoc } from "../../api/client";
interface Props { appState: AppState; }

const DOC_TYPES = [
  "Contract", "Drawings", "Specifications", "Daily Reports",
  "RFIs", "Change Orders", "Submittals", "Inspection Reports",
  "Meeting Minutes", "Schedule", "General"
];

const TYPE_COLORS: Record<string, string> = {
  Contract: "bg-purple-50 text-purple-700 border-purple-200",
  Drawings: "bg-blue-50 text-blue-700 border-blue-200",
  Specifications: "bg-amber-50 text-amber-700 border-amber-200",
  "Daily Reports": "bg-green-50 text-green-700 border-green-200",
  RFIs: "bg-red-50 text-red-700 border-red-200",
  "Change Orders": "bg-orange-50 text-orange-700 border-orange-200",
  Submittals: "bg-teal-50 text-teal-700 border-teal-200",
  "Inspection Reports": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Meeting Minutes": "bg-pink-50 text-pink-700 border-pink-200",
  Schedule: "bg-cyan-50 text-cyan-700 border-cyan-200",
  General: "bg-gray-50 text-gray-600 border-gray-200",
};

const TYPE_ICONS: Record<string, string> = {
  Contract: "📜", Drawings: "📐", Specifications: "📋",
  "Daily Reports": "📅", RFIs: "❓", "Change Orders": "🔄",
  Submittals: "📦", "Inspection Reports": "🔍",
  "Meeting Minutes": "🗒️", Schedule: "🗓️", General: "📄",
};

export default function Setup({ appState }: Props) {
  const { sessionId, setProjectBuilt, setProjectName } = appState;
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [classified, setClassified] = useState<ClassifiedDoc[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleFiles = async (newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.type === "application/pdf");
    if (!pdfs.length) { setError("Please upload PDF files only."); return; }
    setError(null);
    setFiles(pdfs);
    setStep(2);
    setClassifying(true);
    try {
      const res = await uploadAndClassify(sessionId, pdfs);
      setClassified(res.classified);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Classification failed.");
      setStep(1);
    } finally {
      setClassifying(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const updateDocType = (index: number, newType: string) => {
    setClassified(prev => prev.map((doc, i) =>
      i === index ? { ...doc, doc_type: newType, icon: TYPE_ICONS[newType] || "📄" } : doc
    ));
  };

  const removeDoc = (index: number) => {
    setClassified(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuild = async () => {
    if (!classified.length) { setError("No documents to build with."); return; }
    setError(null);
    setBuilding(true);
    setStep(3);
    try {
      const res = await buildProject(sessionId, classified);
      const projectName = res.dashboard?.facts?.project_name || "Your Project";
      setProjectName(projectName);
      setProjectBuilt(true);
      navigate("/construction/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Build failed.");
      setStep(2);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Setup</h1>
          <p className="page-sub">Upload all your project documents. AI will classify and index them automatically.</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: "Upload" },
          { n: 2, label: "Classify" },
          { n: 3, label: "Build" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
              ${step === s.n ? "bg-prism-700 text-white" :
                step > s.n ? "bg-prism-50 text-prism-700 border border-prism-200" :
                "bg-surface-tertiary text-ink-tertiary border border-border"}`}>
              {step > s.n
                ? <CheckCircle size={12} />
                : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">{s.n}</span>
              }
              {s.label}
            </div>
            {i < 2 && <ChevronRight size={14} className="text-ink-tertiary flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Upload */}
      {step === 1 && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Upload Project Documents</div>
              <div className="text-xs text-ink-secondary mt-0.5">
                Upload contracts, drawings, specs, RFIs, daily reports — all at once
              </div>
            </div>
          </div>
          <div className="card-body">
            <div
              className={`dropzone ${dragOver ? "dropzone-active" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-prism-50 border border-prism-200
                                flex items-center justify-center">
                  <FolderOpen size={24} className="text-prism-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Drop all project PDFs here</p>
                  <p className="text-xs text-ink-tertiary mt-1">
                    Multiple files supported · Any construction document type
                  </p>
                </div>
                <button className="btn text-xs px-4 py-2">Browse Files</button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
            </div>

            {error && (
              <div className="alert-error mt-4">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Classify */}
      {step === 2 && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Document Classification</div>
              <div className="text-xs text-ink-secondary mt-0.5">
                AI has identified each document type. Correct any wrong classifications.
              </div>
            </div>
            {!classifying && (
              <button onClick={() => { setStep(1); setClassified([]); setFiles([]); }} className="btn text-xs">
                Re-upload
              </button>
            )}
          </div>

          {classifying ? (
            <div className="card-body flex flex-col items-center gap-4 py-10">
              <Loader2 size={28} className="animate-spin text-prism-500" />
              <div className="text-sm text-ink-secondary">Classifying {files.length} document{files.length > 1 ? "s" : ""}...</div>
              <div className="text-xs text-ink-tertiary">AI is reading each document to identify its type</div>
            </div>
          ) : (
            <div className="card-body">
              <div className="flex flex-col gap-2 mb-5">
                {classified.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface-secondary
                                          rounded-lg border border-border">
                    <span className="text-lg flex-shrink-0">{doc.icon || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{doc.filename}</div>
                      <div className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full
                                      text-xs font-medium border
                                      ${TYPE_COLORS[doc.doc_type] || TYPE_COLORS.General}`}>
                        {doc.doc_type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.confidence === "high"
                        ? <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle size={11} /> High
                          </span>
                        : <span className="text-xs text-amber-600 font-medium">⚠ Low</span>
                      }
                      <select
                        value={doc.doc_type}
                        onChange={(e) => updateDocType(i, e.target.value)}
                        className="select text-xs w-36 py-1"
                      >
                        {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button
                        onClick={() => removeDoc(i)}
                        className="p-1 rounded hover:bg-red-50 text-ink-tertiary hover:text-red-500 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="alert-error mb-4">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-xs text-ink-secondary">
                  {classified.length} document{classified.length !== 1 ? "s" : ""} ready to index
                </div>
                <button
                  onClick={handleBuild}
                  disabled={!classified.length}
                  className="btn-primary px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FolderOpen size={15} />
                  Build Project
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Building */}
      {step === 3 && (
        <div className="card animate-fade-in">
          <div className="card-body flex flex-col items-center gap-5 py-14">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-prism-50 border border-prism-200
                              flex items-center justify-center">
                <FolderOpen size={28} className="text-prism-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white
                              border border-border flex items-center justify-center">
                <Loader2 size={13} className="animate-spin text-prism-600" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-ink mb-1">Building your project...</div>
              <div className="text-xs text-ink-secondary">
                Indexing {classified.length} documents and extracting project intelligence
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[
                "Embedding documents into vector store",
                "Extracting project facts from contract",
                "Detecting schedule health",
                "Scanning for risk flags",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Loader2 size={11} className="animate-spin text-prism-400 flex-shrink-0" />
                  <span className="text-xs text-ink-secondary">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}