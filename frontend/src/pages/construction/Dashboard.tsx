import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import {
  AlertTriangle, CheckCircle, Clock, FileText,
  TrendingDown, Minus, RefreshCw,
  Building, Calendar, DollarSign, User,
  Loader2, Bot, FilePlus, ChevronDown, ChevronUp
} from "lucide-react";
import { getDashboard } from "../../api/client";
import type { Dashboard as DashboardData } from "../../api/client";

interface Props { appState: AppState; }

const SEVERITY_CONFIG = {
  High: {
    dot: "severity-dot-high",
    badge: "badge-red",
    border: "border-l-4 border-l-red-400 bg-red-50",
  },
  Medium: {
    dot: "severity-dot-med",
    badge: "badge-amber",
    border: "border-l-4 border-l-amber-400 bg-amber-50",
  },
  Low: {
    dot: "severity-dot-low",
    badge: "badge-green",
    border: "border-l-4 border-l-green-400 bg-green-50",
  },
};

export default function Dashboard({ appState }: Props) {
  const { sessionId, projectBuilt, projectName } = appState;
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!projectBuilt) return;
    loadDashboard();
  }, [projectBuilt]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard(sessionId);
      setDashboard(data);
      // Auto-expand all insights
      if (data.project_insights) {
        const exp: Record<string, boolean> = {};
        Object.keys(data.project_insights).forEach(k => exp[k] = true);
        setExpandedInsights(exp);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (!projectBuilt) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Project Dashboard</h1>
            <p className="page-sub">Build your project first to see the dashboard.</p>
          </div>
        </div>
        <div className="empty-state mt-16">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No project built yet</div>
          <div className="empty-state-sub">Go to Project Setup and upload your documents</div>
          <button onClick={() => navigate("/construction/setup")} className="btn-primary mt-4 text-xs px-4 py-2">
            Go to Setup
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-prism-500" />
          <p className="text-sm text-ink-secondary">Loading project dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="alert-error">
          <AlertTriangle size={15} />
          <span>{error || "Dashboard data not available."}</span>
        </div>
      </div>
    );
  }

  const { facts, stats, risks, schedule_health } = dashboard;
  const projectInsights: Record<string, string> = (dashboard as any).project_insights || {};
  const hasInsights = Object.keys(projectInsights).length > 0;

  const scheduleConfig: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
    "On Track": { icon: <CheckCircle size={14} />, cls: "alert-success", label: "On Track" },
    "At Risk":  { icon: <AlertTriangle size={14} />, cls: "alert-warning", label: "At Risk" },
    "Delayed":  { icon: <TrendingDown size={14} />, cls: "alert-error", label: "Delayed" },
    "Unknown":  { icon: <Minus size={14} />, cls: "alert-info", label: "Unknown" },
  };
  const schedCfg = scheduleConfig[schedule_health.status] || scheduleConfig["Unknown"];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{facts.project_name || projectName || "Project Dashboard"}</h1>
          <p className="page-sub">
            {[facts.owner, facts.general_contractor, facts.project_location]
              .filter(Boolean).join(" · ") || "Construction Project Intelligence"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadDashboard} className="btn text-xs gap-1.5">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => navigate("/construction/ask")} className="btn text-xs gap-1.5">
            <Bot size={12} /> Ask Project
          </button>
          <button onClick={() => navigate("/construction/generate")} className="btn-primary text-xs gap-1.5">
            <FilePlus size={12} /> Generate Doc
          </button>
        </div>
      </div>

      {/* Project facts */}
      <div className="card mb-5">
        <div className="card-header">
          <div className="card-title">Project Details</div>
          {facts.liquidated_damages && (
            <div className="badge-red">⚠ LD: {facts.liquidated_damages}/day</div>
          )}
        </div>
        <div className="card-body">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <DollarSign size={13} />, label: "Contract Value", value: facts.project_value },
              { icon: <User size={13} />, label: "Owner", value: facts.owner },
              { icon: <Building size={13} />, label: "General Contractor", value: facts.general_contractor },
              { icon: <User size={13} />, label: "Architect", value: facts.architect },
              { icon: <Calendar size={13} />, label: "Start Date", value: facts.start_date },
              { icon: <Calendar size={13} />, label: "Completion", value: facts.completion_date },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-surface-secondary border border-border
                                flex items-center justify-center flex-shrink-0 mt-0.5 text-ink-secondary">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs text-ink-tertiary uppercase tracking-wide font-medium">{item.label}</div>
                  <div className="text-sm font-medium text-ink mt-0.5">{item.value || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        {[
          { label: "Total Docs",     value: stats.total_documents },
          { label: "Drawings",       value: stats.drawings },
          { label: "Specs",          value: stats.specs },
          { label: "Daily Reports",  value: stats.daily_reports },
          { label: "RFIs",           value: stats.rfis },
          { label: "Change Orders",  value: stats.change_orders },
        ].map((m, i) => (
          <div key={i} className="metric-card text-center p-3">
            <div className="metric-label text-center">{m.label}</div>
            <div className="metric-value text-center text-2xl">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Schedule + Risks */}
      <div className="grid grid-cols-2 gap-5 mb-5">

        <div className="card">
          <div className="card-header">
            <div className="card-title flex items-center gap-2">
              <Clock size={14} className="text-ink-secondary" />
              Schedule Health
            </div>
          </div>
          <div className="card-body">
            <div className={`${schedCfg.cls} mb-4`}>
              {schedCfg.icon}
              <div>
                <div className="font-semibold">{schedCfg.label}</div>
                {schedule_health.days_ahead_behind !== "Unknown" && (
                  <div className="text-xs mt-0.5 opacity-80">{schedule_health.days_ahead_behind}</div>
                )}
              </div>
            </div>
            <p className="text-sm text-ink leading-relaxed mb-4">{schedule_health.summary}</p>
            {schedule_health.critical_activities?.length > 0 && (
              <div>
                <div className="section-label">Critical Activities</div>
                <div className="flex flex-col gap-1.5">
                  {schedule_health.critical_activities.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-xs text-ink-secondary">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title flex items-center gap-2">
              <AlertTriangle size={14} className="text-ink-secondary" />
              Risk Summary
            </div>
            <div className="flex items-center gap-1.5">
              {risks.filter((r: any) => r.severity === "High").length > 0 && (
                <span className="badge-red">{risks.filter((r: any) => r.severity === "High").length} High</span>
              )}
              {risks.filter((r: any) => r.severity === "Medium").length > 0 && (
                <span className="badge-amber">{risks.filter((r: any) => r.severity === "Medium").length} Med</span>
              )}
            </div>
          </div>
          <div className="card-body">
            {risks.length === 0 ? (
              <div className="empty-state py-8">
                <CheckCircle size={24} className="text-green-400 mb-2" />
                <div className="empty-state-title">No significant risks detected</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {risks.slice(0, 4).map((risk: any, i: number) => {
                  const cfg = SEVERITY_CONFIG[risk.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Low;
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${cfg.border}`}>
                      <div className="flex items-start gap-2">
                        <div className={`${cfg.dot} mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-ink">{risk.title}</div>
                          <div className="text-xs text-ink-secondary mt-0.5 leading-relaxed">{risk.description}</div>
                          <div className="text-xs text-ink-tertiary font-mono mt-1">{risk.source}</div>
                        </div>
                        <span className={`badge ${cfg.badge} flex-shrink-0`}>{risk.severity}</span>
                      </div>
                    </div>
                  );
                })}
                {risks.length > 4 && (
                  <div className="text-xs text-ink-tertiary text-center pt-1">
                    +{risks.length - 4} more risks detected
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KEY INSIGHTS — plain English summary ── */}
      {hasInsights && (
        <div className="mb-5 animate-slide-up">
          <div className="card">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <FileText size={14} className="text-ink-secondary" />
                Project Intelligence — Plain English Summary
              </div>
              <div className="badge-green">{Object.keys(projectInsights).length} sections</div>
            </div>
            <div className="card-body flex flex-col gap-2">
              {Object.entries(projectInsights).map(([section, content]) => (
                <div key={section} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedInsights(prev => ({ ...prev, [section]: !prev[section] }))}
                    className="w-full flex items-center justify-between px-4 py-3
                               hover:bg-surface-secondary transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-prism-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-ink text-left">{section}</span>
                    </div>
                    {expandedInsights[section]
                      ? <ChevronUp size={14} className="text-ink-tertiary flex-shrink-0" />
                      : <ChevronDown size={14} className="text-ink-tertiary flex-shrink-0" />
                    }
                  </button>
                  {expandedInsights[section] && (
                    <div className="px-4 pb-4 pt-1 border-t border-border animate-fade-in bg-surface-secondary">
                      <p className="text-sm text-ink leading-relaxed">{content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Quick Actions</div>
        </div>
        <div className="card-body grid grid-cols-3 gap-3">
          {[
            { icon: <Bot size={16} className="text-prism-600" />, title: "Ask Your Project", desc: "Query all documents at once", action: () => navigate("/construction/ask"), color: "hover:border-prism-300 hover:bg-prism-50" },
            { icon: <FilePlus size={16} className="text-amber-600" />, title: "Generate RFI Response", desc: "Create formatted RFI documents", action: () => navigate("/construction/generate"), color: "hover:border-amber-300 hover:bg-amber-50" },
            { icon: <FileText size={16} className="text-blue-600" />, title: "Generate Delay Notice", desc: "Draft a formal delay notice letter", action: () => navigate("/construction/generate"), color: "hover:border-blue-300 hover:bg-blue-50" },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              className={`text-left p-4 rounded-xl border border-border bg-white transition-all duration-150 ${item.color}`}>
              <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <div className="text-xs font-semibold text-ink mb-1">{item.title}</div>
              <div className="text-xs text-ink-tertiary">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}