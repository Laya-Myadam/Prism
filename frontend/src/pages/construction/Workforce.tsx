import { useState } from "react";
import type { AppState } from "../../App";

const initialWorkers = [
  { id:1, name:"Marcus Rivera", role:"Foreman",        trade:"Concrete", status:"On Site",  hours:8,   phone:"+1 555 0101" },
  { id:2, name:"James Okafor",  role:"Carpenter",      trade:"Formwork", status:"On Site",  hours:7.5, phone:"+1 555 0102" },
  { id:3, name:"Priya Nair",    role:"Safety Officer", trade:"HSE",      status:"On Site",  hours:8,   phone:"+1 555 0103" },
  { id:4, name:"Carlos Mendez", role:"Ironworker",     trade:"Rebar",    status:"On Site",  hours:6,   phone:"+1 555 0104" },
  { id:5, name:"Ahmed Hassan",  role:"Engineer",       trade:"MEP",      status:"Off Site", hours:0,   phone:"+1 555 0105" },
  { id:6, name:"Sarah Kim",     role:"Surveyor",       trade:"Civil",    status:"On Site",  hours:8,   phone:"+1 555 0106" },
  { id:7, name:"Tom Bradley",   role:"Operator",       trade:"Crane",    status:"Leave",    hours:0,   phone:"+1 555 0107" },
];

const trades = ["All","Concrete","Formwork","HSE","Rebar","MEP","Civil","Crane"];
const statusColor: Record<string,string> = { "On Site":"#22d3a0", "Off Site":"#f59e0b", "Leave":"#8a9bb0" };
const avatarColor: Record<string,string> = { "Concrete":"#00a8f0","Formwork":"#a78bfa","HSE":"#22d3a0","Rebar":"#38bfff","MEP":"#f59e0b","Civil":"#fbbf24","Crane":"#f43f5e" };
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"8px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const trendColor: Record<string,string> = { Improving:"#22d3a0", Stable:"#38bfff", Declining:"#f43f5e" };
const recColor: Record<string,string>   = { keep:"#22d3a0", monitor:"#f59e0b", replace:"#f43f5e" };

export default function Workforce({ appState }: { appState: AppState }) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [filter, setFilter]   = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", role:"", trade:"Concrete", phone:"" });

  // Subcontractor Scorecard state
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreResult, setScoreResult]   = useState<any>(null);
  const [scoreError, setScoreError]     = useState("");
  const [showScorecard, setShowScorecard] = useState(false);

  const filtered = filter === "All" ? workers : workers.filter(w => w.trade === filter);
  const onSite   = workers.filter(w => w.status === "On Site").length;

  const addWorker = () => {
    if (!form.name) return;
    setWorkers(p => [...p, { id:Date.now(), ...form, status:"Off Site", hours:0 }]);
    setForm({ name:"", role:"", trade:"Concrete", phone:"" });
    setShowForm(false);
  };

  const runScorecard = async () => {
    setScoreLoading(true); setScoreError(""); setScoreResult(null); setShowScorecard(true);
    try {
      const res = await fetch(`${API_BASE}/construction/subcontractor-score`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, question: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Scorecard failed");
      setScoreResult(data);
    } catch (e: any) { setScoreError(e.message ?? "Failed"); }
    finally { setScoreLoading(false); }
  };

  const ScoreBar = ({ value, color = "#38bfff" }: { value: number; color?: string }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.07)", borderRadius:2 }}>
        <div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:2 }}/>
      </div>
      <span style={{ fontSize:11, fontFamily:M, color, minWidth:26, textAlign:"right" as const }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:3 }}>Workforce</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M }}><span style={{ color:"#22d3a0" }}>{onSite}</span> on site · {workers.length} total</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={runScorecard} disabled={scoreLoading} style={{ background:"linear-gradient(135deg,#a78bfa,#7c3aed)", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, fontWeight:600, cursor:scoreLoading?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:8 }}>
            {scoreLoading
              ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Scoring...</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> AI Scorecard</>
            }
          </button>
          <button onClick={() => setShowForm(true)} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>+ Add Worker</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"On Site",           value:onSite,                                              color:"#22d3a0" },
          { label:"Off Site",          value:workers.filter(w=>w.status==="Off Site").length,     color:"#f59e0b" },
          { label:"On Leave",          value:workers.filter(w=>w.status==="Leave").length,        color:"#8a9bb0" },
          { label:"Total Hours Today", value:workers.reduce((a,w)=>a+w.hours,0).toFixed(1),      color:"#38bfff" },
        ].map(s => (
          <div key={s.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:24, fontWeight:700, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── AI Subcontractor Scorecard ── */}
      {showScorecard && (
        <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:700, background:"rgba(167,139,250,0.15)", color:"#a78bfa", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
                Subcontractor Performance Scorecard
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>AI analysis of subcontractor performance from daily reports, RFIs, and inspection records</div>
            </div>
            <button onClick={() => setShowScorecard(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:18, padding:"0 4px" }}>✕</button>
          </div>

          {scoreLoading && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"32px 0", color:"rgba(255,255,255,0.4)", fontSize:13 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", border:"3px solid rgba(167,139,250,0.2)", borderTopColor:"#a78bfa", animation:"spin 0.8s linear infinite" }}/>
              Analyzing subcontractor performance data...
            </div>
          )}

          {scoreError && <div style={{ color:"#f43f5e", fontSize:13, padding:"8px 0" }}>{scoreError}</div>}

          {scoreResult && !scoreLoading && (
            <div>
              {/* Overall score + summary */}
              <div style={{ display:"flex", gap:20, alignItems:"center", padding:"14px 16px", background:"rgba(255,255,255,0.03)", borderRadius:10, marginBottom:16, border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", border:`5px solid ${scoreResult.overall_project_performance >= 75 ? "#22d3a0" : scoreResult.overall_project_performance >= 50 ? "#f59e0b" : "#f43f5e"}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:scoreResult.overall_project_performance >= 75 ? "#22d3a0" : "#f59e0b", lineHeight:1 }}>{scoreResult.overall_project_performance}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:M }}>/ 100</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65, marginBottom:8 }}>{scoreResult.summary}</div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap" as const }}>
                    {scoreResult.top_performer && <span style={{ fontSize:12 }}>🏆 <span style={{ color:"#22d3a0", fontWeight:600 }}>{scoreResult.top_performer}</span> <span style={{ color:"rgba(255,255,255,0.35)" }}>Top Performer</span></span>}
                    {scoreResult.attention_needed && <span style={{ fontSize:12 }}>⚠ <span style={{ color:"#f43f5e", fontWeight:600 }}>{scoreResult.attention_needed}</span> <span style={{ color:"rgba(255,255,255,0.35)" }}>Needs Attention</span></span>}
                  </div>
                </div>
              </div>

              {/* Sub cards */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {scoreResult.subcontractors?.map((sub: any, i: number) => (
                  <div key={i} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{sub.name}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:M }}>{sub.trade}</div>
                      </div>
                      <div style={{ display:"flex", flex:"column", alignItems:"flex-end", gap:6 }}>
                        <div style={{ fontSize:22, fontWeight:800, color:sub.overall_score >= 80 ? "#22d3a0" : sub.overall_score >= 65 ? "#f59e0b" : "#f43f5e", lineHeight:1 }}>{sub.overall_score}</div>
                        <div style={{ display:"flex", gap:6, marginTop:4 }}>
                          <span style={{ fontSize:10, fontWeight:600, color:trendColor[sub.trend] ?? "#38bfff", fontFamily:M }}>{sub.trend}</span>
                          <span style={{ fontSize:10, fontWeight:600, color:recColor[sub.recommendation] ?? "#f59e0b", background:`${recColor[sub.recommendation] ?? "#f59e0b"}18`, padding:"1px 6px", borderRadius:3, fontFamily:M, textTransform:"uppercase" as const }}>{sub.recommendation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    {sub.scores && (
                      <div style={{ marginBottom:12 }}>
                        {Object.entries(sub.scores).map(([k, v]) => (
                          <div key={k} style={{ display:"grid", gridTemplateColumns:"90px 1fr", alignItems:"center", gap:8, marginBottom:5 }}>
                            <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"capitalize" as const }}>{k.replace(/_/g," ")}</span>
                            <ScoreBar value={v as number} color={sub.overall_score >= 75 ? "#22d3a0" : sub.overall_score >= 60 ? "#38bfff" : "#f59e0b"} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Strengths & Concerns */}
                    {sub.strengths?.length > 0 && (
                      <div style={{ marginBottom:8 }}>
                        {sub.strengths.slice(0, 2).map((s: string, j: number) => (
                          <div key={j} style={{ fontSize:11, color:"rgba(34,211,160,0.8)", padding:"2px 0" }}>✓ {s}</div>
                        ))}
                      </div>
                    )}
                    {sub.concerns?.length > 0 && (
                      <div>
                        {sub.concerns.slice(0, 2).map((c: string, j: number) => (
                          <div key={j} style={{ fontSize:11, color:"rgba(244,63,94,0.8)", padding:"2px 0" }}>⚠ {c}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add worker form */}
      {showForm && (
        <div style={{ background:"rgba(0,168,240,0.05)", border:"1px solid rgba(0,168,240,0.2)", borderRadius:12, padding:20, marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
          {[{k:"name",l:"Name",ph:"John Smith"},{k:"role",l:"Role",ph:"Carpenter"},{k:"phone",l:"Phone",ph:"+1 555 0100"}].map(f => (
            <div key={f.k}><label style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, display:"block", marginBottom:6 }}>{f.l.toUpperCase()}</label><input value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/></div>
          ))}
          <div>
            <label style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, display:"block", marginBottom:6 }}>TRADE</label>
            <select value={form.trade} onChange={e => setForm(p => ({...p,trade:e.target.value}))} style={{...inp,cursor:"pointer"}}>
              {trades.filter(t=>t!=="All").map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addWorker} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontWeight:600, cursor:"pointer", fontFamily:F, fontSize:13 }}>Add</button>
            <button onClick={() => setShowForm(false)} style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"8px 12px", cursor:"pointer", fontFamily:F, fontSize:13 }}>✕</button>
          </div>
        </div>
      )}

      {/* Trade filter chips */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" as const }}>
        {trades.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ background:filter===t?"rgba(0,168,240,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${filter===t?"rgba(0,168,240,0.3)":"rgba(255,255,255,0.08)"}`, color:filter===t?"#38bfff":"rgba(255,255,255,0.4)", borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:F, transition:"all 0.15s" }}>{t}</button>
        ))}
      </div>

      {/* Worker table */}
      <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              {["Name","Role","Trade","Status","Hours Today","Phone"].map(h => (
                <th key={h} style={{ padding:"11px 16px", textAlign:"left" as const, fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.08em", fontWeight:500, background:"rgba(255,255,255,0.02)" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => (
              <tr key={w.id} style={{ borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,0.05)":"none", transition:"background 0.12s" }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                <td style={{ padding:"11px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:`${avatarColor[w.trade]||"#00a8f0"}25`, border:`1px solid ${avatarColor[w.trade]||"#00a8f0"}40`, display:"flex", alignItems:"center", justifyContent:"center", color:avatarColor[w.trade]||"#00a8f0", fontSize:11, fontWeight:700, flexShrink:0 }}>{w.name.charAt(0)}</div>
                    <span style={{ fontSize:13, fontWeight:500 }}>{w.name}</span>
                  </div>
                </td>
                <td style={{ padding:"11px 16px", fontSize:13, color:"rgba(255,255,255,0.5)" }}>{w.role}</td>
                <td style={{ padding:"11px 16px" }}><span style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.45)", fontSize:11, padding:"2px 8px", borderRadius:4, fontFamily:M }}>{w.trade}</span></td>
                <td style={{ padding:"11px 16px" }}>
                  <span style={{ color:statusColor[w.status], fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:statusColor[w.status], display:"inline-block", boxShadow:w.status==="On Site"?"0 0 5px #22d3a0":"none" }}/>
                    {w.status}
                  </span>
                </td>
                <td style={{ padding:"11px 16px", fontSize:13, fontFamily:M, color:w.hours>0?"#f0f4f8":"rgba(255,255,255,0.2)" }}>{w.hours}h</td>
                <td style={{ padding:"11px 16px", fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:M }}>{w.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
