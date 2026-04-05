import { useState, useRef } from "react";
import type { AppState } from "../../App";
import {
  Upload, FileText, Sparkles, ChevronDown,
  ChevronUp, AlertCircle, Loader2
} from "lucide-react";
import { uploadDocument, uploadDocumentB, extractInsights } from "../../api/client";
import type { UploadResult, InsightsResult } from "../../api/client";
interface Props { appState: AppState; }

const DOMAINS = ["Auto Detect", "Financial", "Construction", "Real Estate", "Investment", "Legal", "General"];

export default function KeyInsights({ appState }: Props) {
  const { sessionId, uploadedFile, setUploadedFile, domain, setDomain } = appState;

  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError(null);
    setUploading(true);
    setInsights({});
    try {
      const result = await uploadDocument(sessionId, file, domain);
      setUploadedFile(result.filename);
      setDomain(result.domain);
      setUploadResult(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleExtract = async () => {
    setError(null);
    setExtracting(true);
    try {
      const result: InsightsResult = await extractInsights(sessionId, domain);
      setInsights(result.insights);
      const exp: Record<string, boolean> = {};
      Object.keys(result.insights).forEach((k) => (exp[k] = true));
      setExpanded(exp);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Key Insights</h1>
          <p className="page-sub">Upload a PDF and AI will extract what matters — in plain English.</p>
        </div>
        {uploadedFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-prism-50 border border-prism-200 rounded-lg">
            <FileText size={13} className="text-prism-600" />
            <span className="text-xs font-medium text-prism-700 max-w-40 truncate">{uploadedFile}</span>
          </div>
        )}
      </div>

      {/* Upload area */}
      <div className="card mb-5">
        <div className="card-header">
          <div>
            <div className="card-title">Upload Document</div>
            <div className="text-xs text-ink-secondary mt-0.5">PDF files only · Max 100MB</div>
          </div>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="select w-40 text-xs"
          >
            {DOMAINS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="card-body">
          <div
            className={`dropzone ${dragOver ? "dropzone-active" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="text-prism-500 animate-spin" />
                <p className="text-sm text-ink-secondary">Indexing document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-prism-50 border border-prism-200 flex items-center justify-center">
                  <Upload size={20} className="text-prism-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Drop your PDF here</p>
                  <p className="text-xs text-ink-tertiary mt-1">or click to browse</p>
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Upload result */}
          {uploadResult && !uploading && (
            <div className="alert-success mt-4">
              <FileText size={15} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{uploadResult.filename}</div>
                <div className="text-xs mt-0.5 opacity-80">
                  {uploadResult.text_chunks} chunks · {uploadResult.image_count} images · Domain: {uploadResult.domain}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert-error mt-4">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Extract button */}
      {uploadedFile && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {extracting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Extracting insights...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Extract Key Insights
              </>
            )}
          </button>
        </div>
      )}

      {/* Insights */}
      {Object.keys(insights).length > 0 && (
        <div className="flex flex-col gap-3 animate-slide-up">
          <div className="section-label">Extracted Insights — {domain}</div>
          {Object.entries(insights).map(([section, content]) => (
            <div key={section} className="card overflow-hidden">
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between px-5 py-3.5
                           hover:bg-surface-secondary transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-prism-500" />
                  <span className="text-sm font-semibold text-ink">{section}</span>
                </div>
                {expanded[section]
                  ? <ChevronUp size={15} className="text-ink-tertiary" />
                  : <ChevronDown size={15} className="text-ink-tertiary" />
                }
              </button>
              {expanded[section] && (
                <div className="px-5 pb-4 pt-1 border-t border-border animate-fade-in">
                  <p className="text-sm text-ink leading-relaxed">{content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!uploadedFile && !uploading && (
        <div className="empty-state mt-8">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No document uploaded yet</div>
          <div className="empty-state-sub">Upload a PDF above to get started</div>
        </div>
      )}

    </div>
  );
}