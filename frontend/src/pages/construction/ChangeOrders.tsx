import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";

type Assessment = {
  in_scope: string; cost_reasonable: string; risk_level: string;
  recommendation: string; key_points: string[]; negotiation_target: number | null;
};
type CO = {
  id: string; title: string; description: string; submitted_by: string;
  date_submitted: string; cost_impact: number; schedule_impact: number;
  category: string; status: "Pending" | "Approved" | "Rejected";
  ai_assessment: Assessment | null;
};

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Pending:  { bg:"rgba(245,158,11,0.1)",  text:"#f59e0b", border:"rgba(245,158,11,0.25)" },
  Approved: { bg:"rgba(34,211,160,0.1)",  text:"#22d3a0", border:"rgba(34,211,160,0.25)" },
  Rejected: { bg:"rgba(244,63,94,0.1)",   text:"#f43f5e", border:"rgba(244,63,94,0.25)" },
};
const RISK_COLOR: Record<string, string> = { Low:"#22d3a0", Medium:"#f59e0b", High:"#f43f5e" };
const REC_COLOR: Record<string, string>  = { Approve:"#22d3a0", Negotiate:"#f59e0b", Reject:"#f43f5e" };
const CATEGORIES = ["Extra Work","Design Change","Unforeseen Conditions","Owner Directed","Errors & Omissions","Acceleration","Other"];
const today = () => new Date().toISOString().split("T")[0];

function fmt(n: number) { return n >= 0 ? `+$${n.toLocaleString()}` : `-$${Math.abs(n).toLocaleString()}`; }

export default function ChangeOrders({ appState }: { appState: AppState }) {
  const [cos, setCos] = useState<CO[]>([]);
  const [filter, setFilter] = useState<"All"|"Pending"|"Approved"|"Rejected">("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assessing, setAssessing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [contractValue, setContractValue] = useState(4200000);
  const [showContractEdit, setShowContractEdit] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", cost_impact:"", schedule_impact:"", category:"Extra Work" });

  useEffect(() => { load(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    const r = await fetch(`${API}/construction/co-register/${appState.sessionId}`).catch(() => null);
    if (r?.ok) setCos(await r.json());
  };

  const createCO = async () => {
    if (!form.title.trim()) return;
    const r = await fetch(`${API}/construction/co-register/create`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ session_id: appState.sessionId, ...form, cost_impact: parseFloat(form.cost_impact)||0, schedule_impact: parseInt(form.schedule_impact)||0, date_submitted: today(), submitted_by: appState.user?.name || "GC" }),
    });
    if (r.ok) { const created = await r.json(); setCos(prev => [...prev, created]); setShowModal(false); setForm({ title:"", description:"", cost_impact:"", schedule_impact:"", category:"Extra Work" }); }
  };

  const assess = async (co: CO) => {
    setAssessing(co.id);
    const r = await fetch(`${API}/construction/co-register/assess`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ session_id: appState.sessionId, title: co.title, description: co.description, cost_impact: co.cost_impact }),
    });
    if (r.ok) {
      const ai_assessment = await r.json();
      const u = await fetch(`${API}/construction/co-register/update`, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ session_id: appState.sessionId, id: co.id, ai_assessment }) });
      if (u.ok) { const updated = await u.json(); setCos(prev => prev.map(x => x.id === updated.id ? updated : x)); setExpanded(co.id); }
    }
    setAssessing(null);
  };

  const updateStatus = async (co: CO, status: "Approved"|"Rejected") => {
    const r = await fetch(`${API}/construction/co-register/update`, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ session_id: appState.sessionId, id: co.id, status }) });
    if (r.ok) { const updated = await r.json(); setCos(prev => prev.map(x => x.id === updated.id ? updated : x)); }
  };

  const filtered = cos.filter(c => filter === "All" || c.status === filter);
  const approved = cos.filter(c => c.status === "Approved").reduce((a, c) => a + c.cost_impact, 0);
  const pending  = cos.filter(c => c.status === "Pending").reduce((a, c) => a + c.cost_impact, 0);
  const rejected = cos.filter(c => c.status === "Rejected").reduce((a, c) => a + c.cost_impact, 0);
  const revised  = contractValue + approved;
  const pctChange = ((approved / contractValue) * 100).toFixed(2);

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .co-row:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#22d3a0,#065f46)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#fff"/></svg>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>Change Order Register</h1>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Track all COs, budget exposure, and AI-driven assessments.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"linear-gradient(135deg,#22d3a0,#065f46)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 0 20px rgba(34,211,160,0.25)", fontFamily:F }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          New Change Order
        </button>
      </div>

      {/* Contract Value Waterfall */}
      <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em" }}>CONTRACT VALUE TRACKER</span>
          <button onClick={() => setShowContractEdit(!showContractEdit)} style={{ fontSize:11, fontFamily:M, color:"rgba(0,168,240,0.7)", background:"none", border:"none", cursor:"pointer" }}>
            {showContractEdit ? "Done" : "Edit Original"}
          </button>
        </div>
        {showContractEdit && (
          <div style={{ marginBottom:16 }}>
            <input type="number" value={contractValue} onChange={e => setContractValue(Number(e.target.value))} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(0,168,240,0.3)", borderRadius:7, padding:"8px 12px", color:"#f0f4f8", fontSize:13, fontFamily:M, outline:"none", width:200 }}/>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginLeft:8 }}>original contract value</span>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
          {[
            { label:"Original Contract", value:contractValue, color:"#38bfff", bg:"rgba(0,168,240,0.1)", border:"rgba(0,168,240,0.2)" },
            { label:"Approved COs", value:approved, color:"#22d3a0", bg:"rgba(34,211,160,0.1)", border:"rgba(34,211,160,0.2)", sign:true },
            { label:"Pending Exposure", value:pending, color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)", sign:true },
            { label:"Revised Contract", value:revised, color:"#f0f4f8", bg:"rgba(255,255,255,0.05)", border:"rgba(255,255,255,0.12)", bold:true },
          ].map((item, i) => (
            <div key={item.label} style={{ flex:1, background:item.bg, border:`1px solid ${item.border}`, borderRadius:i===0?"10px 0 0 10px":i===3?"0 10px 10px 0":"0", borderLeft:i>0?"none":"", padding:"14px 16px" }}>
              <div style={{ fontSize:9, fontFamily:M, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em", marginBottom:6 }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize:18, fontWeight:item.bold?800:700, color:item.color, letterSpacing:"-0.02em" }}>
                {item.sign && item.value !== 0 ? (item.value > 0 ? "+" : "") : ""}${Math.abs(item.value).toLocaleString()}
              </div>
              {item.sign && <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:3, fontFamily:M }}>{item.value >= 0 ? `+${((item.value/contractValue)*100).toFixed(1)}%` : `${((item.value/contractValue)*100).toFixed(1)}%`} of original</div>}
              {item.bold && approved !== 0 && <div style={{ fontSize:10, color: Number(pctChange)>5?"#f43f5e":Number(pctChange)>2?"#f59e0b":"#22d3a0", marginTop:3, fontFamily:M, fontWeight:600 }}>{pctChange > "0" ? "+" : ""}{pctChange}% variance</div>}
            </div>
          ))}
        </div>

        {/* Visual bar */}
        <div style={{ marginTop:16, height:6, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${Math.min((contractValue/(contractValue+Math.max(approved+pending,0)))*100,100)}%`, background:"#38bfff", borderRadius:"3px 0 0 3px", transition:"width 600ms ease" }}/>
          <div style={{ width:`${Math.min((approved/(contractValue+Math.max(approved+pending,0)))*100,100)}%`, background:"#22d3a0" }}/>
          <div style={{ width:`${Math.min((pending/(contractValue+Math.max(approved+pending,0)))*100,100)}%`, background:"#f59e0b", borderRadius:"0 3px 3px 0" }}/>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:8 }}>
          {[["#38bfff","Original"],["#22d3a0","Approved"],["#f59e0b","Pending"],["#f43f5e","Rejected"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total COs", value:cos.length, color:"#f0f4f8" },
          { label:"Approved", value:`$${approved.toLocaleString()}`, color:"#22d3a0", sub:`${cos.filter(c=>c.status==="Approved").length} COs` },
          { label:"Pending Exposure", value:`$${pending.toLocaleString()}`, color:"#f59e0b", sub:`${cos.filter(c=>c.status==="Pending").length} awaiting decision` },
          { label:"Rejected", value:`$${Math.abs(rejected).toLocaleString()}`, color:"#f43f5e", sub:`${cos.filter(c=>c.status==="Rejected").length} COs` },
        ].map(s => (
          <div key={s.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, letterSpacing:"-0.02em" }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:3 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {(["All","Pending","Approved","Rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"7px 14px", borderRadius:7, border:filter===f?"1px solid rgba(34,211,160,0.3)":"1px solid rgba(255,255,255,0.08)", background:filter===f?"rgba(34,211,160,0.1)":"transparent", color:filter===f?"#22d3a0":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:filter===f?600:400, cursor:"pointer", fontFamily:F, transition:"all 150ms" }}>
            {f} {f!=="All" && <span style={{ opacity:0.6 }}>({cos.filter(c=>c.status===f).length})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 140px 110px 90px 110px 110px 160px", gap:12, padding:"11px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>
          {["CO #","Title","Category","Cost Impact","Schedule","Status","AI Risk","Actions"].map(h => (
            <div key={h} style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:"48px 20px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>
            {cos.length === 0 ? "No change orders yet — add your first above." : "No COs match this filter."}
          </div>
        ) : filtered.map((co, i) => {
          const ss = STATUS_STYLE[co.status];
          const isExpanded = expanded === co.id;
          return (
            <div key={co.id} style={{ borderBottom: i<filtered.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div className="co-row" style={{ display:"grid", gridTemplateColumns:"80px 1fr 140px 110px 90px 110px 110px 160px", gap:12, padding:"14px 20px", cursor:"pointer", transition:"background 150ms" }} onClick={() => setExpanded(isExpanded?null:co.id)}>
                <div style={{ fontFamily:M, fontSize:12, color:"#22d3a0", fontWeight:600 }}>{co.id}</div>
                <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{co.title}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:M }}>{co.category}</div>
                <div style={{ fontSize:13, fontWeight:700, color: co.cost_impact >= 0 ? "#f59e0b" : "#22d3a0", fontFamily:M }}>{fmt(co.cost_impact)}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontFamily:M }}>{co.schedule_impact > 0 ? `+${co.schedule_impact}d` : co.schedule_impact < 0 ? `${co.schedule_impact}d` : "—"}</div>
                <div><span style={{ fontSize:10, fontFamily:M, fontWeight:600, padding:"3px 8px", borderRadius:5, background:ss.bg, color:ss.text, border:`1px solid ${ss.border}` }}>{co.status.toUpperCase()}</span></div>
                <div>
                  {co.ai_assessment
                    ? <span style={{ fontSize:10, fontFamily:M, fontWeight:600, padding:"3px 8px", borderRadius:5, background:`${RISK_COLOR[co.ai_assessment.risk_level]}18`, color:RISK_COLOR[co.ai_assessment.risk_level], border:`1px solid ${RISK_COLOR[co.ai_assessment.risk_level]}30` }}>{co.ai_assessment.risk_level.toUpperCase()}</span>
                    : <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>—</span>}
                </div>
                <div style={{ display:"flex", gap:5, alignItems:"center" }} onClick={e => e.stopPropagation()}>
                  {co.status === "Pending" && (
                    <>
                      <button onClick={() => assess(co)} disabled={assessing===co.id} style={{ padding:"5px 8px", borderRadius:6, background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.25)", color:"#f59e0b", fontSize:10, fontFamily:M, cursor:"pointer" }}>
                        {assessing===co.id ? "…" : "AI Assess"}
                      </button>
                      <button onClick={() => updateStatus(co,"Approved")} style={{ padding:"5px 8px", borderRadius:6, background:"rgba(34,211,160,0.1)", border:"1px solid rgba(34,211,160,0.25)", color:"#22d3a0", fontSize:10, fontFamily:M, cursor:"pointer" }}>✓</button>
                      <button onClick={() => updateStatus(co,"Rejected")} style={{ padding:"5px 8px", borderRadius:6, background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.25)", color:"#f43f5e", fontSize:10, fontFamily:M, cursor:"pointer" }}>✕</button>
                    </>
                  )}
                  <svg style={{ color:"rgba(255,255,255,0.2)", transform:isExpanded?"rotate(180deg)":"none", transition:"transform 200ms" }} width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding:"0 20px 20px", animation:"fadeUp 0.2s ease" }}>
                  <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:16 }}>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65, margin:"0 0 12px" }}>{co.description || "No description."}</p>
                    {co.ai_assessment && (
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:14 }}>
                        <div style={{ fontSize:10, fontFamily:M, color:"rgba(245,158,11,0.7)", letterSpacing:"0.1em", marginBottom:12 }}>AI ASSESSMENT</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                          {[
                            {l:"In Scope",v:co.ai_assessment.in_scope, c:co.ai_assessment.in_scope==="Yes"?"#22d3a0":co.ai_assessment.in_scope==="No"?"#f43f5e":"#f59e0b"},
                            {l:"Cost Reasonable",v:co.ai_assessment.cost_reasonable, c:co.ai_assessment.cost_reasonable==="Yes"?"#22d3a0":co.ai_assessment.cost_reasonable==="No"?"#f43f5e":"#f59e0b"},
                            {l:"Risk Level",v:co.ai_assessment.risk_level, c:RISK_COLOR[co.ai_assessment.risk_level]},
                            {l:"Recommendation",v:co.ai_assessment.recommendation, c:REC_COLOR[co.ai_assessment.recommendation]||"#f0f4f8"},
                          ].map(item => (
                            <div key={item.l} style={{ background:`${item.c}10`, border:`1px solid ${item.c}25`, borderRadius:8, padding:"10px 12px" }}>
                              <div style={{ fontSize:9, fontFamily:M, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{item.l.toUpperCase()}</div>
                              <div style={{ fontSize:13, fontWeight:700, color:item.c }}>{item.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          {co.ai_assessment.key_points.map((pt, pi) => (
                            <div key={pi} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                              <span style={{ color:"#f59e0b", marginTop:2, flexShrink:0 }}>›</span>
                              <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>{pt}</span>
                            </div>
                          ))}
                        </div>
                        {co.ai_assessment.negotiation_target && (
                          <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, fontSize:12, color:"#f59e0b" }}>
                            Suggested negotiation target: <strong>${co.ai_assessment.negotiation_target.toLocaleString()}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New CO Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }} onClick={() => setShowModal(false)}>
          <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:32, width:540, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:"0 0 20px", letterSpacing:"-0.02em" }}>New Change Order</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[{k:"title",l:"CO Title",ph:"e.g. Unforeseen rock excavation at grid C-4"},{k:"description",l:"Description",ph:"Scope of work, cause, and impact…",multi:true}].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>{f.l.toUpperCase()}</label>
                  {f.multi
                    ? <textarea rows={3} value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                    : <input value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>}
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" }}>
                    {CATEGORIES.map(c => <option key={c} style={{ background:"#1c2535" }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>COST IMPACT ($)</label>
                  <input type="number" value={form.cost_impact} onChange={e => setForm(p => ({...p,cost_impact:e.target.value}))} placeholder="45000" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:M, outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>SCHEDULE (days)</label>
                  <input type="number" value={form.schedule_impact} onChange={e => setForm(p => ({...p,schedule_impact:e.target.value}))} placeholder="5" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:M, outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex:1, padding:"11px", borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", fontFamily:F }}>Cancel</button>
                <button onClick={createCO} style={{ flex:2, padding:"11px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#22d3a0,#065f46)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, boxShadow:"0 0 16px rgba(34,211,160,0.25)" }}>Create Change Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
