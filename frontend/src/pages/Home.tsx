import { useNavigate } from "react-router-dom";
import type { AppState } from "../App";
import {
  FileText, HardHat, ArrowRight, Zap,
  Shield, Globe, CheckCircle
} from "lucide-react";

interface Props {
  appState: AppState;
}

const generalFeatures = [
  "Upload any PDF — financial, legal, real estate, general",
  "AI extracts key insights in plain English",
  "Ask questions with full conversation memory",
  "Compare two documents side by side",
  "Export a full PDF report",
  "Confidence scoring on every answer",
];

const constructionFeatures = [
  "Auto-classify drawings, specs, contracts, RFIs",
  "Live project dashboard with risk flags",
  "Ask questions across all project docs at once",
  "Generate RFI responses, delay notices, change order assessments",
  "Weekly progress summaries from daily reports",
  "Source citations on every answer",
];

const techStack = [
  { label: "LLaMA 3.1 70B", sub: "via Groq — under 1s responses", color: "bg-prism-500" },
  { label: "FAISS Vector Search", sub: "MMR retrieval, semantic search", color: "bg-blue-500" },
  { label: "BLIP Vision AI", sub: "Understands charts & diagrams", color: "bg-amber-500" },
  { label: "RAG Architecture", sub: "Zero hallucination design", color: "bg-purple-500" },
];

export default function Home({ appState }: Props) {
  const { setMode } = appState;
  const navigate = useNavigate();

  const handleSelect = (mode: "general" | "construction") => {
    setMode(mode);
    if (mode === "general") navigate("/general/insights");
    else navigate("/construction/setup");
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">

      {/* Hero */}
      <div className="text-center mb-12 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-prism-50 border border-prism-200 mb-6">
          <div className="live-dot" />
          <span className="text-xs font-medium text-prism-700">AI Document Intelligence Platform</span>
        </div>
        <h1 className="text-4xl font-semibold text-ink tracking-tight mb-4">
          See every angle of your documents
        </h1>
        <p className="text-base text-ink-secondary max-w-xl mx-auto leading-relaxed">
          Prism uses AI to extract insights, answer questions, and generate
          professional documents — from any PDF, in seconds.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-2 gap-5 mb-12">

        {/* General Mode */}
        <button
          onClick={() => handleSelect("general")}
          className="group text-left bg-white border border-border rounded-2xl p-6
                     hover:border-prism-400 hover:shadow-hover transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-prism-500"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="w-11 h-11 rounded-xl bg-prism-50 border border-prism-200
                            flex items-center justify-center">
              <FileText size={20} className="text-prism-700" />
            </div>
            <ArrowRight
              size={16}
              className="text-ink-tertiary group-hover:text-prism-600
                         group-hover:translate-x-0.5 transition-all duration-150 mt-1"
            />
          </div>

          <div className="mb-1">
            <span className="text-xs font-semibold text-prism-600 uppercase tracking-widest">
              General Mode
            </span>
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2 tracking-tight">
            Universal Document Intelligence
          </h2>
          <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
            Works on any document — financial contracts, legal agreements,
            real estate docs, investment memos, or general PDFs.
          </p>

          <div className="flex flex-col gap-2">
            {generalFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={13} className="text-prism-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-ink-secondary">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-prism-700">
              <Globe size={12} />
              Works on any domain
            </div>
          </div>
        </button>

        {/* Construction Mode */}
        <button
          onClick={() => handleSelect("construction")}
          className="group text-left bg-white border border-border rounded-2xl p-6
                     hover:border-amber-400 hover:shadow-hover transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200
                            flex items-center justify-center">
              <HardHat size={20} className="text-amber-700" />
            </div>
            <ArrowRight
              size={16}
              className="text-ink-tertiary group-hover:text-amber-600
                         group-hover:translate-x-0.5 transition-all duration-150 mt-1"
            />
          </div>

          <div className="mb-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
              Construction Mode
            </span>
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2 tracking-tight">
            Construction Project Intelligence
          </h2>
          <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
            Purpose-built for construction, architecture, and real estate.
            Understands contracts, drawings, specs, RFIs, and daily reports.
          </p>

          <div className="flex flex-col gap-2">
            {constructionFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-ink-secondary">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <HardHat size={12} />
              Construction, Architecture, Real Estate
            </div>
          </div>
        </button>
      </div>

      {/* Tech stack */}
      <div className="mb-10">
        <div className="section-label text-center mb-5">Powered By</div>
        <div className="grid grid-cols-4 gap-3">
          {techStack.map((t, i) => (
            <div
              key={i}
              className="bg-white border border-border rounded-xl p-4
                         hover:shadow-card transition-all duration-150"
            >
              <div className={`w-2 h-2 rounded-full ${t.color} mb-3`} />
              <div className="text-xs font-semibold text-ink mb-1">{t.label}</div>
              <div className="text-xs text-ink-tertiary leading-relaxed">{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-3 gap-4 pb-8">
        {[
          { icon: <Zap size={16} className="text-prism-600" />, value: "< 1s", label: "Average AI response time" },
          { icon: <Shield size={16} className="text-blue-600" />, value: "90%+", label: "Extraction accuracy" },
          { icon: <FileText size={16} className="text-amber-600" />, value: "Any PDF", label: "Document compatibility" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-border rounded-xl p-4
                       flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border
                            flex items-center justify-center flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <div className="text-base font-semibold text-ink font-mono">{s.value}</div>
              <div className="text-xs text-ink-secondary">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}