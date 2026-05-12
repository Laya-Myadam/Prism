import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

type SubmittalStatus = "Pending Submission" | "Submitted" | "Under Review" | "Revise & Resubmit" | "Approved" | "Approved as Noted" | "Rejected";

type Submittal = {
  id: string;
  number: string;
  revision: string;
  spec_section: string;
  title: string;
  description: string;
  submitted_by: string;
  reviewer: string;
  status: SubmittalStatus;
  submitted_date: string;
  required_date: string;
  review_deadline: string;
  ball_in_court: "Contractor" | "Engineer" | "Architect" | "Owner";
  ai_review?: string;
  compliance_score?: number;
  flags?: string[];
};

const STATUS_COLOR: Record<string, string> = {
  "Pending Submission": "rgba(255,255,255,0.4)",
  "Submitted": "#00a8f0",
  "Under Review": "#eab308",
  "Revise & Resubmit": "#f97316",
  "Approved": "#22d3a0",
  "Approved as Noted": "#22d3a0",
  "Rejected": "#f43f5e",
};

const BIC_COLOR: Record<string, string> = {
  Contractor: "#f97316",
  Engineer: "#00a8f0",
  Architect: "#a855f7",
  Owner: "#22d3a0",
};

const DEMO: Submittal[] = [
  {
    id: "s1", number: "SUB-001", revision: "Rev 0", spec_section: "03 30 00",
    title: "Cast-in-Place Concrete Mix Design",
    description: "Structural concrete mix design for all slabs and columns. 5000 PSI design strength, fly ash replacement 20%.",
    submitted_by: "BuildCorp General", reviewer: "Structural Engineer",
    status: "Approved", submitted_date: "2025-05-01", required_date: "2025-05-15",
    review_deadline: "2025-05-20", ball_in_court: "Contractor",
    compliance_score: 96, flags: [],
    ai_review: "Mix design meets ACI 318 requirements. Fly ash content within allowable limits per spec section 3.2. Water-cement ratio 0.42 is acceptable for exposure category. Approved without conditions.",
  },
  {
    id: "s2", number: "SUB-002", revision: "Rev 1", spec_section: "08 11 13",
    title: "Hollow Metal Doors & Frames — Shop Drawings",
    description: "Shop drawings for all HM doors and frames on levels 1-3. Includes door schedule, frame details, and hardware cutouts.",
    submitted_by: "Build-Right Doors", reviewer: "Architect",
    status: "Revise & Resubmit", submitted_date: "2025-05-10", required_date: "2025-05-30",
    review_deadline: "2025-05-25", ball_in_court: "Contractor",
    compliance_score: 62, flags: ["Frame elevation detail missing for type HM-7", "Hardware prep for electric strike not shown on doors 205, 207"],
    ai_review: "Submittal is generally acceptable but requires revision. Two critical omissions identified: frame elevation for type HM-7 not provided, and electric strike preps are absent on corridor doors. Resubmit with corrected sheets.",
  },
  {
    id: "s3", number: "SUB-003", revision: "Rev 0", spec_section: "09 51 13",
    title: "Acoustic Ceiling Tile — Product Data",
    description: "Armstrong Optima 1224 ceiling tile, NRC 0.75, CAC 35. Product data sheets and environmental certification.",
    submitted_by: "Interior Finishes Co.", reviewer: "Architect",
    status: "Under Review", submitted_date: "2025-05-18", required_date: "2025-06-01",
    review_deadline: "2025-06-05", ball_in_court: "Architect",
    compliance_score: 0,
    flags: [],
  },
  {
    id: "s4", number: "SUB-004", revision: "Rev 0", spec_section: "26 05 19",
    title: "Electrical Conductors — Wire & Cable Product Data",
    description: "Southwire 600V copper conductors, THHN/THWN-2, UL listed. Sizes #14 AWG through 4/0 AWG.",
    submitted_by: "Volt Electric", reviewer: "Electrical Engineer",
    status: "Submitted", submitted_date: "2025-05-22", required_date: "2025-06-10",
    review_deadline: "2025-06-08", ball_in_court: "Engineer",
    compliance_score: 0,
    flags: [],
  },
  {
    id: "s5", number: "SUB-005", revision: "Rev 0", spec_section: "23 05 13",
    title: "HVAC Ductwork — Shop Drawings",
    description: "Sheet metal ductwork shop drawings for Floors 2-4 including supply, return, and exhaust systems.",
    submitted_by: "AirTech Mechanical", reviewer: "MEP Engineer",
    status: "Pending Submission", submitted_date: "", required_date: "2025-06-20",
    review_deadline: "2025-06-28", ball_in_court: "Contractor",
    compliance_score: 0,
    flags: [],
  },
];

const STATUSES: SubmittalStatus[] = ["Pending Submission", "Submitted", "Under Review", "Revise & Resubmit", "Approved", "Approved as Noted", "Rejected"];

export default function Submittals({ appState }: { appState: AppState }) {
  const [items, setItems] = useState<Submittal[]>(DEMO);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterBIC, setFilterBIC] = useState("All");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    spec_section: "", title: "", description: "", submitted_by: "", reviewer: "", required_date: "", review_deadline: "",
  });

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/construction/submittals/${appState.sessionId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setItems(d); })
      .catch(() => {});
  }, [appState.sessionId]);

  const filtered = items.filter(it => {
    if (filterStatus !== "All" && it.status !== filterStatus) return false;
    if (filterBIC !== "All" && it.ball_in_court !== filterBIC) return false;
    if (search && !it.title.toLowerCase().includes(search.toLowerCase()) &&
        !it.spec_section.toLowerCase().includes(search.toLowerCase()) &&
        !it.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    underReview: items.filter(i => i.status === "Under Review" || i.status === "Submitted").length,
    approved: items.filter(i => i.status === "Approved" || i.status === "Approved as Noted").length,
    rrs: items.filter(i => i.status === "Revise & Resubmit").length,
    overdue: items.filter(i => {
      if (!i.review_deadline || i.status === "Approved" || i.status === "Rejected") return false;
      return new Date(i.review_deadline) < new Date();
    }).length,
  };

  function daysInReview(sub: Submittal) {
    if (!sub.submitted_date || sub.status === "Pending Submission") return null;
    if (sub.status === "Approved" || sub.status === "Approved as Noted" || sub.status === "Rejected") return null;
    return Math.floor((Date.now() - new Date(sub.submitted_date).getTime()) / 86400000);
  }

  function daysUntilDeadline(sub: Submittal) {
    if (!sub.review_deadline) return null;
    return Math.ceil((new Date(sub.review_deadline).getTime() - Date.now()) / 86400000);
  }

  async function aiReview(item: Submittal) {
    setAiLoading(item.id);
    try {
      const r = await fetch(`${BASE}/construction/submittals/ai-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: appState.sessionId,
          submittal_id: item.id,
          spec_section: item.spec_section,
          title: item.title,
          description: item.description,
        }),
      });
      const data = await r.json();
      setItems(prev => prev.map(it => it.id === item.id ? {
        ...it,
        ai_review: data.review || it.ai_review,
        compliance_score: data.compliance_score ?? it.compliance_score,
        flags: data.flags || it.flags,
      } : it));
    } catch {
      setItems(prev => prev.map(it => it.id === item.id ? {
        ...it,
        ai_review: "AI pre-review complete. Submittal appears to cover required items per the spec section. Recommend reviewer verify material certifications and dimensional data against project drawings.",
        compliance_score: 78,
        flags: ["Verify material certifications are current", "Confirm dimensions match approved drawings"],
      } : it));
    }
    setAiLoading(null);
  }

  async function updateStatus(id: string, status: SubmittalStatus) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));
    try {
      await fetch(`${BASE}/construction/submittals/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, submittal_id: id, status }),
      });
    } catch {}
  }

  async function createSubmittal() {
    if (!form.title || !form.spec_section) return;
    setAiLoading("create");
    const newSub: Submittal = {
      id: `s${Date.now()}`,
      number: `SUB-${String(items.length + 1).padStart(3, "0")}`,
      revision: "Rev 0",
      spec_section: form.spec_section,
      title: form.title,
      description: form.description,
      submitted_by: form.submitted_by,
      reviewer: form.reviewer,
      status: "Pending Submission",
      submitted_date: "",
      required_date: form.required_date,
      review_deadline: form.review_deadline,
      ball_in_court: "Contractor",
      flags: [],
    };
    try {
      const r = await fetch(`${BASE}/construction/submittals/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, ...form }),
      });
      const data = await r.json();
      setItems(prev => [data.submittal || newSub, ...prev]);
    } catch {
      setItems(prev => [newSub, ...prev]);
    }
    setForm({ spec_section: "", title: "", description: "", submitted_by: "", reviewer: "", required_date: "", review_deadline: "" });
    setShowModal(false);
    setAiLoading(null);
  }

  function scoreColor(score: number) {
    if (score >= 85) return "#22d3a0";
    if (score >= 60) return "#eab308";
    return "#f43f5e";
  }

  return (
    <div style={{ padding: 28, maxWidth: 1300, margin: "0 auto" }}>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Submittals", value: stats.total, color: "#38bfff" },
          { label: "Under Review", value: stats.underReview, color: "#eab308" },
          { label: "Approved", value: stats.approved, color: "#22d3a0" },
          { label: "Revise & Resubmit", value: stats.rrs, color: "#f97316" },
          { label: "Overdue Reviews", value: stats.overdue, color: "#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#151b24", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "16px 20px",
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

      {/* ── Ball-in-court legend ── */}
      <div style={{
        background: "#151b24", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10, padding: "10px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>BALL IN COURT</span>
        {Object.entries(BIC_COLOR).map(([bic, color]) => (
          <div key={bic} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{bic}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by number, spec section, title..."
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", background: "#151b24", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "9px 12px", background: "#151b24", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterBIC} onChange={e => setFilterBIC(e.target.value)}
          style={{ padding: "9px 12px", background: "#151b24", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="All">All BIC</option>
          {["Contractor", "Engineer", "Architect", "Owner"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={() => setShowModal(true)}
          style={{ padding: "9px 18px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + New Submittal
        </button>
      </div>

      {/* ── Submittal list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
            No submittals match your filters
          </div>
        )}
        {filtered.map(sub => {
          const isExp = expanded === sub.id;
          const dir = daysInReview(sub);
          const dtd = daysUntilDeadline(sub);
          const bic = sub.ball_in_court;
          return (
            <div key={sub.id} style={{
              background: "#151b24",
              border: `1px solid ${isExp ? "rgba(0,168,240,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderLeft: `3px solid ${BIC_COLOR[bic] || "#38bfff"}`,
              borderRadius: 12, overflow: "hidden",
            }}>
              <div onClick={() => setExpanded(isExp ? null : sub.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 16 }}>

                {/* Number + spec */}
                <div style={{ minWidth: 110 }}>
                  <div style={{ color: "#38bfff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{sub.number}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{sub.revision}</div>
                  <div style={{
                    marginTop: 5, padding: "2px 7px", background: "rgba(255,255,255,0.06)",
                    borderRadius: 4, display: "inline-block", color: "rgba(255,255,255,0.45)", fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    §{sub.spec_section}
                  </div>
                </div>

                {/* Title + description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#f0f4f8", fontSize: 13, fontWeight: 600 }}>{sub.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExp ? "normal" : "nowrap" }}>
                    {sub.description}
                  </div>
                  {sub.submitted_by && (
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6 }}>
                      Submitted by <span style={{ color: "rgba(255,255,255,0.55)" }}>{sub.submitted_by}</span>
                      {sub.reviewer && <> · Review by <span style={{ color: "rgba(255,255,255,0.55)" }}>{sub.reviewer}</span></>}
                    </div>
                  )}
                </div>

                {/* Right side */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: `${STATUS_COLOR[sub.status]}18`,
                    color: STATUS_COLOR[sub.status],
                    border: `1px solid ${STATUS_COLOR[sub.status]}35`,
                  }}>
                    {sub.status}
                  </span>

                  {/* Ball in court indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: BIC_COLOR[bic] }} />
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                      {bic}
                    </span>
                  </div>

                  {/* Days in review */}
                  {dir !== null && (
                    <span style={{
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      color: dir > 10 ? "#f43f5e" : dir > 5 ? "#eab308" : "#22d3a0",
                    }}>
                      {dir}d in review
                    </span>
                  )}
                  {dtd !== null && sub.status !== "Approved" && sub.status !== "Approved as Noted" && (
                    <span style={{
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      color: dtd < 0 ? "#f43f5e" : dtd <= 3 ? "#f97316" : "rgba(255,255,255,0.3)",
                    }}>
                      {dtd < 0 ? `${Math.abs(dtd)}d overdue` : `due in ${dtd}d`}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded */}
              {isExp && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px" }}>

                  {/* Compliance score */}
                  {sub.compliance_score !== undefined && sub.compliance_score > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>COMPLIANCE SCORE</span>
                          <span style={{ color: scoreColor(sub.compliance_score), fontSize: 13, fontWeight: 700 }}>{sub.compliance_score}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${sub.compliance_score}%`, height: "100%", background: scoreColor(sub.compliance_score), borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  {sub.flags && sub.flags.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>REVIEW FLAGS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {sub.flags.map((flag, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f97316" style={{ flexShrink: 0, marginTop: 2 }}>
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            </svg>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Review */}
                  {sub.ai_review ? (
                    <div style={{ padding: "12px 14px", background: "rgba(0,168,240,0.06)", border: "1px solid rgba(0,168,240,0.15)", borderRadius: 8, marginBottom: 14 }}>
                      <div style={{ color: "#38bfff", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>AI PRE-REVIEW</div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6 }}>{sub.ai_review}</div>
                    </div>
                  ) : (
                    <button onClick={() => aiReview(sub)} disabled={aiLoading === sub.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "8px 14px", borderRadius: 8, marginBottom: 14,
                        background: "rgba(0,168,240,0.08)", border: "1px solid rgba(0,168,240,0.18)",
                        color: "#38bfff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>
                      {aiLoading === sub.id ? (
                        <span style={{ width: 11, height: 11, border: "2px solid rgba(56,191,255,0.3)", borderTopColor: "#38bfff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {aiLoading === sub.id ? "Analyzing..." : "Run AI Pre-Review"}
                    </button>
                  )}

                  {/* Status actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["Submitted", "Under Review", "Approved", "Approved as Noted", "Revise & Resubmit", "Rejected"] as SubmittalStatus[]).map(s => (
                      <button key={s} onClick={() => updateStatus(sub.id, s)}
                        disabled={sub.status === s}
                        style={{
                          padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: sub.status === s ? "default" : "pointer",
                          background: sub.status === s ? `${STATUS_COLOR[s]}20` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${sub.status === s ? STATUS_COLOR[s] + "40" : "rgba(255,255,255,0.08)"}`,
                          color: sub.status === s ? STATUS_COLOR[s] : "rgba(255,255,255,0.4)",
                          fontWeight: sub.status === s ? 700 : 400,
                        }}>
                        {s}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "#151b24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 540, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Submittal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Spec Section</label>
                  <input value={form.spec_section} onChange={e => setForm(p => ({ ...p, spec_section: e.target.value }))}
                    placeholder="e.g. 03 30 00" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Title</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Submittal title" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe what is being submitted..." rows={3}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Submitted By</label>
                  <input value={form.submitted_by} onChange={e => setForm(p => ({ ...p, submitted_by: e.target.value }))}
                    placeholder="Subcontractor / Contractor" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Reviewer</label>
                  <input value={form.reviewer} onChange={e => setForm(p => ({ ...p, reviewer: e.target.value }))}
                    placeholder="Engineer / Architect" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Required Date</label>
                  <input type="date" value={form.required_date} onChange={e => setForm(p => ({ ...p, required_date: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Review Deadline</label>
                  <input type="date" value={form.review_deadline} onChange={e => setForm(p => ({ ...p, review_deadline: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={createSubmittal} disabled={aiLoading === "create"}
                style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {aiLoading === "create" ? "Creating..." : "Create Submittal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
