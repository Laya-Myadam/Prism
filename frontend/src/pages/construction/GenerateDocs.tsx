import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import {
  FileText, Loader2, AlertCircle,
  Download, Trash2, CheckCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { generateDocument } from "../../api/client";
import type { GeneratedDoc } from "../../api/client";
interface Props { appState: AppState; }

const DOC_TYPES = [
  {
    id: "RFI Response",
    icon: "❓",
    title: "RFI Response",
    desc: "Generate a formal response to a Request for Information with document citations",
    color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    selectedColor: "border-blue-400 bg-blue-50",
  },
  {
    id: "Delay Notice Letter",
    icon: "⏱️",
    title: "Delay Notice Letter",
    desc: "Draft a formal delay notice with contract clause references",
    color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
    selectedColor: "border-amber-400 bg-amber-50",
  },
  {
    id: "Change Order Assessment",
    icon: "🔄",
    title: "Change Order Assessment",
    desc: "Assess if a change order is in scope, cost is reasonable, days are justified",
    color: "border-orange-200 hover:border-orange-400 hover:bg-orange-50",
    selectedColor: "border-orange-400 bg-orange-50",
  },
  {
    id: "Weekly Progress Summary",
    icon: "📅",
    title: "Weekly Progress Summary",
    desc: "Generate a structured weekly report from your daily reports",
    color: "border-green-200 hover:border-green-400 hover:bg-green-50",
    selectedColor: "border-green-400 bg-green-50",
  },
];

export default function GenerateDocs({ appState }: Props) {
  const { sessionId, projectBuilt } = appState;
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const updateForm = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleGenerate = async () => {
    if (!selectedType) { setError("Select a document type first."); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await generateDocument(sessionId, selectedType, formData);
      const newDoc: GeneratedDoc = { type: res.type, content: res.document, form_data: formData };
      setGeneratedDocs(prev => [newDoc, ...prev]);
      setExpanded(prev => ({ 0: true, ...Object.fromEntries(Object.keys(prev).map(k => [parseInt(k) + 1, prev[parseInt(k)]])) }));
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadDoc = (doc: GeneratedDoc, index: number) => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.type.replace(/ /g, "_").toLowerCase()}_${index + 1}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!projectBuilt) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Generate Documents</h1>
            <p className="page-sub">AI generates complete formatted construction documents ready to send.</p>
          </div>
        </div>
        <div className="empty-state mt-16">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No project built yet</div>
          <div className="empty-state-sub">Build your project first to generate documents</div>
          <button onClick={() => navigate("/construction/setup")} className="btn-primary mt-4 text-xs px-4 py-2">
            Go to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Documents</h1>
          <p className="page-sub">Select a document type, fill in the details, get a complete formatted document.</p>
        </div>
      </div>

      {/* Document type selector */}
      <div className="card mb-5">
        <div className="card-header">
          <div className="card-title">Select Document Type</div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-3">
            {DOC_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setFormData({}); setError(null); }}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-150
                  ${selectedType === type.id ? type.selectedColor : `border-border bg-white ${type.color}`}`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="text-sm font-semibold text-ink mb-1">{type.title}</div>
                <div className="text-xs text-ink-secondary leading-relaxed">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic form */}
      {selectedType && (
        <div className="card mb-5 animate-fade-in">
          <div className="card-header">
            <div className="card-title">{selectedType} — Details</div>
          </div>
          <div className="card-body flex flex-col gap-4">

            {/* RFI Response */}
            {selectedType === "RFI Response" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">RFI Number</label>
                    <input className="input" placeholder="e.g. RFI-001" value={formData.rfi_number || ""} onChange={e => updateForm("rfi_number", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Submitted By</label>
                    <input className="input" placeholder="e.g. ABC Contractors" value={formData.submitted_by || ""} onChange={e => updateForm("submitted_by", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Drawing Reference</label>
                    <input className="input" placeholder="e.g. S-101" value={formData.drawing_ref || ""} onChange={e => updateForm("drawing_ref", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Spec Section</label>
                    <input className="input" placeholder="e.g. 03 30 00" value={formData.spec_ref || ""} onChange={e => updateForm("spec_ref", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input className="input" placeholder="e.g. Concrete compressive strength at foundation" value={formData.subject || ""} onChange={e => updateForm("subject", e.target.value)} />
                </div>
                <div>
                  <label className="label">Question *</label>
                  <textarea className="textarea" rows={3} placeholder="State the full RFI question..." value={formData.question || ""} onChange={e => updateForm("question", e.target.value)} />
                </div>
              </>
            )}

            {/* Delay Notice */}
            {selectedType === "Delay Notice Letter" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Delay Event *</label>
                    <input className="input" placeholder="e.g. Owner-directed scope change" value={formData.delay_event || ""} onChange={e => updateForm("delay_event", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Date Delay Began *</label>
                    <input className="input" placeholder="e.g. March 15, 2025" value={formData.delay_date || ""} onChange={e => updateForm("delay_date", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Cause of Delay *</label>
                    <select className="select" value={formData.delay_cause || ""} onChange={e => updateForm("delay_cause", e.target.value)}>
                      <option value="">Select cause...</option>
                      {["Owner-caused", "Force Majeure", "Differing Site Condition", "Weather", "Design Error", "Other"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Days Claimed</label>
                    <input className="input" placeholder="e.g. 14 days" value={formData.days_claimed || ""} onChange={e => updateForm("days_claimed", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Impact Description *</label>
                  <textarea className="textarea" rows={3} placeholder="Describe how this delay impacts the schedule, critical path, and cost..." value={formData.delay_impact || ""} onChange={e => updateForm("delay_impact", e.target.value)} />
                </div>
              </>
            )}

            {/* Change Order Assessment */}
            {selectedType === "Change Order Assessment" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">CO Number</label>
                    <input className="input" placeholder="e.g. CO-001" value={formData.co_number || ""} onChange={e => updateForm("co_number", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Claimed Cost *</label>
                    <input className="input" placeholder="e.g. $34,500" value={formData.claimed_cost || ""} onChange={e => updateForm("claimed_cost", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Claimed Days</label>
                    <input className="input" placeholder="e.g. 5 days" value={formData.claimed_days || ""} onChange={e => updateForm("claimed_days", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Reason Given *</label>
                    <input className="input" placeholder="e.g. Owner-directed addition" value={formData.co_reason || ""} onChange={e => updateForm("co_reason", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Description of Work *</label>
                  <textarea className="textarea" rows={3} placeholder="Describe exactly what work is being claimed..." value={formData.co_description || ""} onChange={e => updateForm("co_description", e.target.value)} />
                </div>
              </>
            )}

            {/* Weekly Summary */}
            {selectedType === "Weekly Progress Summary" && (
              <div>
                <label className="label">Week Ending Date</label>
                <input className="input" type="date" value={formData.week_ending || new Date().toISOString().split("T")[0]} onChange={e => updateForm("week_ending", e.target.value)} />
                <div className="alert-info mt-4">
                  <FileText size={14} className="flex-shrink-0 mt-0.5" />
                  <span>AI will automatically pull work completed, open items, safety incidents, and weather from your uploaded daily reports.</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert-error">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <><Loader2 size={15} className="animate-spin" /> Generating {selectedType}...</>
              ) : (
                <><FileText size={15} /> Generate {selectedType}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Generated documents */}
      {generatedDocs.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">Generated Documents</div>
            <button onClick={() => setGeneratedDocs([])} className="btn-ghost text-xs gap-1.5">
              <Trash2 size={12} />
              Clear all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {generatedDocs.map((doc, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5
                             hover:bg-surface-secondary transition-colors duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-sm font-semibold text-ink">{doc.type}</span>
                    <span className="badge-green text-xs">Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadDoc(doc, i); }}
                      className="btn text-xs gap-1.5 py-1 px-3"
                    >
                      <Download size={12} />
                      Download
                    </button>
                    {expanded[i] ? <ChevronUp size={14} className="text-ink-tertiary" /> : <ChevronDown size={14} className="text-ink-tertiary" />}
                  </div>
                </button>
                {expanded[i] && (
                  <div className="border-t border-border animate-fade-in">
                    <textarea
                      readOnly
                      value={doc.content}
                      rows={16}
                      className="w-full px-5 py-4 text-xs font-mono text-ink bg-surface-secondary
                                 resize-none border-0 focus:outline-none leading-relaxed"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}