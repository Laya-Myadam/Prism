import { useState } from "react";
import type { AppState } from "../../App";

const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const riskColor = (level: string) => level === "High" ? "#f43f5e" : level === "Medium" ? "#f59e0b" : "#22d3a0";

export default function Analytics({ appState }: { appState: AppState }) {
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
    { label:"Total Budget",      value:"$11.4M",   sub:"Contract value",    color:"#f0f4f8" },
    { label:"Spent to Date",     value:"$7.8M",    sub:"68% utilized",      color:"#22d3a0" },
    { label:"CO Exposure",       value:"$284K",    sub:"5 pending COs",     color:"#f59e0b" },
    { label:"Forecast Overrun",  value:"$142K",    sub:"1.2% over budget",  color:"#f43f5e" },
    { label:"Avg RFI Response",  value:"3.2 days", sub:"Target: 2 days",    color:"#38bfff" },
    { label:"Safety Incidents",  value:"0",        sub:"Last 23 days",      color:"#22d3a0" },
  ];

  const rfiByCause = [
    { label:"Drawing conflicts", pct:38, color:"#f59e0b" },
    { label:"Spec ambiguity",    pct:27, color:"#38bfff" },
    { label:"Owner changes",     pct:19, color:"#a78bfa" },
    { label:"Site conditions",   pct:16, color:"#22d3a0" },
  ];

  // AI Cost Forecast state
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult]   = useState<any>(null);
  const [forecastError, setForecastError]     = useState("");
  const [budget, setBudget]   = useState("11400000");
  const [spent, setSpent]     = useState("7800000");
  const [pctDone, setPctDone] = useState("68");

  // Predictive Delay state
  const [delayLoading, setDelayLoading] = useState(false);
  const [delayResult, setDelayResult]   = useState<any>(null);
  const [delayError, setDelayError]     = useState("");

  const runCostForecast = async () => {
    setForecastLoading(true); setForecastError(""); setForecastResult(null);
    try {
      const res = await fetch(`${API_BASE}/construction/cost-forecast`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          session_id: appState.sessionId,
          budget: parseFloat(budget),
          spent: parseFloat(spent),
          pct_complete: parseFloat(pctDone),
        }),
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
        body: JSON.stringify({ session_id: appState.sessionId, question: "" }),
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
      <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Analytics</h1>
      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M, marginBottom:24 }}>{appState.projectName||"All projects"} · Last 6 months</p>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:20, fontWeight:700, color:k.color, letterSpacing:"-0.03em", lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", marginTop:6 }}>{k.label}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:M, marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Cost chart */}
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Monthly Cost Burn</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>Planned vs Actual ($K)</div>
          <div style={{ display:"flex", gap:10, alignItems:"flex-end", height:140 }}>
            {bars.map(b => (
              <div key={b.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", display:"flex", gap:2, alignItems:"flex-end", height:120 }}>
                  <div style={{ flex:1, background:"rgba(0,168,240,0.2)", borderRadius:"3px 3px 0 0", height:`${(b.planned/max)*100}%` }}/>
                  <div style={{ flex:1, background:"#00a8f0", borderRadius:"3px 3px 0 0", height:`${(b.actual/max)*100}%`, opacity:0.9 }}/>
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>{b.month}</div>
              </div>
            ))}
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
          <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>RFI Root Causes</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>By category this project</div>
          {rfiByCause.map(r => (
            <div key={r.label} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>{r.label}</span>
                <span style={{ fontSize:11, fontFamily:M, color:r.color }}>{r.pct}%</span>
              </div>
              <div style={{ height:5, background:"rgba(255,255,255,0.07)", borderRadius:3 }}>
                <div style={{ height:"100%", width:`${r.pct}%`, background:r.color, borderRadius:3 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule variance */}
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Schedule Variance</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>Days ahead/behind per phase</div>
          {[{phase:"Foundation",variance:-2,color:"#f43f5e"},{phase:"Structure",variance:0,color:"#22d3a0"},{phase:"MEP",variance:1,color:"#22d3a0"},{phase:"Envelope",variance:0,color:"#22d3a0"},{phase:"Finishing",variance:-1,color:"#f59e0b"}].map(s => (
            <div key={s.phase} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:76, fontSize:12, color:"rgba(255,255,255,0.5)", flexShrink:0 }}>{s.phase}</div>
              <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.07)", borderRadius:3, position:"relative" }}>
                <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1, background:"rgba(255,255,255,0.15)" }}/>
                <div style={{ position:"absolute", height:"100%", borderRadius:3, background:s.color, left:s.variance<0?`${50+s.variance*8}%`:"50%", width:`${Math.abs(s.variance)*8+2}%` }}/>
              </div>
              <div style={{ width:40, fontSize:11, fontFamily:M, color:s.color, textAlign:"right" as const }}>{s.variance>0?"+":""}{s.variance}d</div>
            </div>
          ))}
        </div>

        {/* Workforce */}
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Workforce by Trade</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:20 }}>Current headcount</div>
          {[{trade:"Concrete",count:12,color:"#22d3a0"},{trade:"Rebar",count:8,color:"#38bfff"},{trade:"Formwork",count:10,color:"#a78bfa"},{trade:"MEP",count:9,color:"#f59e0b"},{trade:"HSE",count:3,color:"#f43f5e"},{trade:"Civil",count:5,color:"#fbbf24"}].map(w => (
            <div key={w.trade} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:68, fontSize:12, color:"rgba(255,255,255,0.5)", flexShrink:0 }}>{w.trade}</div>
              <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3 }}>
                <div style={{ height:"100%", width:`${(w.count/12)*100}%`, background:w.color, borderRadius:3 }}/>
              </div>
              <div style={{ width:20, fontSize:11, fontFamily:M, color:w.color, textAlign:"right" as const }}>{w.count}</div>
            </div>
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

        {/* Inputs */}
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
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, paddingBottom:8 }}>CPI: {spent && pctDone ? (parseFloat(budget) * (parseFloat(pctDone)/100) / parseFloat(spent)).toFixed(2) : "—"}</div>
        </div>

        {forecastError && <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:12 }}>{forecastError}</div>}

        {forecastResult && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              {[
                { label:"EAC", value:`$${(forecastResult.estimate_at_completion/1e6).toFixed(2)}M`, color: forecastResult.variance_at_completion > 0 ? "#f43f5e" : "#22d3a0" },
                { label:"Variance", value:`${forecastResult.variance_at_completion > 0 ? "+" : ""}$${(forecastResult.variance_at_completion/1000).toFixed(0)}K`, color: forecastResult.variance_at_completion > 0 ? "#f43f5e" : "#22d3a0" },
                { label:"CPI", value:String(forecastResult.cpi), color: forecastResult.cpi >= 1 ? "#22d3a0" : "#f43f5e" },
                { label:"Confidence", value:forecastResult.forecast_confidence, color:"#38bfff" },
              ].map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:18, fontWeight:700, color:s.color, letterSpacing:"-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4, fontFamily:M }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Scenario range */}
            {forecastResult.scenarios && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:8, letterSpacing:"0.08em" }}>SCENARIO RANGE</div>
                <div style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden", height:32 }}>
                  {[
                    { label:"Optimistic", val:forecastResult.scenarios.optimistic, color:"rgba(34,211,160,0.3)" },
                    { label:"Most Likely", val:forecastResult.scenarios.most_likely, color:"rgba(0,168,240,0.4)" },
                    { label:"Pessimistic", val:forecastResult.scenarios.pessimistic, color:"rgba(244,63,94,0.3)" },
                  ].map(s => (
                    <div key={s.label} style={{ flex:1, background:s.color, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#f0f4f8" }}>${(s.val/1e6).toFixed(2)}M</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontFamily:M }}>{s.label}</div>
                    </div>
                  ))}
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
            {/* Overview */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
              {[
                { label:"Overall Risk", value:delayResult.overall_delay_risk, color:riskColor(delayResult.overall_delay_risk) },
                { label:"Predicted Delay", value:`${delayResult.predicted_delay_days} days`, color:"#f59e0b" },
                { label:"Confidence", value:delayResult.confidence, color:"#38bfff" },
              ].map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4, fontFamily:M }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Phase risk bars */}
            {delayResult.phases?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.08em", marginBottom:10 }}>PHASE DELAY PROBABILITY</div>
                {delayResult.phases.map((ph: any, i: number) => (
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{ph.name}</span>
                        <span style={{ fontSize:10, fontWeight:700, color:riskColor(ph.risk_level), background:`${riskColor(ph.risk_level)}18`, padding:"2px 7px", borderRadius:4, fontFamily:M }}>{ph.risk_level}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:riskColor(ph.risk_level), fontFamily:M }}>{ph.delay_probability}%</span>
                    </div>
                    <div style={{ height:6, background:"rgba(255,255,255,0.07)", borderRadius:3, marginBottom:6 }}>
                      <div style={{ height:"100%", width:`${ph.delay_probability}%`, background:riskColor(ph.risk_level), borderRadius:3, transition:"width 0.6s ease" }}/>
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{ph.risk_factors?.join(" · ")}</div>
                    {ph.recommendation && <div style={{ fontSize:11, color:"#38bfff", marginTop:3 }}>→ {ph.recommendation}</div>}
                  </div>
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
