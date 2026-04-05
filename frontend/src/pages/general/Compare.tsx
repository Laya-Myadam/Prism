import { useState, useRef } from "react";
import type { AppState } from "../../App";
import {
  Upload, GitCompare, FileText,
  Loader2, AlertCircle, ArrowRight
} from "lucide-react";
import { uploadDocumentB, compareDocuments } from "../../api/client";
import type { CompareResult } from "../../api/client";
interface Props { appState: AppState; }

const COMPARE_TOPICS = [
  "Payment terms and conditions",
  "Termination clauses",
  "Penalties and liquidated damages",
  "Scope of work",
  "Insurance requirements",
  "Dispute resolution",
];

export default function Compare({ appState }: Props) {
  const { sessionId, uploadedFile, uploadedFileB, setUploadedFileB } = appState;

  const [uploadingB, setUploadingB] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileB = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError(null);
    setUploadingB(true);
    setResult(null);
    try {
      await uploadDocumentB(sessionId, file);
      setUploadedFileB(file.name);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploadingB(false);
    }
  };

  const handleCompare = async () => {
    if (!topic.trim()) { setError("Please enter a topic to compare."); return; }
    setError(null);
    setComparing(true);
    try {
      const res = await compareDocuments(sessionId, topic);
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Comparison failed.");
    } finally {
      setComparing(false);
    }
  };

  if (!uploadedFile) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Compare Documents</h1>
            <p className="page-sub">Compare two PDFs side by side on any topic.</p>
          </div>
        </div>
        <div className="empty-state mt-16">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No primary document uploaded</div>
          <div className="empty-state-sub">Upload a PDF in Key Insights first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Compare Documents</h1>
          <p className="page-sub">Upload a second PDF and compare both on any topic side by side.</p>
        </div>
      </div>

      {/* Document slots */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Doc A — already uploaded */}
        <div className="card p-4">
          <div className="section-label">Document A</div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-9 h-9 rounded-lg bg-prism-50 border border-prism-200
                            flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-prism-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-ink truncate max-w-48">{uploadedFile}</div>
              <div className="text-xs text-green-600 font-medium mt-0.5">✓ Indexed</div>
            </div>
          </div>
        </div>

        {/* Doc B — upload */}
        <div className="card p-4">
          <div className="section-label">Document B</div>
          {uploadedFileB ? (
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200
                              flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink truncate max-w-48">{uploadedFileB}</div>
                <div className="text-xs text-green-600 font-medium mt-0.5">✓ Indexed</div>
              </div>
              <button
                onClick={() => { setUploadedFileB(null); setResult(null); }}
                className="ml-auto btn-ghost text-xs"
              >
                Change
              </button>
            </div>
          ) : (
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                          transition-all duration-150 ${dragOver ? "border-blue-400 bg-blue-50" : "border-border hover:border-blue-300 hover:bg-blue-50"}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileB(f); }}
            >
              {uploadingB ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-xs text-ink-secondary">Indexing...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload size={16} className="text-ink-tertiary" />
                  <span className="text-xs text-ink-secondary">Drop PDF or click</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileB(e.target.files[0])} />
            </div>
          )}
        </div>
      </div>

      {/* Topic input */}
      {uploadedFileB && (
        <div className="card mb-5 animate-fade-in">
          <div className="card-header">
            <div className="card-title">What do you want to compare?</div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {COMPARE_TOPICS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(t)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-all duration-150 ${
                    topic === t
                      ? "border-prism-400 bg-prism-50 text-prism-700 font-medium"
                      : "border-border text-ink-secondary hover:border-prism-300 hover:bg-prism-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Or type a custom topic..."
                className="input flex-1"
              />
              <button
                onClick={handleCompare}
                disabled={comparing || !topic.trim()}
                className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {comparing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <><GitCompare size={15} /> Compare</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error mb-4">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-slide-up">
          <div className="section-label mb-4">Comparison — {topic}</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-prism-500" />
                <span className="text-xs font-semibold text-ink truncate">{result.doc_a}</span>
              </div>
              <p className="text-sm text-ink leading-relaxed">{result.doc_a_summary}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-ink truncate">{result.doc_b}</span>
              </div>
              <p className="text-sm text-ink leading-relaxed">{result.doc_b_summary}</p>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <GitCompare size={14} className="text-ink-secondary" />
              <span className="text-sm font-semibold text-ink">AI Comparison Analysis</span>
            </div>
            <p className="text-sm text-ink leading-relaxed">{result.comparison}</p>
          </div>
        </div>
      )}
    </div>
  );
}