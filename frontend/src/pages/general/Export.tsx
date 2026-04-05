import { useState } from "react";
import type { AppState } from "../../App";
import {
  Download, FileText, MessageSquare,
  Lightbulb, Loader2, CheckCircle, AlertCircle
} from "lucide-react";
import { exportReport } from "../../api/client";

interface Props { appState: AppState; }

export default function Export({ appState }: Props) {
  const { sessionId, uploadedFile, domain } = appState;
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setDone(false);
    setExporting(true);
    try {
      const blob = await exportReport(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prism_report_${uploadedFile?.replace(".pdf", "") ?? "document"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Export failed. Extract insights or ask questions first.");
    } finally {
      setExporting(false);
    }
  };

  if (!uploadedFile) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Export Report</h1>
            <p className="page-sub">Download a PDF report of all insights and Q&A from this session.</p>
          </div>
        </div>
        <div className="empty-state mt-16">
          <div className="empty-state-icon">📥</div>
          <div className="empty-state-title">No document uploaded yet</div>
          <div className="empty-state-sub">Upload a PDF and extract insights first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Export Report</h1>
          <p className="page-sub">Download a professionally formatted PDF report of your session.</p>
        </div>
      </div>

      {/* Report preview card */}
      <div className="card mb-5">
        <div className="card-header">
          <div className="card-title">Report Contents</div>
          <div className="badge-green">Ready to export</div>
        </div>
        <div className="card-body flex flex-col gap-4">

          {/* Document info */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-border">
            <div className="w-10 h-10 rounded-lg bg-prism-50 border border-prism-200
                            flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-prism-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">{uploadedFile}</div>
              <div className="text-xs text-ink-secondary mt-0.5">Domain: {domain}</div>
            </div>
          </div>

          {/* What's included */}
          <div>
            <div className="section-label">What's included</div>
            <div className="flex flex-col gap-2.5">
              {[
                {
                  icon: <Lightbulb size={14} className="text-amber-500" />,
                  title: "Key Insights",
                  desc: "All AI-extracted sections and their plain English explanations",
                },
                {
                  icon: <MessageSquare size={14} className="text-blue-500" />,
                  title: "Q&A History",
                  desc: "Every question asked and answer given during this session",
                },
                {
                  icon: <FileText size={14} className="text-prism-500" />,
                  title: "Document Metadata",
                  desc: "Filename, domain, date of analysis, and session details",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white">
                  <div className="w-7 h-7 rounded-md bg-surface-secondary border border-border
                                  flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink">{item.title}</div>
                    <div className="text-xs text-ink-secondary mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error mb-4">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {done && (
        <div className="alert-success mb-4">
          <CheckCircle size={15} className="flex-shrink-0" />
          <span>Report downloaded successfully.</span>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="btn-primary w-full py-3 justify-center text-sm
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Generating report...
          </>
        ) : (
          <>
            <Download size={15} />
            Download PDF Report
          </>
        )}
      </button>

      <p className="text-xs text-ink-tertiary text-center mt-3">
        Report is generated using ReportLab and includes all session data.
      </p>
    </div>
  );
}