import { useState, useRef } from "react";
import type { AppState } from "../../App";

interface Props { appState: AppState; }
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const C: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const severityColor: Record<string,string> = { Critical:"#f43f5e", High:"#f97316", Medium:"#f59e0b", Low:"#22d3a0" };
const ppeColor = (v: string) => v === "Compliant" ? "#22d3a0" : v === "Non-Compliant" ? "#f43f5e" : "#8a9bb0";
const scoreColor = (s: number) => s >= 80 ? "#22d3a0" : s >= 60 ? "#f59e0b" : "#f43f5e";

export default function Safety({ appState }: Props) {
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File|null) => {
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setResult(null); setError("");
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId);
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/construction/safety-analyze`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch (e: any) {
      setError(typeof e.message === "string" ? e.message : "Analysis failed");
    } finally { setLoading(false); }
  };

  const score = result?.safety_score ?? 0;

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", maxWidth:1100 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Safety Intelligence</h1>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:24 }}>AI-powered site safety monitoring · PPE compliance · Hazard detection · Safety scoring</p>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
        {[
          { label:"Safety Score",        value: result ? `${result.safety_score}/100` : "—", color: result ? scoreColor(score) : "#f0f4f8" },
          { label:"Hazards Found",       value: result ? (result.hazards?.length ?? 0) : "—", color: result && result.hazards?.length > 0 ? "#f43f5e" : "#22d3a0" },
          { label:"Workers Visible",     value: result?.estimated_workers_visible ?? "—", color: "#38bfff" },
          { label:"PPE Status",          value: result?.overall_status ?? "—", color: result?.overall_status === "Compliant" ? "#22d3a0" : result?.overall_status === "Non-Compliant" ? "#f43f5e" : "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={C}>
            <div style={{ fontSize:22, fontWeight:700, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{String(s.value)}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>

        {/* Left — upload + controls */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={C}>
            <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Upload Site Photo</div>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(34,211,160,0.5)"; }}
              onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0] || null); (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
              style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:"28px 16px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", transition:"all 0.2s", background:"rgba(255,255,255,0.02)", textAlign:"center" as const }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(34,211,160,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              {preview
                ? <img src={preview} alt="preview" style={{ maxHeight:140, maxWidth:"100%", borderRadius:8, objectFit:"contain" }} />
                : <>
                    <div style={{ width:44, height:44, borderRadius:10, background:"rgba(34,211,160,0.1)", border:"1px solid rgba(34,211,160,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22d3a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Drop site photo or PDF</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>JPG · PNG · PDF</div>
                  </>
              }
              <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files?.[0] || null)} />
            </div>
            {file && <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(255,255,255,0.03)", borderRadius:7, fontSize:12, color:"rgba(255,255,255,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{file.name}</div>}
          </div>

          <button
            onClick={analyze}
            disabled={!file || loading}
            style={{ padding:"12px", borderRadius:9, border:"none", background:(!file || loading) ? "rgba(34,211,160,0.3)" : "linear-gradient(135deg,#22d3a0,#0a9a75)", color:"#fff", fontSize:14, fontWeight:600, cursor:(!file || loading) ? "not-allowed" : "pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}
          >
            {loading
              ? <><div style={{ width:15, height:15, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }} /> Analyzing Safety...</>
              : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Run Safety Analysis</>
            }
          </button>

          {error && (
            <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          {/* AI Checks list */}
          <div style={C}>
            <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>AI Safety Checks</div>
            {[
              "PPE compliance (hard hats, hi-vis, boots)",
              "Fall risks & unsafe conditions",
              "Housekeeping & material storage",
              "Equipment & exclusion zones",
              "Safety signage & barriers",
              "Worker proximity to hazards",
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22d3a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — results */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {!result && !loading && (
            <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:420, textAlign:"center" as const }}>
              <div style={{ width:72, height:72, borderRadius:18, background:"rgba(34,211,160,0.08)", border:"1px solid rgba(34,211,160,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="rgba(34,211,160,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>Safety AI Ready</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", maxWidth:280, lineHeight:1.7 }}>Upload a site photo to get an AI-powered safety assessment with PPE compliance, hazard detection, and a 0–100 safety score.</div>
            </div>
          )}

          {loading && (
            <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:420, gap:16 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(34,211,160,0.2)", borderTopColor:"#22d3a0", animation:"spin 0.8s linear infinite" }} />
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Analyzing safety conditions with Gemini Vision...</div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Score + summary */}
              <div style={{ ...C, display:"flex", alignItems:"center", gap:24 }}>
                <div style={{ position:"relative", width:90, height:90, flexShrink:0 }}>
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8"/>
                    <circle cx="45" cy="45" r="38" fill="none" stroke={scoreColor(score)} strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset={`${2 * Math.PI * 38 * (1 - score / 100)}`}
                      strokeLinecap="round" transform="rotate(-90 45 45)"
                      style={{ transition:"stroke-dashoffset 1s ease", filter:`drop-shadow(0 0 6px ${scoreColor(score)}60)` }}
                    />
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontSize:24, fontWeight:800, color:scoreColor(score), lineHeight:1 }}>{score}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:M }}>/ 100</div>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:scoreColor(score), marginBottom:6 }}>{result.overall_status}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65 }}>{result.summary}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:M, marginTop:8 }}>Engine: {result.engine}</div>
                </div>
              </div>

              {/* PPE Compliance */}
              {result.ppe_compliance && (
                <div style={C}>
                  <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>PPE Compliance</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {Object.entries(result.ppe_compliance).map(([k, v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:"1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", textTransform:"capitalize" as const }}>{k.replace(/_/g, " ")}</span>
                        <span style={{ fontSize:11, fontWeight:600, color:ppeColor(String(v)), fontFamily:M }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hazards */}
              {result.hazards?.length > 0 && (
                <div style={{ ...C, borderColor:"rgba(244,63,94,0.15)" }}>
                  <div style={{ fontSize:10, fontWeight:600, color:"rgba(244,63,94,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>⚠ Hazards Detected</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {result.hazards.map((h: any, i: number) => (
                      <div key={i} style={{ padding:"12px 14px", background:"rgba(244,63,94,0.05)", border:"1px solid rgba(244,63,94,0.12)", borderRadius:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:"#f0f4f8" }}>{h.type}</span>
                          <span style={{ fontSize:10, fontWeight:700, color:severityColor[h.severity] ?? "#f59e0b", background:`${severityColor[h.severity] ?? "#f59e0b"}18`, padding:"2px 8px", borderRadius:4, fontFamily:M }}>{h.severity}</span>
                        </div>
                        {h.location && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginBottom:4 }}>Location: {h.location}</div>}
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:6, lineHeight:1.5 }}>{h.description}</div>
                        <div style={{ fontSize:12, color:"#f97316", fontWeight:500 }}>→ {h.required_action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Actions */}
              {result.immediate_actions?.length > 0 && (
                <div style={{ ...C, borderColor:"rgba(249,115,22,0.15)" }}>
                  <div style={{ fontSize:10, fontWeight:600, color:"rgba(249,115,22,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Immediate Actions Required</div>
                  {result.immediate_actions.map((a: string, i: number) => (
                    <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:i < result.immediate_actions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f97316" strokeWidth="1.8"/><path d="M12 9v4M12 17h.01" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {/* Positive observations */}
                {result.positive_observations?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(34,211,160,0.15)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Positive Observations</div>
                    {result.positive_observations.map((o: string, i: number) => (
                      <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i < result.positive_observations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:1 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#22d3a0" strokeWidth="1.8" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#22d3a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{o}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div style={C}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(56,191,255,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Recommendations</div>
                    {result.recommendations.map((r: string, i: number) => (
                      <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", padding:"6px 0", borderBottom:i < result.recommendations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", lineHeight:1.5 }}>→ {r}</div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
