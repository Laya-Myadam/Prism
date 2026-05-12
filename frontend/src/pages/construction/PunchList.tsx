import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

type PunchItem = {
  id: string;
  number: string;
  location: string;
  description: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  assignee: string;
  trade: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  due_date: string;
  created_at: string;
  ai_notes?: string;
  inspection_ready?: boolean;
  ball_in_court?: "Contractor" | "Owner" | "Architect" | "Inspector";
};

const PRIORITY_COLOR: Record<string, string> = {
  Critical: "#f43f5e",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22d3a0",
};

const STATUS_COLOR: Record<string, string> = {
  Open: "#f43f5e",
  "In Progress": "#00a8f0",
  Resolved: "#22d3a0",
  Closed: "rgba(255,255,255,0.3)",
};

const DEMO: PunchItem[] = [
  {
    id: "p1", number: "PL-001", location: "Level 3 — East Wing",
    description: "Ceiling tiles not properly seated in grid. Multiple tiles have visible gaps along the perimeter requiring re-installation per spec section 09513.",
    category: "Incomplete Work", priority: "High", assignee: "Interior Finishes Co.", trade: "Ceiling",
    status: "Open", due_date: "2025-06-10", created_at: "2025-05-28", ball_in_court: "Contractor",
    ai_notes: "Non-conformance with spec 09513.2.4. Recommend inspector re-visit after re-installation. Estimated 4 hours remediation.",
  },
  {
    id: "p2", number: "PL-002", location: "Ground Floor — Lobby",
    description: "Exit sign above main entrance not illuminated. Emergency lighting circuit appears disconnected at distribution panel.",
    category: "Safety", priority: "Critical", assignee: "Volt Electric", trade: "Electrical",
    status: "In Progress", due_date: "2025-06-02", created_at: "2025-05-25", ball_in_court: "Contractor",
    ai_notes: "Life safety item under NFPA 101. Must be resolved before any occupancy. Verify emergency circuit continuity at panel B-2.",
  },
  {
    id: "p3", number: "PL-003", location: "Level 2 — Restrooms",
    description: "Tile grout color inconsistent between north and south walls. Material used does not match the approved color submittal #SUB-047.",
    category: "Quality", priority: "Medium", assignee: "Premier Tile Works", trade: "Tile",
    status: "Open", due_date: "2025-06-15", created_at: "2025-05-30", ball_in_court: "Architect",
  },
  {
    id: "p4", number: "PL-004", location: "Roof Level",
    description: "HVAC unit curb flashing incomplete on north side. Water infiltration path identified during rain inspection.",
    category: "Damage Risk", priority: "High", assignee: "AirTech Mechanical", trade: "Mechanical",
    status: "Resolved", due_date: "2025-06-05", created_at: "2025-05-20", ball_in_court: "Inspector",
    ai_notes: "Flashing must meet SMACNA standards. High infiltration risk before wet season. Verify with infrared scan after repair.",
    inspection_ready: true,
  },
  {
    id: "p5", number: "PL-005", location: "Level 1 — Corridor B",
    description: "Door hardware on rooms 105–109 does not match approved hardware schedule. Lever handles installed vs. specified locksets.",
    category: "Spec Non-Conformance", priority: "Low", assignee: "Build-Right Doors", trade: "Doors & Hardware",
    status: "Closed", due_date: "2025-05-31", created_at: "2025-05-15", ball_in_court: "Owner",
  },
];

const CATEGORIES = ["All", "Safety", "Quality", "Incomplete Work", "Damage Risk", "Spec Non-Conformance", "Cosmetic"];
const STATUSES = ["All", "Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["All", "Critical", "High", "Medium", "Low"];
const BIC_OPTIONS = ["Contractor", "Owner", "Architect", "Inspector"] as const;

export default function PunchList({ appState }: { appState: AppState }) {
  const [items, setItems] = useState<PunchItem[]>(DEMO);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ location: "", description: "", assignee: "", trade: "", priority: "Medium", due_date: "" });

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/construction/punch/${appState.sessionId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setItems(d); })
      .catch(() => {});
  }, [appState.sessionId]);

  const filtered = items.filter(it => {
    if (filterStatus !== "All" && it.status !== filterStatus) return false;
    if (filterPriority !== "All" && it.priority !== filterPriority) return false;
    if (filterCategory !== "All" && it.category !== filterCategory) return false;
    if (search && !it.description.toLowerCase().includes(search.toLowerCase()) &&
        !it.location.toLowerCase().includes(search.toLowerCase()) &&
        !it.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    open: items.filter(i => i.status === "Open").length,
    inProgress: items.filter(i => i.status === "In Progress").length,
    resolved: items.filter(i => i.status === "Resolved").length,
    critical: items.filter(i => i.priority === "Critical").length,
  };

  async function aiCategorizeAll() {
    const openItems = items.filter(i => i.status === "Open" || i.status === "In Progress");
    if (openItems.length === 0) return;
    setAiLoading("bulk");
    try {
      const r = await fetch(`${BASE}/construction/punch/ai-categorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, items: openItems }),
      });
      const data = await r.json();
      if (Array.isArray(data.categorized)) {
        setItems(prev => prev.map(it => {
          const updated = data.categorized.find((c: PunchItem) => c.id === it.id);
          return updated ? { ...it, ...updated } : it;
        }));
      }
    } catch {}
    setAiLoading(null);
  }

  async function updateStatus(id: string, status: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status: status as PunchItem["status"] } : it));
    try {
      await fetch(`${BASE}/construction/punch/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, punch_id: id, status }),
      });
    } catch {}
  }

  async function updateBIC(id: string, bic: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ball_in_court: bic as PunchItem["ball_in_court"] } : it));
    try {
      await fetch(`${BASE}/construction/punch/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, punch_id: id, ball_in_court: bic }),
      });
    } catch {}
  }

  async function createItem() {
    if (!form.location || !form.description) return;
    setAiLoading("create");
    const newItem: PunchItem = {
      id: `p${Date.now()}`,
      number: `PL-${String(items.length + 1).padStart(3, "0")}`,
      location: form.location,
      description: form.description,
      category: "Uncategorized",
      priority: form.priority as PunchItem["priority"],
      assignee: form.assignee,
      trade: form.trade,
      status: "Open",
      due_date: form.due_date,
      created_at: new Date().toISOString().split("T")[0],
      ball_in_court: "Contractor",
    };
    try {
      const r = await fetch(`${BASE}/construction/punch/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, ...form }),
      });
      const data = await r.json();
      setItems(prev => [data.item || newItem, ...prev]);
    } catch {
      setItems(prev => [newItem, ...prev]);
    }
    setForm({ location: "", description: "", assignee: "", trade: "", priority: "Medium", due_date: "" });
    setShowModal(false);
    setAiLoading(null);
  }

  function daysUntil(date: string) {
    const d = new Date(date).getTime() - Date.now();
    return Math.ceil(d / 86400000);
  }

  return (
    <div style={{ padding: 28, maxWidth: 1300, margin: "0 auto" }}>

      {/* ── Stats header ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Items", value: stats.total, color: "#38bfff" },
          { label: "Open", value: stats.open, color: "#f43f5e" },
          { label: "In Progress", value: stats.inProgress, color: "#00a8f0" },
          { label: "Resolved", value: stats.resolved, color: "#22d3a0" },
          { label: "Critical", value: stats.critical, color: "#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#151b24",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "16px 20px",
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", marginBottom: 8 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ color: s.color, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by location, description, number..."
          style={{
            flex: 1, minWidth: 200, padding: "9px 14px",
            background: "#151b24", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none",
          }}
        />
        {[
          { label: "Status", value: filterStatus, set: setFilterStatus, opts: STATUSES },
          { label: "Priority", value: filterPriority, set: setFilterPriority, opts: PRIORITIES },
          { label: "Category", value: filterCategory, set: setFilterCategory, opts: CATEGORIES },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
            style={{
              padding: "9px 12px", background: "#151b24",
              border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8,
              color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer",
            }}>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={aiCategorizeAll} disabled={aiLoading === "bulk"}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 8,
            background: aiLoading === "bulk" ? "rgba(0,168,240,0.08)" : "rgba(0,168,240,0.12)",
            border: "1px solid rgba(0,168,240,0.2)",
            color: "#38bfff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.02em",
          }}>
          {aiLoading === "bulk" ? (
            <span style={{ width: 12, height: 12, border: "2px solid rgba(56,191,255,0.3)", borderTopColor: "#38bfff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          AI Categorize All
        </button>
        <button onClick={() => setShowModal(true)}
          style={{
            padding: "9px 18px", borderRadius: 8,
            background: "linear-gradient(135deg, #00a8f0, #0054a0)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", letterSpacing: "-0.01em",
          }}>
          + Add Item
        </button>
      </div>

      {/* ── Items list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
            No punch items match your filters
          </div>
        )}
        {filtered.map(item => {
          const isExpanded = expanded === item.id;
          const days = item.due_date ? daysUntil(item.due_date) : null;
          const overdue = days !== null && days < 0;
          return (
            <div key={item.id} style={{
              background: "#151b24",
              border: `1px solid ${isExpanded ? "rgba(0,168,240,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderLeft: `3px solid ${PRIORITY_COLOR[item.priority]}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color 200ms ease",
            }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 16 }}
              >
                {/* Number + location */}
                <div style={{ minWidth: 100 }}>
                  <div style={{ color: "#38bfff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{item.number}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>{item.location}</div>
                </div>

                {/* Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: "#f0f4f8", fontSize: 13, fontWeight: 500, lineHeight: 1.5,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap",
                  }}>
                    {item.description}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)", fontSize: 11,
                    }}>
                      {item.category}
                    </span>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.4)", fontSize: 11,
                    }}>
                      {item.trade}
                    </span>
                  </div>
                </div>

                {/* Right: priority, status, BIC, due date */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                      background: `${PRIORITY_COLOR[item.priority]}1a`,
                      color: PRIORITY_COLOR[item.priority],
                      border: `1px solid ${PRIORITY_COLOR[item.priority]}33`,
                    }}>
                      {item.priority}
                    </span>
                    <span style={{
                      padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: `${STATUS_COLOR[item.status]}18`,
                      color: STATUS_COLOR[item.status],
                      border: `1px solid ${STATUS_COLOR[item.status]}30`,
                    }}>
                      {item.status}
                    </span>
                  </div>
                  {item.ball_in_court && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00a8f0" }} />
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>BIC: <span style={{ color: "#38bfff" }}>{item.ball_in_court}</span></span>
                    </div>
                  )}
                  {days !== null && (
                    <span style={{
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      color: overdue ? "#f43f5e" : days <= 3 ? "#f97316" : "rgba(255,255,255,0.3)",
                    }}>
                      {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>ASSIGNEE</div>
                      <div style={{ color: "#f0f4f8", fontSize: 13 }}>{item.assignee || "Unassigned"}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>DUE DATE</div>
                      <div style={{ color: "#f0f4f8", fontSize: 13 }}>{item.due_date || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>CREATED</div>
                      <div style={{ color: "#f0f4f8", fontSize: 13 }}>{item.created_at}</div>
                    </div>
                  </div>

                  {item.ai_notes && (
                    <div style={{
                      padding: "12px 14px",
                      background: "rgba(0,168,240,0.06)",
                      border: "1px solid rgba(0,168,240,0.15)",
                      borderRadius: 8, marginBottom: 14,
                    }}>
                      <div style={{ color: "#38bfff", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>AI ASSESSMENT</div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6 }}>{item.ai_notes}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* Status updater */}
                    {(["Open", "In Progress", "Resolved", "Closed"] as PunchItem["status"][]).map(s => (
                      <button key={s} onClick={() => updateStatus(item.id, s)}
                        disabled={item.status === s}
                        style={{
                          padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: item.status === s ? "default" : "pointer",
                          background: item.status === s ? `${STATUS_COLOR[s]}20` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${item.status === s ? STATUS_COLOR[s] + "40" : "rgba(255,255,255,0.08)"}`,
                          color: item.status === s ? STATUS_COLOR[s] : "rgba(255,255,255,0.4)",
                          fontWeight: item.status === s ? 700 : 400,
                        }}>
                        {s}
                      </button>
                    ))}
                    <div style={{ width: 1, background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, alignSelf: "center" }}>Ball in court:</span>
                    {BIC_OPTIONS.map(bic => (
                      <button key={bic} onClick={() => updateBIC(item.id, bic)}
                        style={{
                          padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                          background: item.ball_in_court === bic ? "rgba(0,168,240,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${item.ball_in_court === bic ? "rgba(0,168,240,0.3)" : "rgba(255,255,255,0.08)"}`,
                          color: item.ball_in_court === bic ? "#38bfff" : "rgba(255,255,255,0.4)",
                          fontWeight: item.ball_in_court === bic ? 700 : 400,
                        }}>
                        {bic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "#151b24", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: 28, width: 520, maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Punch Item</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Location / Area", key: "location", placeholder: "e.g. Level 2 — East Corridor" },
                { label: "Description", key: "description", placeholder: "Describe the deficiency..." },
                { label: "Responsible Party / Assignee", key: "assignee", placeholder: "e.g. Premier Tile Works" },
                { label: "Trade", key: "trade", placeholder: "e.g. Electrical, Tile, HVAC..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
                  {f.key === "description" ? (
                    <textarea value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={3}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                  ) : (
                    <input value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                  )}
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", cursor: "pointer" }}>
                    {["Critical", "High", "Medium", "Low"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={createItem} disabled={aiLoading === "create"}
                style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {aiLoading === "create" ? "Creating..." : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
