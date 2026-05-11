import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";

type RFI = {
  id: string; subject: string; description: string;
  assigned_to: string; submitted_by: string;
  date_submitted: string; date_due: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "Closed" | "Overdue" | "Draft";
  response: string | null; date_responded: string | null;
};

const PRIORITY_COLOR: Record<string, string> = { High: "#f43f5e", Medium: "#f59e0b", Low: "#22d3a0" };
const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Open:    { bg: "rgba(0,168,240,0.1)",   text: "#38bfff",  border: "rgba(0,168,240,0.25)" },
  Overdue: { bg: "rgba(244,63,94,0.12)",  text: "#f43f5e",  border: "rgba(244,63,94,0.3)" },
  Closed:  { bg: "rgba(34,211,160,0.1)",  text: "#22d3a0",  border: "rgba(34,211,160,0.25)" },
  Draft:   { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)" },
};

const ASSIGNEES = ["Architect","Structural Engineer","MEP Engineer","Owner","GC","Subcontractor","Survey"];
const today = () => new Date().toISOString().split("T")[0];
const dueIn = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function RFIRegister({ appState }: { appState: AppState }) {
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [filter, setFilter] = useState<"All"|"Open"|"Overdue"|"Closed">("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ subject:"", description:"", assigned_to:"Architect", priority:"Medium", date_due: dueIn(10) });

  useEffect(() => { load(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    const r = await fetch(`${API}/construction/rfi-register/${appState.sessionId}`).catch(() => null);
    if (r?.ok) setRfis(await r.json());
  };

  const createRFI = async () => {
    if (!form.subject.trim()) return;
    const r = await fetch(`${API}/construction/rfi-register/create`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: appState.sessionId, ...form, date_submitted: today(), submitted_by: appState.user?.name || "GC" }),
    });
    if (r.ok) { const created = await r.json(); setRfis(prev => [...prev, created]); setShowModal(false); setForm({ subject:"", description:"", assigned_to:"Architect", priority:"Medium", date_due: dueIn(10) }); }
  };

  const aiRespond = async (rfi: RFI) => {
    setAiLoading(rfi.id);
    const r = await fetch(`${API}/construction/rfi-register/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: appState.sessionId, subject: rfi.subject, description: rfi.description }),
    });
    if (r.ok) {
      const { response } = await r.json();
      await closeRFI(rfi, response);
    }
    setAiLoading(null);
  };

  const closeRFI = async (rfi: RFI, response?: string) => {
    const r = await fetch(`${API}/construction/rfi-register/update`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: appState.sessionId, id: rfi.id, status: "Closed", response: response || rfi.response, date_responded: today() }),
    });
    if (r.ok) { const updated = await r.json(); setRfis(prev => prev.map(x => x.id === updated.id ? updated : x)); }
  };

  const filtered = rfis.filter(r => {
    const matchFilter = filter === "All" || r.status === filter;
    const matchSearch = r.subject.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: rfis.length,
    open: rfis.filter(r => r.status === "Open").length,
    overdue: rfis.filter(r => r.status === "Overdue").length,
    closed: rfis.filter(r => r.status === "Closed").length,
  };
  const avgResponse = rfis.filter(r => r.date_responded && r.date_submitted).length > 0
    ? (rfis.filter(r => r.date_responded && r.date_submitted)
        .reduce((acc, r) => acc + Math.abs((new Date(r.date_responded!).getTime() - new Date(r.date_submitted).getTime()) / 86400000), 0)
        / rfis.filter(r => r.date_responded).length).toFixed(1)
    : "—";

  return (
    <div style={{ padding: "28px 32px", fontFamily: F, color: "#f0f4f8", minHeight: "100%", background: "#0f1319" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rfi-row:hover { background: rgba(255,255,255,0.03) !important; }
        .rfi-action-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#00a8f0,#0054a0)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>RFI Register</h1>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Track, respond, and close all project RFIs in one place.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"linear-gradient(135deg,#00a8f0,#0054a0)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 0 20px rgba(0,168,240,0.3)", fontFamily:F }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          New RFI
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total RFIs", value:stats.total, color:"#f0f4f8", sub:"All time" },
          { label:"Open", value:stats.open, color:"#38bfff", sub:"Awaiting response" },
          { label:"Overdue", value:stats.overdue, color:"#f43f5e", sub:"Past due date", pulse:true },
          { label:"Closed", value:stats.closed, color:"#22d3a0", sub:"Resolved" },
          { label:"Avg Response", value:avgResponse === "—" ? avgResponse : `${avgResponse}d`, color:"#f59e0b", sub:"Days to respond" },
        ].map(s => (
          <div key={s.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              {s.pulse && s.value > 0 && <span style={{ width:6, height:6, borderRadius:"50%", background:"#f43f5e", display:"inline-block", animation:"pulse 1.5s infinite" }}/>}
              <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, maxWidth:320 }}>
          <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }} width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFIs…" style={{ width:"100%", paddingLeft:36, padding:"9px 12px 9px 36px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#f0f4f8", fontSize:13, outline:"none", fontFamily:F, boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {(["All","Open","Overdue","Closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"8px 14px", borderRadius:7, border:filter===f?"1px solid rgba(0,168,240,0.3)":"1px solid rgba(255,255,255,0.08)", background:filter===f?"rgba(0,168,240,0.12)":"transparent", color:filter===f?"#38bfff":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:filter===f?600:400, cursor:"pointer", fontFamily:F, transition:"all 150ms" }}>
              {f} {f !== "All" && <span style={{ opacity:0.6 }}>({rfis.filter(r => r.status === f).length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" }}>
        {/* Head */}
        <div style={{ display:"grid", gridTemplateColumns:"90px 1fr 80px 120px 100px 100px 110px 140px", gap:12, padding:"11px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>
          {["RFI #","Subject","Priority","Assigned To","Submitted","Due","Status",""].map(h => (
            <div key={h} style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:"48px 20px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>
            {rfis.length === 0 ? "No RFIs yet — create your first one above." : "No RFIs match the current filter."}
          </div>
        ) : (
          filtered.map((rfi, i) => {
            const sc = STATUS_COLOR[rfi.status] || STATUS_COLOR.Draft;
            const isExpanded = expanded === rfi.id;
            const isOverdue = rfi.status === "Overdue";
            return (
              <div key={rfi.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div
                  className="rfi-row"
                  style={{ display:"grid", gridTemplateColumns:"90px 1fr 80px 120px 100px 100px 110px 140px", gap:12, padding:"14px 20px", cursor:"pointer", transition:"background 150ms", background: isOverdue ? "rgba(244,63,94,0.03)" : "transparent" }}
                  onClick={() => setExpanded(isExpanded ? null : rfi.id)}
                >
                  <div style={{ fontFamily:M, fontSize:12, color:"#38bfff", fontWeight:600 }}>{rfi.id}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:"#f0f4f8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rfi.subject}</div>
                  <div>
                    <span style={{ fontSize:10, fontFamily:M, fontWeight:600, padding:"3px 7px", borderRadius:5, background:`${PRIORITY_COLOR[rfi.priority]}18`, color:PRIORITY_COLOR[rfi.priority], border:`1px solid ${PRIORITY_COLOR[rfi.priority]}30` }}>{rfi.priority.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{rfi.assigned_to}</div>
                  <div style={{ fontSize:12, fontFamily:M, color:"rgba(255,255,255,0.4)" }}>{rfi.date_submitted || "—"}</div>
                  <div style={{ fontSize:12, fontFamily:M, color: isOverdue ? "#f43f5e" : "rgba(255,255,255,0.4)", fontWeight: isOverdue ? 600 : 400 }}>{rfi.date_due || "—"}</div>
                  <div>
                    <span style={{ fontSize:10, fontFamily:M, fontWeight:600, padding:"3px 8px", borderRadius:5, background:sc.bg, color:sc.text, border:`1px solid ${sc.border}` }}>{rfi.status.toUpperCase()}</span>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }} onClick={e => e.stopPropagation()}>
                    {(rfi.status === "Open" || rfi.status === "Overdue") && (
                      <button
                        className="rfi-action-btn"
                        onClick={() => aiRespond(rfi)}
                        disabled={aiLoading === rfi.id}
                        style={{ padding:"5px 10px", borderRadius:6, background:"rgba(0,168,240,0.12)", border:"1px solid rgba(0,168,240,0.25)", color:"#38bfff", fontSize:11, fontFamily:M, cursor:"pointer", opacity:0.85, transition:"all 150ms", whiteSpace:"nowrap" }}
                      >
                        {aiLoading === rfi.id ? "…" : "AI Respond"}
                      </button>
                    )}
                    <svg style={{ color:"rgba(255,255,255,0.2)", transform: isExpanded ? "rotate(180deg)" : "none", transition:"transform 200ms" }} width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding:"0 20px 20px", animation:"fadeUp 0.2s ease" }}>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:16 }}>
                      <div style={{ fontSize:10, fontFamily:M, color:"rgba(0,168,240,0.7)", letterSpacing:"0.1em", marginBottom:8 }}>DESCRIPTION</div>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.65, margin:0, marginBottom: rfi.response ? 16 : 0 }}>{rfi.description || "No description provided."}</p>
                      {rfi.response && (
                        <>
                          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"12px 0" }}/>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                            <span style={{ fontSize:10, fontFamily:M, color:"rgba(34,211,160,0.7)", letterSpacing:"0.1em" }}>AI RESPONSE</span>
                            <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.2)" }}>· {rfi.date_responded}</span>
                          </div>
                          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.7, margin:0 }}>{rfi.response}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New RFI Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }} onClick={() => setShowModal(false)}>
          <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:32, width:520, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:"0 0 20px", letterSpacing:"-0.02em" }}>New Request for Information</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[{k:"subject",l:"Subject / Question",ph:"e.g. Waterproofing membrane specification at podium level"},{k:"description",l:"Full Description",ph:"Provide full context…",multi:true}].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>{f.l.toUpperCase()}</label>
                  {f.multi
                    ? <textarea rows={4} value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                    : <input value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>}
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>ASSIGNED TO</label>
                  <select value={form.assigned_to} onChange={e => setForm(p => ({...p,assigned_to:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" }}>
                    {ASSIGNEES.map(a => <option key={a} style={{ background:"#1c2535" }}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>PRIORITY</label>
                  <select value={form.priority} onChange={e => setForm(p => ({...p,priority:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" }}>
                    {["High","Medium","Low"].map(p => <option key={p} style={{ background:"#1c2535" }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>DUE DATE</label>
                  <input type="date" value={form.date_due} onChange={e => setForm(p => ({...p,date_due:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex:1, padding:"11px", borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", fontFamily:F }}>Cancel</button>
                <button onClick={createRFI} style={{ flex:2, padding:"11px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00a8f0,#0054a0)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, boxShadow:"0 0 16px rgba(0,168,240,0.3)" }}>Create RFI</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
