import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";

type Obligation = {
  id: string; title: string; description: string;
  category: "Notice"|"Submission"|"Payment"|"Milestone"|"Insurance"|"Reporting";
  priority: "Critical"|"High"|"Medium";
  clause: string; days_from_now: number;
  status: "Overdue"|"Due Soon"|"Upcoming";
  completed: boolean;
};

const PRIORITY_BORDER: Record<string,string> = { Critical:"#f43f5e", High:"#f59e0b", Medium:"#38bfff" };
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Notice: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Submission: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Payment: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M1 10h22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Milestone: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Insurance: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Reporting: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 20l4-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};
const CATEGORIES = ["All","Notice","Submission","Payment","Milestone","Insurance","Reporting"];

function urgencyLabel(days: number, completed: boolean): { text: string; color: string; bg: string } {
  if (completed) return { text:"Completed", color:"rgba(255,255,255,0.35)", bg:"rgba(255,255,255,0.05)" };
  if (days < 0)  return { text:`${Math.abs(days)}d Overdue`, color:"#f43f5e", bg:"rgba(244,63,94,0.1)" };
  if (days <= 7) return { text:`${days}d Left`, color:"#f59e0b", bg:"rgba(245,158,11,0.1)" };
  return { text:`${days} days`, color:"#38bfff", bg:"rgba(0,168,240,0.08)" };
}

export default function Obligations({ appState }: { appState: AppState }) {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(false);

  useEffect(() => { load(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    const r = await fetch(`${API}/construction/obligations/${appState.sessionId}`).catch(() => null);
    if (r?.ok) { const data = await r.json(); setObligations(data); if (data.length > 0) setExtracted(true); }
  };

  const extract = async () => {
    setLoading(true);
    const r = await fetch(`${API}/construction/obligations/extract`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ session_id: appState.sessionId }),
    });
    if (r.ok) { setObligations(await r.json()); setExtracted(true); }
    setLoading(false);
  };

  const toggle = async (obl: Obligation) => {
    const r = await fetch(`${API}/construction/obligations/complete`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ session_id: appState.sessionId, id: obl.id }),
    });
    if (r.ok) { const updated = await r.json(); setObligations(prev => prev.map(o => o.id === updated.id ? updated : o)); }
  };

  const sorted = [...obligations].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.days_from_now - b.days_from_now;
  });
  const filtered = sorted.filter(o => filter === "All" || o.category === filter);

  const overdue  = obligations.filter(o => !o.completed && o.days_from_now < 0);
  const dueSoon  = obligations.filter(o => !o.completed && o.days_from_now >= 0 && o.days_from_now <= 7);
  const upcoming = obligations.filter(o => !o.completed && o.days_from_now > 7);
  const completed = obligations.filter(o => o.completed);

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-3px)} 40%,80%{transform:translateX(3px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .obl-card:hover { border-color: rgba(255,255,255,0.12) !important; }
        .check-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#92400e)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>Contract Obligations</h1>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Every contractual deadline, notice, and milestone — never miss one again.</p>
        </div>
        <button onClick={extract} disabled={loading} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background: loading ? "rgba(245,158,11,0.3)" : "linear-gradient(135deg,#f59e0b,#92400e)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer", boxShadow:"0 0 20px rgba(245,158,11,0.2)", fontFamily:F }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {loading ? "Extracting…" : extracted ? "Re-extract from Project" : "Extract from Project"}
        </button>
      </div>

      {/* Overdue Alert Banner */}
      {overdue.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px", background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.25)", borderRadius:12, marginBottom:20, animation:"fadeUp 0.3s ease" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#f43f5e", display:"inline-block", animation:"pulse 1s infinite", flexShrink:0 }}/>
          <span style={{ fontSize:13, fontWeight:600, color:"#f43f5e" }}>{overdue.length} obligation{overdue.length>1?"s":""} overdue</span>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>— immediate action required to avoid contractual breach.</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            {overdue.slice(0,2).map(o => (
              <span key={o.id} style={{ fontSize:11, fontFamily:M, padding:"3px 8px", borderRadius:5, background:"rgba(244,63,94,0.12)", color:"#f43f5e", border:"1px solid rgba(244,63,94,0.25)" }}>{o.title}</span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Overdue", value:overdue.length, color:"#f43f5e", sub:"Immediate action needed", pulse:overdue.length>0 },
          { label:"Due This Week", value:dueSoon.length, color:"#f59e0b", sub:"Within 7 days" },
          { label:"Upcoming", value:upcoming.length, color:"#38bfff", sub:"On track" },
          { label:"Completed", value:completed.length, color:"#22d3a0", sub:`of ${obligations.length} total` },
        ].map(s => (
          <div key={s.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              {s.pulse && s.value > 0 && <span style={{ width:6, height:6, borderRadius:"50%", background:"#f43f5e", display:"inline-block", animation:"pulse 1s infinite" }}/>}
              <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:7, border:filter===cat?"1px solid rgba(245,158,11,0.35)":"1px solid rgba(255,255,255,0.08)", background:filter===cat?"rgba(245,158,11,0.1)":"transparent", color:filter===cat?"#f59e0b":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:filter===cat?600:400, cursor:"pointer", fontFamily:F, transition:"all 150ms" }}>
            {cat !== "All" && <span style={{ opacity:0.7 }}>{CATEGORY_ICON[cat]}</span>}
            {cat}
            {cat !== "All" && <span style={{ opacity:0.5 }}>({obligations.filter(o=>o.category===cat).length})</span>}
          </button>
        ))}
      </div>

      {/* Obligation Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"64px 24px", background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:8, color:"rgba(255,255,255,0.7)" }}>No obligations yet</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", maxWidth:360, margin:"0 auto", lineHeight:1.6 }}>
            Upload your contract documents and click "Extract from Project" to automatically identify all contractual obligations, deadlines, and notice requirements.
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(obl => {
            const urg = urgencyLabel(obl.days_from_now, obl.completed);
            const borderColor = obl.completed ? "rgba(255,255,255,0.06)" : PRIORITY_BORDER[obl.priority];
            const isShaking = !obl.completed && obl.days_from_now < -1;
            return (
              <div
                key={obl.id}
                className="obl-card"
                style={{
                  display:"flex", alignItems:"center", gap:16,
                  background:"#1c2535",
                  border:`1px solid rgba(255,255,255,0.07)`,
                  borderLeft:`3px solid ${borderColor}`,
                  borderRadius:12,
                  padding:"16px 20px",
                  transition:"all 150ms",
                  opacity: obl.completed ? 0.55 : 1,
                  animation: isShaking ? "none" : undefined,
                }}
              >
                {/* Checkbox */}
                <button
                  className="check-btn"
                  onClick={() => toggle(obl)}
                  style={{
                    width:22, height:22, borderRadius:6, border:`2px solid ${obl.completed ? "#22d3a0" : "rgba(255,255,255,0.2)"}`,
                    background: obl.completed ? "rgba(34,211,160,0.2)" : "transparent",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0, transition:"all 150ms", opacity:0.85,
                  }}
                >
                  {obl.completed && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#22d3a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>

                {/* Category icon */}
                <div style={{ width:32, height:32, borderRadius:8, background:`${borderColor}18`, border:`1px solid ${borderColor}30`, display:"flex", alignItems:"center", justifyContent:"center", color:borderColor, flexShrink:0 }}>
                  {CATEGORY_ICON[obl.category]}
                </div>

                {/* Main content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:14, fontWeight:600, color: obl.completed ? "rgba(255,255,255,0.4)" : "#f0f4f8", textDecoration: obl.completed ? "line-through" : "none" }}>{obl.title}</span>
                    <span style={{ fontSize:10, fontFamily:M, padding:"2px 6px", borderRadius:4, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.3)" }}>{obl.category}</span>
                    <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.25)" }}>{obl.clause}</span>
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{obl.description}</div>
                </div>

                {/* Priority badge */}
                <div style={{ flexShrink:0 }}>
                  <span style={{ fontSize:10, fontFamily:M, fontWeight:600, padding:"3px 8px", borderRadius:5, background:`${borderColor}18`, color:borderColor, border:`1px solid ${borderColor}30` }}>
                    {obl.priority.toUpperCase()}
                  </span>
                </div>

                {/* Days remaining */}
                <div style={{ flexShrink:0, textAlign:"right", minWidth:90 }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, background:urg.bg, border:`1px solid ${urg.color}25` }}>
                    {!obl.completed && obl.days_from_now < 0 && <span style={{ width:5, height:5, borderRadius:"50%", background:"#f43f5e", display:"inline-block", animation:"pulse 1s infinite" }}/>}
                    <span style={{ fontSize:11, fontFamily:M, fontWeight:700, color:urg.color }}>{urg.text}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
