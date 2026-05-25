import { useState, useEffect } from "react";
import type { AppState } from "../../App";
import { getDashboard, getRFIs, getChangeOrders, getObligations } from "../../api/client";

const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const riskColor = (l: string) => l==="High"||l==="Critical" ? "#f43f5e" : l==="Medium" ? "#f59e0b" : "#22d3a0";

// ── Tooltip component ─────────────────────────────────────────────────────────
function Tooltip({ children, tip }: { children: React.ReactNode; tip: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:"relative", display:"inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position:"absolute", bottom:"calc(100% + 8px)", left:"50%", transform:"translateX(-50%)",
          background:"#0f1623", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8,
          padding:"8px 12px", zIndex:100, pointerEvents:"none", whiteSpace:"nowrap",
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)", minWidth:140,
        }}>
          {tip}
          <div style={{ position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:"5px solid rgba(255,255,255,0.12)" }}/>
        </div>
      )}
    </div>
  );
}

// ── Bar with hover tooltip ────────────────────────────────────────────────────
function HoverBar({ planned, actual, month, max }: { planned:number; actual:number; month:string; max:number }) {
  const [hovered, setHovered] = useState<"planned"|"actual"|null>(null);
  const variance = actual - planned;
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ width:"100%", display:"flex", gap:2, alignItems:"flex-end", height:120, position:"relative" }}>
        {/* Planned bar */}
        <div style={{ flex:1, position:"relative" }}
          onMouseEnter={() => setHovered("planned")} onMouseLeave={() => setHovered(null)}>
          <div style={{ background: hovered==="planned" ? "rgba(0,168,240,0.4)" : "rgba(0,168,240,0.2)", borderRadius:"3px 3px 0 0", height:`${(planned/max)*100}%`, transition:"background 0.15s", cursor:"default" }}/>
          {hovered==="planned" && (
            <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)", background:"#0f1623", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"6px 10px", zIndex:100, whiteSpace:"nowrap", fontSize:11, fontFamily:M }}>
              <div style={{ color:"rgba(255,255,255,0.5)", marginBottom:2 }}>Planned</div>
              <div style={{ color:"#38bfff", fontWeight:700 }}>${planned.toLocaleString()}K</div>
            </div>
          )}
        </div>
        {/* Actual bar */}
        <div style={{ flex:1, position:"relative" }}
          onMouseEnter={() => setHovered("actual")} onMouseLeave={() => setHovered(null)}>
          <div style={{ background: hovered==="actual" ? "#38bfff" : "#00a8f0", borderRadius:"3px 3px 0 0", height:`${(actual/max)*100}%`, opacity:0.9, transition:"background 0.15s", cursor:"default" }}/>
          {hovered==="actual" && (
            <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)", background:"#0f1623", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"6px 10px", zIndex:100, whiteSpace:"nowrap", fontSize:11, fontFamily:M }}>
              <div style={{ color:"rgba(255,255,255,0.5)", marginBottom:2 }}>Actual</div>
              <div style={{ color:"#00a8f0", fontWeight:700 }}>${actual.toLocaleString()}K</div>
              <div style={{ color: variance > 0 ? "#f43f5e" : "#22d3a0", marginTop:2 }}>
                {variance > 0 ? "▲" : "▼"} ${Math.abs(variance)}K vs plan
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>{month}</div>
    </div>
  );
}

// ── Schedule phase row ────────────────────────────────────────────────────────
function SchedulePhaseRow({ phase, variance, color, tip }: { phase:string; variance:number; color:string; tip:string }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, position:"relative", cursor:"default" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ width:76, fontSize:12, color: hov ? "#f0f4f8" : "rgba(255,255,255,0.5)", flexShrink:0, transition:"color 0.15s" }}>{phase}</div>
      <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.07)", borderRadius:3, position:"relative" }}>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1, background:"rgba(255,255,255,0.15)" }}/>
        <div style={{ position:"absolute", height:"100%", borderRadius:3, background:color, left:variance<0?`${50+variance*8}%`:"50%", width:`${Math.abs(variance)*8+2}%`, transition:"width 0.4s" }}/>
      </div>
      <div style={{ width:40, fontSize:11, fontFamily:"'JetBrains Mono',monospace", color, textAlign:"right" as const }}>{variance>0?"+":""}{variance}d</div>
      {hov && (
        <div style={{ position:"absolute", left:80, top:-36, background:"#0f1623", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"5px 10px", zIndex:100, fontSize:11, whiteSpace:"nowrap", fontFamily:"'JetBrains Mono',monospace" }}>
          <span style={{ color:"rgba(255,255,255,0.4)" }}>{tip}</span>
        </div>
      )}
    </div>
  );
}

// ── Scenario bar ──────────────────────────────────────────────────────────────
function ScenarioBar({ label, val, color }: { label:string; val:number; color:string }) {
  const [h, setH] = useState(false);
  const hoverColor = color.replace("0.3","0.5").replace("0.4","0.6");
  return (
    <div style={{ flex:1, background: h ? hoverColor : color, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", cursor:"default", transition:"background 0.15s" }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div style={{ fontSize:11, fontWeight:700, color:"#f0f4f8" }}>${(val/1e6).toFixed(2)}M</div>
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontFamily:"'JetBrains Mono',monospace" }}>{label}</div>
    </div>
  );
}

// ── Hoverable progress bar ────────────────────────────────────────────────────
function HoverProgressBar({ label, value, pct, color, tip }: { label:string; value:string|number; pct:number; color:string; tip:string }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ marginBottom:14, position:"relative" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>{label}</span>
        <span style={{ fontSize:11, fontFamily:M, color }}>{value}</span>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.07)", borderRadius:3, cursor:"default" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 0.4s ease" }}/>
      </div>
      {hov && (
        <div style={{ position:"absolute", top:-38, right:0, background:"#0f1623", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"5px 10px", zIndex:100, fontSize:11, fontFamily:M, whiteSpace:"nowrap" }}>
          <span style={{ color:"rgba(255,255,255,0.5)" }}>{tip}</span>
        </div>
      )}
    </div>
  );
}

export default function Analytics({ appState }: { appState: AppState }) {
  // ── Live data ───────────────────────────────────────────────────────────────
  const [liveKPIs, setLiveKPIs] = useState<any>(null);
  const [liveWorkforce, setLiveWorkforce] = useState<any[]>([]);
  const [liveRFICauses, setLiveRFICauses] = useState<any[]>([]);

  useEffect(() => {
    if (!appState.sessionId) return;
    const load = async () => {
      try {
        const [db, rfis, cos] = await Promise.allSettled([
          getDashboard(appState.sessionId!),
          getRFIs(appState.sessionId!),
          getChangeOrders(appState.sessionId!),
        ]);
        const dashboard = db.status === "fulfilled" ? db.value : null;
        const rfiList: any[] = rfis.status === "fulfilled" ? (rfis.value || []) : [];
        const coList: any[]  = cos.status === "fulfilled"  ? (cos.value  || []) : [];

        const facts = dashboard?.facts || dashboard || {};
        const budget = parseFloat((facts.project_value || "$0").replace(/[$,M]/g,"")) * (facts.project_value?.includes("M") ? 1e6 : 1);
        const openRFIs = rfiList.filter((r:any) => r.status === "Open").length;
        const avgDays = rfiList.length ? Math.round(rfiList.reduce((a:number, r:any) => a + (r.days_open || 0), 0) / rfiList.length) : 0;
        const pendingCOs = coList.filter((c:any) => c.status === "Pending");
        const coExposure = pendingCOs.reduce((a:number, c:any) => a + (c.amount || c.cost_impact || 0), 0);

        if (facts.project_value || rfiList.length || coList.length) {
          setLiveKPIs({
            budget: facts.project_value || "$—",
            openRFIs,
            totalRFIs: rfiList.length,
            avgRFIDays: avgDays || "—",
            coExposure: coExposure ? `$${(coExposure/1000).toFixed(0)}K` : "$—",
            pendingCOs: pendingCOs.length,
          });
        }

        // RFI causes from live data
        if (rfiList.length > 0) {
          const tradeCount: Record<string,number> = {};
          rfiList.forEach((r:any) => {
            const t = r.trade || r.assigned_to || "General";
            tradeCount[t] = (tradeCount[t] || 0) + 1;
          });
          const total = rfiList.length;
          const colors = ["#f59e0b","#38bfff","#a78bfa","#22d3a0","#f43f5e","#fbbf24"];
          const causes = Object.entries(tradeCount)
            .sort((a,b) => b[1]-a[1])
            .slice(0,4)
            .map(([label,count],i) => ({ label, pct: Math.round((count/total)*100), count, color:colors[i] }));
          setLiveRFICauses(causes);
        }
      } catch (e) { /* keep demo */ }
    };
    load();
  }, [appState.sessionId, appState.projectBuilt]);

  // ── Static demo data (shown when no live data) ────────────────────────────
  const bars = [
    { month:"Oct", planned:820,  actual:790  },
    { month:"Nov", planned:950,  actual:910  },
    { month:"Dec", planned:1100, actual:1050 },
    { month:"Jan", planned:1200, actual:1180 },
    { month:"Feb", planned:1350, actual:1290 },
    { month:"Mar", planned:1400, actual:1210 },
  ];
  const max = 1500;

  const kpis = [
    { label:"Total Budget",     value: liveKPIs?.budget      || "$11.4M",   sub:"Contract value",                           color:"#f0f4f8" },
    { label:"Open RFIs",        value: liveKPIs ? String(liveKPIs.openRFIs) : "7",       sub: liveKPIs ? `of ${liveKPIs.totalRFIs} total` : "of 12 total", color:"#38bfff" },
    { label:"CO Exposure",      value: liveKPIs?.coExposure  || "$284K",    sub: liveKPIs ? `${liveKPIs.pendingCOs} pending` : "5 pending COs", color:"#f59e0b" },
    { label:"Avg RFI Response", value: liveKPIs ? `${liveKPIs.avgRFIDays}d` : "3.2d", sub:"Target: 2 days",                color:"#a78bfa" },
    { label:"Safety Incidents", value:"0",                                   sub:"Last 30 days",                            color:"#22d3a0" },
    { label:"Data Source",      value: liveKPIs ? "Live" : "Demo",           sub: liveKPIs ? "From your session" : "Upload docs to see live data", color: liveKPIs ? "#22d3a0" : "#64748b" },
  ];

  const rfiByCause = liveRFICauses.length > 0 ? liveRFICauses : [
    { label:"Drawing conflicts", pct:38, count:5, color:"#f59e0b" },
    { label:"Spec ambiguity",    pct:27, count:3, color:"#38bfff" },
    { label:"Owner changes",     pct:19, count:2, color:"#a78bfa" },
    { label:"Site conditions",   pct:16, count:2, color:"#22d3a0" },
  ];

  const demoWorkforce = [
    { trade:"Concrete", count:12, color:"#22d3a0", tip:"Slab and foundation pours" },
    { trade:"Rebar",    count:8,  color:"#38bfff", tip:"Reinforcement installation" },
    { trade:"Formwork", count:10, color:"#a78bfa", tip:"Formwork erection and strip" },
    { trade:"MEP",      count:9,  color:"#f59e0b", tip:"Mechanical, electrical, plumbing" },
    { trade:"HSE",      count:3,  color:"#f43f5e", tip:"Health, safety & environment" },
    { trade:"Civil",    count:5,  color:"#fbbf24", tip:"Civil works and drainage" },
  ];
  const workforce = liveWorkforce.length > 0 ? liveWorkforce : demoWorkforce;
  const maxWorkers = Math.max(...workforce.map(w => w.count), 1);

  const schedulePhases = [
    { phase:"Foundation", variance:-2, color:"#f43f5e", tip:"2 days behind — concrete pour delayed" },
    { phase:"Structure",  variance:0,  color:"#22d3a0", tip:"On schedule" },
    { phase:"MEP",        variance:1,  color:"#22d3a0", tip:"1 day ahead — prefab units arrived early" },
    { phase:"Envelope",   variance:0,  color:"#22d3a0", tip:"On schedule" },
    { phase:"Finishing",  variance:-1, color:"#f59e0b", tip:"1 day behind — paint delivery delayed" },
  ];

  // ── AI state ────────────────────────────────────────────────────────────────
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult]   = useState<any>(null);
  const [forecastError, setForecastError]     = useState("");
  const [budget, setBudget]   = useState(liveKPIs?.budget?.replace(/[$,M]/g,"") || "11400000");
  const [spent, setSpent]     = useState("7800000");
  const [pctDone, setPctDone] = useState("68");

  const [delayLoading, setDelayLoading] = useState(false);
  const [delayResult, setDelayResult]   = useState<any>(null);
  const [delayError, setDelayError]     = useState("");

  const runCostForecast = async () => {
    setForecastLoading(true); setForecastError(""); setForecastResult(null);
    try {
      const res = await fetch(`${API_BASE}/construction/cost-forecast`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id:appState.sessionId, budget:parseFloat(budget), spent:parseFloat(spent), pct_complete:parseFloat(pctDone) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Forecast failed");
      setForecastResult(data);
    } catch (e: any) { setForecastError(e.message ?? "Failed"); }
    finally { setForecastLoading(false); }
  };

  const runDelayPredict = async () => {
    setDelayLoading(true); setDelayError(""); setDelayResult(null);
    try {
      const res = await fetch(`${API_BASE}/construction/predict-delays`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id:appState.sessionId, question:"" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Prediction failed");
      setDelayResult(data);
    } catch (e: any) { setDelayError(e.message ?? "Failed"); }
    finally { setDelayLoading(false); }
  };

  const inp: React.CSSProperties = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"7px 10px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", width:"100%" };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Analytics</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M }}>{appState.projectName||"All projects"} · Last 6 months</p>
        </div>
        {liveKPIs && (
          <div style={{ fontSize:11, color:"#22d3a0", background:"rgba(34,211,160,0.1)", border:"1px solid rgba(34,211,160,0.2)", borderRadius:20, padding:"4px 12px", fontFamily:M }}>
            ● Live data from session
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:24 }}>
        {kpis.map(k => (
          <Tooltip key={k.label} tip={
            <div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginBottom:3, fontFamily:M }}>{k.label.toUpperCase()}</div>
              <div style={{ color:k.color, fontWeight:700 }}>{k.value}</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:2 }}>{k.sub}</div>
            </div>
          }>
            <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px", cursor:"default", transition:"border-color 0.15s", width:"100%" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(255,255,255,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor="rgba(255,255,255,0.07)")}>
              <div style={{ fontSize:20, fontWeight:700, color:k.color, letterSpacing:"-0.03em", lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", marginTop:6 }}>{k.label}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:M, marginTop:2 }}>{k.sub}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

        {/* Cost burn chart */}
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Monthly Cost Burn</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>Planned vs Actual ($K) — hover bars for details</div>
          <div style={{ display:"flex", gap:10, alignItems:"flex-end", height:140 }}>
            {bars.map(b => <HoverBar key={b.month} {...b} max={max} />)}
          </div>
          <div style={{ display:"flex", gap:16, marginTop:12 }}>
            {[{c:"rgba(0,168,240,0.2)",l:"Planned"},{c:"#00a8f0",l:"Actual"}].map(l => (
              <div key={l.l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:l.c }}/>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{l.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RFI causes */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>RFI Root Causes</div>
            {liveRFICauses.length > 0 && <span style={{ fontSize:10, color:"#22d3a0", fontFamily:M }}>● live</span>}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>By category — hover for count</div>
          {rfiByCause.map(r => (
            <HoverProgressBar key={r.label} label={r.label} value={`${r.pct}%`} pct={r.pct} color={r.color}
              tip={`${r.count ?? "—"} RFIs · ${r.pct}% of total`} />
          ))}
        </div>

        {/* Schedule variance */}
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Schedule Variance</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>Days ahead/behind per phase — hover for details</div>
          {schedulePhases.map(s => (
            <SchedulePhaseRow key={s.phase} {...s} />
          ))}
        </div>

        {/* Workforce */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Workforce by Trade</div>
            {liveWorkforce.length > 0 && <span style={{ fontSize:10, color:"#22d3a0", fontFamily:M }}>● live</span>}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>
            Current headcount · total {workforce.reduce((a,w) => a+w.count, 0)} workers — hover for details
          </div>
          {workforce.map(w => (
            <HoverProgressBar key={w.trade} label={w.trade} value={w.count} pct={(w.count/maxWorkers)*100} color={w.color}
              tip={w.tip || `${w.count} workers on site`} />
          ))}
        </div>
      </div>

      {/* ── AI COST FORECASTER ── */}
      <div style={{ ...card, marginBottom:16, borderColor:"rgba(0,168,240,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, fontWeight:700, background:"rgba(0,168,240,0.15)", color:"#38bfff", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
              Cost Forecast — Estimate at Completion
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>AI predicts final cost based on current CPI, burn rate, and project risks</div>
          </div>
          <button onClick={runCostForecast} disabled={forecastLoading} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:forecastLoading?"rgba(0,168,240,0.3)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:13, fontWeight:600, cursor:forecastLoading?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {forecastLoading ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Forecasting...</> : "Run AI Forecast"}
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12, marginBottom:forecastResult ? 20 : 0, alignItems:"end" }}>
          {[{label:"Total Budget ($)",val:budget,set:setBudget},{label:"Spent to Date ($)",val:spent,set:setSpent}].map(f => (
            <div key={f.label}>
              <label style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, display:"block", marginBottom:5, letterSpacing:"0.08em" }}>{f.label.toUpperCase()}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)} style={inp}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, display:"block", marginBottom:5, letterSpacing:"0.08em" }}>% COMPLETE</label>
            <input value={pctDone} onChange={e => setPctDone(e.target.value)} style={inp}/>
          </div>
          <Tooltip tip={<div style={{ fontFamily:M }}>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginBottom:2 }}>CPI FORMULA</div>
            <div style={{ color:"#38bfff" }}>EV ÷ AC</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:2 }}>&lt;1 = over budget</div>
          </div>}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:M, paddingBottom:8, cursor:"default" }}>
              CPI: <span style={{ color: (parseFloat(budget)*(parseFloat(pctDone)/100)/parseFloat(spent)) >= 1 ? "#22d3a0" : "#f43f5e", fontWeight:700 }}>
                {spent && pctDone ? (parseFloat(budget)*(parseFloat(pctDone)/100)/parseFloat(spent)).toFixed(2) : "—"}
              </span>
            </div>
          </Tooltip>
        </div>
        {forecastError && <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:12 }}>{forecastError}</div>}
        {forecastResult && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              {[
                { label:"EAC",        value:`$${(forecastResult.estimate_at_completion/1e6).toFixed(2)}M`, color:forecastResult.variance_at_completion>0?"#f43f5e":"#22d3a0", tip:"Estimate at Completion" },
                { label:"Variance",   value:`${forecastResult.variance_at_completion>0?"+":""}$${(forecastResult.variance_at_completion/1000).toFixed(0)}K`, color:forecastResult.variance_at_completion>0?"#f43f5e":"#22d3a0", tip:"EAC minus original budget" },
                { label:"CPI",        value:String(forecastResult.cpi), color:forecastResult.cpi>=1?"#22d3a0":"#f43f5e", tip:"Cost Performance Index (>1 = under budget)" },
                { label:"Confidence", value:forecastResult.forecast_confidence, color:"#38bfff", tip:"AI forecast confidence" },
              ].map(s => (
                <Tooltip key={s.label} tip={<div style={{ fontFamily:M }}>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginBottom:2 }}>{s.tip}</div>
                  <div style={{ color:s.color, fontWeight:700 }}>{s.value}</div>
                </div>}>
                  <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px", cursor:"default", width:"100%" }}>
                    <div style={{ fontSize:18, fontWeight:700, color:s.color, letterSpacing:"-0.02em" }}>{s.value}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4, fontFamily:M }}>{s.label}</div>
                  </div>
                </Tooltip>
              ))}
            </div>
            {forecastResult.scenarios && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:8, letterSpacing:"0.08em" }}>SCENARIO RANGE</div>
                <div style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden", height:36 }}>
                  <ScenarioBar label="Optimistic"  val={forecastResult.scenarios.optimistic}  color="rgba(34,211,160,0.3)" />
                  <ScenarioBar label="Most Likely" val={forecastResult.scenarios.most_likely}  color="rgba(0,168,240,0.4)"  />
                  <ScenarioBar label="Pessimistic" val={forecastResult.scenarios.pessimistic} color="rgba(244,63,94,0.3)"  />
                </div>
              </div>
            )}
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65, marginBottom:12 }}>{forecastResult.summary}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {forecastResult.drivers?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.08em", marginBottom:6 }}>COST DRIVERS</div>
                  {forecastResult.drivers.map((d: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", padding:"3px 0" }}>• {d}</div>)}
                </div>
              )}
              {forecastResult.cost_reduction_opportunities?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:"rgba(34,211,160,0.7)", fontFamily:M, letterSpacing:"0.08em", marginBottom:6 }}>REDUCTION OPPORTUNITIES</div>
                  {forecastResult.cost_reduction_opportunities.map((d: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", padding:"3px 0" }}>→ {d}</div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── AI PREDICTIVE DELAY RISK ── */}
      <div style={{ ...card, borderColor:"rgba(244,63,94,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, fontWeight:700, background:"rgba(244,63,94,0.15)", color:"#f43f5e", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
              Predictive Delay Risk
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>AI analyzes schedule, RFIs, and project documents to predict delay probability per phase</div>
          </div>
          <button onClick={runDelayPredict} disabled={delayLoading} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:delayLoading?"rgba(244,63,94,0.3)":"linear-gradient(135deg,#f43f5e,#b91c3b)", color:"#fff", fontSize:13, fontWeight:600, cursor:delayLoading?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {delayLoading ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Predicting...</> : "Predict Delays"}
          </button>
        </div>
        {delayError && <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:12 }}>{delayError}</div>}
        {!delayResult && !delayLoading && (
          <div style={{ padding:"32px 0", textAlign:"center" as const, color:"rgba(255,255,255,0.2)", fontSize:13 }}>Click "Predict Delays" to run AI schedule risk analysis on your project</div>
        )}
        {delayLoading && (
          <div style={{ padding:"32px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:12, color:"rgba(255,255,255,0.4)", fontSize:13 }}>
            <div style={{ width:20, height:20, borderRadius:"50%", border:"2px solid rgba(244,63,94,0.2)", borderTopColor:"#f43f5e", animation:"spin 0.8s linear infinite" }}/>
            Analyzing schedule risk factors...
          </div>
        )}
        {delayResult && !delayLoading && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
              {[
                { label:"Overall Risk",      value:delayResult.overall_delay_risk,            color:riskColor(delayResult.overall_delay_risk), tip:"Aggregate risk across all phases" },
                { label:"Predicted Delay",   value:`${delayResult.predicted_delay_days} days`, color:"#f59e0b", tip:"Expected delay at project completion" },
                { label:"Confidence",        value:delayResult.confidence,                    color:"#38bfff", tip:"AI model confidence in this prediction" },
              ].map(s => (
                <Tooltip key={s.label} tip={<div style={{ fontFamily:M }}>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginBottom:2 }}>{s.tip}</div>
                  <div style={{ color:s.color, fontWeight:700 }}>{s.value}</div>
                </div>}>
                  <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px", cursor:"default", width:"100%" }}>
                    <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4, fontFamily:M }}>{s.label}</div>
                  </div>
                </Tooltip>
              ))}
            </div>
            {delayResult.phases?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.08em", marginBottom:10 }}>PHASE DELAY PROBABILITY</div>
                {delayResult.phases.map((ph: any, i: number) => (
                  <HoverProgressBar key={i} label={ph.name} value={`${ph.delay_probability}%`} pct={ph.delay_probability} color={riskColor(ph.risk_level)}
                    tip={ph.risk_factors?.join(" · ") || ph.recommendation || ph.risk_level} />
                ))}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {delayResult.early_warnings?.length > 0 && (
                <div style={{ background:"rgba(244,63,94,0.05)", border:"1px solid rgba(244,63,94,0.12)", borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:10, color:"rgba(244,63,94,0.8)", fontFamily:M, letterSpacing:"0.08em", marginBottom:8 }}>EARLY WARNINGS</div>
                  {delayResult.early_warnings.map((w: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", padding:"3px 0" }}>⚠ {w}</div>)}
                </div>
              )}
              {delayResult.recovery_actions?.length > 0 && (
                <div style={{ background:"rgba(34,211,160,0.05)", border:"1px solid rgba(34,211,160,0.12)", borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:10, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.08em", marginBottom:8 }}>RECOVERY ACTIONS</div>
                  {delayResult.recovery_actions.map((a: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", padding:"3px 0" }}>→ {a}</div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
