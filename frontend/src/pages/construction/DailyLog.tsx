import { useState, useEffect, useRef } from "react";
import type { AppState } from "../../App";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

type WeatherCondition = "Clear" | "Partly Cloudy" | "Overcast" | "Rain" | "Heavy Rain" | "Wind" | "Extreme Heat" | "Fog";

type DailyLogEntry = {
  id: string;
  date: string;
  weather: WeatherCondition;
  temp_high: string;
  temp_low: string;
  crew_count: number;
  labor_hours: number;
  work_performed: string;
  delays: string;
  equipment: string;
  incidents: string;
  visitors: string;
  ai_narrative?: string;
  delay_claims?: string[];
  weather_impact?: boolean;
  created_by: string;
};

const WEATHER_ICON: Record<string, string> = {
  Clear: "☀️", "Partly Cloudy": "⛅", Overcast: "☁️", Rain: "🌧️",
  "Heavy Rain": "⛈️", Wind: "💨", "Extreme Heat": "🌡️", Fog: "🌫️",
};

const WEATHER_COLORS: Record<string, string> = {
  Clear: "#22d3a0", "Partly Cloudy": "#eab308", Overcast: "rgba(255,255,255,0.4)",
  Rain: "#00a8f0", "Heavy Rain": "#f43f5e", Wind: "#eab308", "Extreme Heat": "#f97316", Fog: "rgba(255,255,255,0.35)",
};


const WEATHER_OPTIONS: WeatherCondition[] = ["Clear", "Partly Cloudy", "Overcast", "Rain", "Heavy Rain", "Wind", "Extreme Heat", "Fog"];

function PMDailyLog({ appState }: { appState: AppState }) {
  const [pmlogs, setPmlogs] = useState<any[]>([]);
  const [form, setForm] = useState({ property_address:"", date:new Date().toISOString().split("T")[0], activities:"", maintenance_notes:"", tenant_interactions:"", occupancy_notes:"" });
  const [saving, setSaving] = useState(false);
  const F2 = "'Outfit',sans-serif";
  const M2 = "'JetBrains Mono',monospace";
  const inp2: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F2, outline:"none", resize:"vertical" as const, boxSizing:"border-box" as const };

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/pm/daily-log/${appState.sessionId}`).then(r => r.ok ? r.json() : []).then(setPmlogs).catch(() => {});
  }, [appState.sessionId]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/pm/daily-log/create`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ session_id:appState.sessionId, ...form }) });
      if (r.ok) { const d = await r.json(); setPmlogs(prev => [d, ...prev]); setForm(p => ({...p, activities:"", maintenance_notes:"", tenant_interactions:"", occupancy_notes:""})); }
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ padding:"0 28px 28px", fontFamily:F2, color:"#f0f4f8" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Log Property Activity</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={{ fontSize:10, fontFamily:M2, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>PROPERTY ADDRESS</label><input value={form.property_address} onChange={e => setForm(p=>({...p,property_address:e.target.value}))} placeholder="123 Main St" style={{ ...inp2, resize:"none" as const }}/></div>
              <div><label style={{ fontSize:10, fontFamily:M2, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>DATE</label><input type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} style={{ ...inp2, resize:"none" as const }}/></div>
            </div>
            {[{k:"activities",l:"Activities Today",ph:"Describe daily activities..."},{k:"maintenance_notes",l:"Maintenance Notes",ph:"Any maintenance performed or scheduled..."},{k:"tenant_interactions",l:"Tenant Interactions",ph:"Calls, visits, complaints..."},{k:"occupancy_notes",l:"Occupancy Notes",ph:"Move-ins, move-outs, vacancies..."}].map(f => (
              <div key={f.k}><label style={{ fontSize:10, fontFamily:M2, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>{f.l.toUpperCase()}</label><textarea rows={2} value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp2}/></div>
            ))}
            <button onClick={save} disabled={saving} style={{ padding:"10px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#00a8f0,#0054a0)", color:"#fff", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer", fontFamily:F2, marginTop:4 }}>
              {saving ? "Saving + AI Summary…" : "Save Log + AI Summary"}
            </button>
          </div>
        </div>
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20, overflowY:"auto", maxHeight:500 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Recent Logs</div>
          {pmlogs.length === 0 ? <div style={{ color:"rgba(255,255,255,0.2)", fontSize:13, textAlign:"center", padding:"32px 0" }}>No property logs yet</div> : pmlogs.map((l, i) => (
            <div key={l.id||i} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:12, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{l.property_address||"Property"}</div>
                <div style={{ fontSize:11, fontFamily:M2, color:"rgba(255,255,255,0.3)" }}>{l.date}</div>
              </div>
              {l.ai_summary && <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{l.ai_summary}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DailyLog({ appState }: { appState: AppState }) {
  const [tab, setTab] = useState("construction");
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>("dl1");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{
    date: string; weather: WeatherCondition; temp_high: string; temp_low: string;
    crew_count: string; labor_hours: string; work_performed: string;
    delays: string; equipment: string; incidents: string; visitors: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    weather: "Clear", temp_high: "", temp_low: "",
    crew_count: "", labor_hours: "",
    work_performed: "", delays: "", equipment: "", incidents: "", visitors: "",
  });

  // ── Voice recording ──
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Photo upload (daily log) ──
  const [logPhotos, setLogPhotos] = useState<{file: File; url: string; analysis?: any}[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── Video analysis ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<any>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        await transcribeAudio(blob, mr.mimeType);
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone and try again.");
    }
  }

  function stopRecording() {
    mediaRecRef.current?.stop();
    setRecording(false);
  }

  async function transcribeAudio(blob: Blob, mimeType: string) {
    setTranscribing(true);
    try {
      const ext = mimeType.includes("mp4") ? ".mp4" : ".webm";
      const fd = new FormData();
      fd.append("session_id", appState.sessionId || "");
      fd.append("file", blob, `recording${ext}`);
      const r = await fetch(`${BASE}/media/transcribe`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setTranscript(data.transcript || "");
      const f = data.suggested_fields || {};
      setForm(prev => ({
        ...prev,
        ...(f.date ? { date: f.date } : {}),
        ...(f.weather ? { weather: f.weather as WeatherCondition } : {}),
        ...(f.temp_high ? { temp_high: f.temp_high } : {}),
        ...(f.temp_low ? { temp_low: f.temp_low } : {}),
        ...(f.crew_count != null ? { crew_count: String(f.crew_count) } : {}),
        ...(f.labor_hours != null ? { labor_hours: String(f.labor_hours) } : {}),
        ...(f.work_performed ? { work_performed: f.work_performed } : {}),
        ...(f.delays ? { delays: f.delays } : {}),
        ...(f.equipment ? { equipment: f.equipment } : {}),
        ...(f.incidents ? { incidents: f.incidents } : {}),
        ...(f.visitors ? { visitors: f.visitors } : {}),
      }));
    } catch (e) {
      alert("Transcription failed: " + (e as Error).message);
    }
    setTranscribing(false);
  }

  async function addPhoto(file: File) {
    const url = URL.createObjectURL(file);
    setLogPhotos(prev => [...prev, { file, url }]);
    setPhotoLoading(true);
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId || "");
      fd.append("file", file);
      fd.append("context", "dailylog");
      const r = await fetch(`${BASE}/media/analyze-photo`, { method: "POST", body: fd });
      if (r.ok) {
        const analysis = await r.json();
        setLogPhotos(prev => prev.map(p => p.url === url ? { ...p, analysis } : p));
      }
    } catch {}
    setPhotoLoading(false);
  }

  async function analyzeVideo() {
    if (!videoFile) return;
    setVideoLoading(true);
    setVideoResult(null);
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId || "");
      fd.append("file", videoFile);
      const r = await fetch(`${BASE}/media/analyze-video`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
      setVideoResult(await r.json());
    } catch (e) {
      alert("Video analysis failed: " + (e as Error).message);
    }
    setVideoLoading(false);
  }

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/construction/daily-log/${appState.sessionId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLogs(d); })
      .catch(() => {});
  }, [appState.sessionId]);

  const stats = {
    total: logs.length,
    withDelays: logs.filter(l => l.delays && l.delays !== "None reported." && l.delays !== "None").length,
    weatherEvents: logs.filter(l => l.weather_impact).length,
    delayClaims: logs.reduce((sum, l) => sum + (l.delay_claims?.length || 0), 0),
    totalHours: logs.reduce((sum, l) => sum + l.labor_hours, 0),
  };

  async function generateNarrative(log: DailyLogEntry) {
    setAiLoading(log.id);
    try {
      const r = await fetch(`${BASE}/construction/daily-log/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: appState.sessionId,
          log_id: log.id,
          date: log.date,
          weather: log.weather,
          crew_count: log.crew_count,
          labor_hours: log.labor_hours,
          work_performed: log.work_performed,
          delays: log.delays,
          incidents: log.incidents,
        }),
      });
      const data = await r.json();
      setLogs(prev => prev.map(l => l.id === log.id ? {
        ...l,
        ai_narrative: data.narrative || l.ai_narrative,
        delay_claims: data.delay_claims || l.delay_claims,
        weather_impact: data.weather_impact ?? l.weather_impact,
      } : l));
    } catch {
      setLogs(prev => prev.map(l => l.id === log.id ? {
        ...l,
        ai_narrative: `Site activities on ${log.date} — ${log.crew_count} workers logged ${log.labor_hours} labor hours across active trades. ${log.delays && log.delays !== "None reported." ? "Delays noted: " + log.delays : "No delay events reported."} Weather conditions: ${log.weather}, ${log.temp_high}/${log.temp_low}. ${log.incidents && log.incidents !== "None" ? "Safety incident recorded — requires follow-up." : "No safety incidents."}`,
        delay_claims: log.delays && log.delays !== "None reported." && log.delays !== "None"
          ? ["Delay documented — review against contract schedule baseline for claim eligibility"]
          : [],
        weather_impact: ["Rain", "Heavy Rain", "Extreme Heat", "Wind"].includes(log.weather),
      } : l));
    }
    setAiLoading(null);
  }

  async function createLog() {
    if (!form.date || !form.work_performed) return;
    setAiLoading("create");
    const newLog: DailyLogEntry = {
      id: `dl${Date.now()}`,
      date: form.date,
      weather: form.weather,
      temp_high: form.temp_high,
      temp_low: form.temp_low,
      crew_count: Number(form.crew_count) || 0,
      labor_hours: Number(form.labor_hours) || 0,
      work_performed: form.work_performed,
      delays: form.delays || "None reported.",
      equipment: form.equipment,
      incidents: form.incidents || "None",
      visitors: form.visitors,
      created_by: appState.user?.name || "Unknown",
    };
    try {
      const r = await fetch(`${BASE}/construction/daily-log/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, ...form }),
      });
      const data = await r.json();
      setLogs(prev => [data.log || newLog, ...prev]);
    } catch {
      setLogs(prev => [newLog, ...prev]);
    }
    setForm({
      date: new Date().toISOString().split("T")[0], weather: "Clear", temp_high: "", temp_low: "",
      crew_count: "", labor_hours: "", work_performed: "", delays: "", equipment: "", incidents: "", visitors: "",
    });
    setShowModal(false);
    setAiLoading(null);
  }

  const TabBar2 = () => (
    <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:4, marginBottom:24, width:"fit-content" }}>
      {[{id:"construction",label:"Site Daily Log"},{id:"video",label:"Video Walkthrough"},{id:"pm",label:"Property Daily Log"}].map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"7px 18px", borderRadius:7, border:"none", background:tab===t.id?"rgba(0,168,240,0.15)":"transparent", color:tab===t.id?"#38bfff":"rgba(255,255,255,0.38)", fontSize:13, fontWeight:tab===t.id?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 150ms" }}>
          {t.label}
        </button>
      ))}
    </div>
  );

  if (tab === "video") return (
    <div style={{ padding:28, fontFamily:"'Outfit',sans-serif", color:"#f0f4f8" }}>
      <TabBar2 />
      <div style={{ maxWidth:820, margin:"0 auto" }}>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Video Walkthrough Analysis</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:24 }}>Upload a site walkthrough video. Gemini AI will extract observations, risks, and progress estimates.</p>

        {/* Upload area */}
        <div onClick={() => videoInputRef.current?.click()}
          style={{ border:"2px dashed rgba(0,168,240,0.3)", borderRadius:14, padding:"36px 24px", textAlign:"center", cursor:"pointer", background:"rgba(0,168,240,0.03)", marginBottom:20, transition:"border-color 200ms" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🎬</div>
          {videoFile ? (
            <div>
              <div style={{ color:"#38bfff", fontWeight:600, fontSize:14 }}>{videoFile.name}</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>{(videoFile.size/1024/1024).toFixed(1)} MB</div>
            </div>
          ) : (
            <div>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:14, marginBottom:4 }}>Click or drop a video here</div>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>MP4, MOV, WebM — up to 50 MB</div>
            </div>
          )}
        </div>
        <input ref={videoInputRef} type="file" accept="video/*" style={{ display:"none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { setVideoFile(f); setVideoResult(null); } }} />

        <button onClick={analyzeVideo} disabled={!videoFile || videoLoading}
          style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", background:videoFile && !videoLoading?"linear-gradient(135deg,#00a8f0,#0054a0)":"rgba(255,255,255,0.06)", color:videoFile?"#fff":"rgba(255,255,255,0.3)", fontSize:14, fontWeight:700, cursor:videoFile&&!videoLoading?"pointer":"default", marginBottom:24 }}>
          {videoLoading ? "Analyzing video with Gemini AI… (may take ~30s)" : "Analyze Walkthrough Video"}
        </button>

        {videoLoading && (
          <div style={{ textAlign:"center", padding:"24px", color:"rgba(255,255,255,0.5)", fontSize:13 }}>
            <div style={{ width:28, height:28, border:"3px solid rgba(0,168,240,0.2)", borderTopColor:"#38bfff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            Uploading and processing video… Gemini will analyze all frames.
          </div>
        )}

        {videoResult && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Summary */}
            <div style={{ background:"rgba(0,168,240,0.06)", border:"1px solid rgba(0,168,240,0.15)", borderRadius:12, padding:20 }}>
              <div style={{ color:"#38bfff", fontSize:11, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>EXECUTIVE SUMMARY</div>
              <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, lineHeight:1.7, margin:0 }}>{videoResult.summary}</p>
              {videoResult.completion_estimate > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Estimated Completion</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#22d3a0" }}>{videoResult.completion_estimate}%</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
                    <div style={{ width:`${videoResult.completion_estimate}%`, height:"100%", background:"linear-gradient(90deg,#22d3a0,#00a8f0)", borderRadius:3 }} />
                  </div>
                </div>
              )}
            </div>

            {/* Observations */}
            {videoResult.observations?.length > 0 && (
              <div style={{ background:"#151b24", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
                <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>AREA OBSERVATIONS</div>
                {videoResult.observations.map((obs: any, i: number) => (
                  <div key={i} style={{ display:"flex", gap:12, paddingBottom:12, marginBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:5, background: obs.status==="On Track"?"#22d3a0":obs.status==="At Risk"?"#f97316":"#f43f5e" }} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#f0f4f8" }}>{obs.area}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:3, lineHeight:1.6 }}>{obs.description}</div>
                      <div style={{ marginTop:5, fontSize:11, color: obs.status==="On Track"?"#22d3a0":obs.status==="At Risk"?"#f97316":"#f43f5e", fontWeight:600 }}>{obs.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Risks + Actions side-by-side */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {videoResult.risks?.length > 0 && (
                <div style={{ background:"rgba(244,63,94,0.05)", border:"1px solid rgba(244,63,94,0.15)", borderRadius:12, padding:18 }}>
                  <div style={{ color:"#f43f5e", fontSize:11, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>RISKS IDENTIFIED</div>
                  {videoResult.risks.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:8, paddingLeft:10, borderLeft:"2px solid rgba(244,63,94,0.3)", lineHeight:1.6 }}>{r}</div>
                  ))}
                </div>
              )}
              {videoResult.action_items?.length > 0 && (
                <div style={{ background:"rgba(234,179,8,0.05)", border:"1px solid rgba(234,179,8,0.15)", borderRadius:12, padding:18 }}>
                  <div style={{ color:"#eab308", fontSize:11, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>ACTION ITEMS</div>
                  {videoResult.action_items.map((a: string, i: number) => (
                    <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:8, paddingLeft:10, borderLeft:"2px solid rgba(234,179,8,0.3)", lineHeight:1.6 }}>• {a}</div>
                  ))}
                </div>
              )}
            </div>

            {videoResult.safety_observations?.length > 0 && (
              <div style={{ background:"rgba(249,115,22,0.05)", border:"1px solid rgba(249,115,22,0.15)", borderRadius:12, padding:18 }}>
                <div style={{ color:"#f97316", fontSize:11, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>SAFETY OBSERVATIONS</div>
                {videoResult.safety_observations.map((s: string, i: number) => (
                  <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:6, paddingLeft:10, borderLeft:"2px solid rgba(249,115,22,0.3)", lineHeight:1.6 }}>⚠ {s}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (tab === "pm") return (
    <div style={{ padding:"28px 28px 0", fontFamily:"'Outfit',sans-serif", color:"#f0f4f8", background:"#0f1319", minHeight:"100%" }}>
      <TabBar2 />
      <PMDailyLog appState={appState} />
    </div>
  );

  return (
    <div style={{ padding: 28, maxWidth: 1300, margin: "0 auto" }}>
      <TabBar2 />
      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Logs", value: stats.total, color: "#38bfff" },
          { label: "With Delays", value: stats.withDelays, color: "#f97316" },
          { label: "Weather Events", value: stats.weatherEvents, color: "#eab308" },
          { label: "Delay Claims Detected", value: stats.delayClaims, color: "#f43f5e" },
          { label: "Total Labor Hours", value: stats.totalHours.toLocaleString(), color: "#22d3a0" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#151b24", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", marginBottom: 8 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={() => setShowModal(true)}
          style={{ padding: "9px 18px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + New Daily Log
        </button>
      </div>

      {/* ── Log cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {logs.map(log => {
          const isExp = expanded === log.id;
          const hasDelays = log.delays && log.delays !== "None reported." && log.delays !== "None";
          const hasIncidents = log.incidents && log.incidents !== "None";
          const hasClaims = log.delay_claims && log.delay_claims.length > 0;

          return (
            <div key={log.id} style={{
              background: "#151b24",
              border: `1px solid ${isExp ? "rgba(0,168,240,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderLeft: `3px solid ${log.weather_impact ? "#f97316" : hasClaims ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, overflow: "hidden",
            }}>

              {/* ── Log header ── */}
              <div onClick={() => setExpanded(isExp ? null : log.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 20 }}>

                {/* Date */}
                <div style={{ minWidth: 90 }}>
                  <div style={{ color: "#f0f4f8", fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                    {new Date(log.date + "T12:00:00").getFullYear()}
                  </div>
                </div>

                {/* Weather */}
                <div style={{ minWidth: 110, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{WEATHER_ICON[log.weather]}</span>
                  <div>
                    <div style={{ color: WEATHER_COLORS[log.weather], fontSize: 12, fontWeight: 600 }}>{log.weather}</div>
                    {(log.temp_high || log.temp_low) && (
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                        {log.temp_high}{log.temp_low ? ` / ${log.temp_low}` : ""}
                      </div>
                    )}
                  </div>
                </div>

                {/* Crew + hours */}
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>CREW</div>
                    <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700 }}>{log.crew_count}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>HOURS</div>
                    <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700 }}>{log.labor_hours}</div>
                  </div>
                </div>

                {/* Summary snippet */}
                <div style={{ flex: 1, color: "rgba(255,255,255,0.5)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.work_performed}
                </div>

                {/* Flags */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {hasDelays && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(249,115,22,0.12)", color: "#f97316", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>DELAY</span>
                  )}
                  {hasIncidents && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(244,63,94,0.12)", color: "#f43f5e", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>INCIDENT</span>
                  )}
                  {hasClaims && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(234,179,8,0.12)", color: "#eab308", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>CLAIM RISK</span>
                  )}
                  {log.weather_impact && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(249,115,22,0.1)", color: "#f97316", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>WEATHER</span>
                  )}
                </div>

                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}>
                  <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* ── Expanded detail ── */}
              {isExp && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

                    {/* Work performed */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>WORK PERFORMED</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.7, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                        {log.work_performed}
                      </div>
                    </div>

                    {/* Delays */}
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>DELAYS / ISSUES</div>
                      <div style={{
                        color: hasDelays ? "#f97316" : "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6,
                        padding: "10px 12px", background: hasDelays ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.02)",
                        borderRadius: 8, border: `1px solid ${hasDelays ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.05)"}`,
                      }}>
                        {log.delays || "None reported."}
                      </div>
                    </div>

                    {/* Incidents */}
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>SAFETY INCIDENTS</div>
                      <div style={{
                        color: hasIncidents ? "#f43f5e" : "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6,
                        padding: "10px 12px", background: hasIncidents ? "rgba(244,63,94,0.06)" : "rgba(255,255,255,0.02)",
                        borderRadius: 8, border: `1px solid ${hasIncidents ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.05)"}`,
                      }}>
                        {log.incidents || "None"}
                      </div>
                    </div>

                    {/* Equipment */}
                    {log.equipment && (
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>EQUIPMENT ON SITE</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>{log.equipment}</div>
                      </div>
                    )}

                    {/* Visitors */}
                    {log.visitors && (
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>VISITORS</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>{log.visitors}</div>
                      </div>
                    )}
                  </div>

                  {/* Delay claims */}
                  {hasClaims && (
                    <div style={{ marginBottom: 16, padding: "14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                        <span style={{ color: "#eab308", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                          POTENTIAL DELAY CLAIMS DETECTED
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {log.delay_claims!.map((claim, i) => (
                          <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6, paddingLeft: 10, borderLeft: "2px solid rgba(234,179,8,0.3)" }}>
                            {claim}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI narrative */}
                  {log.ai_narrative ? (
                    <div style={{ padding: "14px", background: "rgba(0,168,240,0.06)", border: "1px solid rgba(0,168,240,0.15)", borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ color: "#38bfff", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>AI DAILY REPORT NARRATIVE</div>
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7 }}>{log.ai_narrative}</div>
                    </div>
                  ) : (
                    <button onClick={() => generateNarrative(log)} disabled={aiLoading === log.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                        padding: "10px 18px", borderRadius: 8,
                        background: "rgba(0,168,240,0.08)", border: "1px solid rgba(0,168,240,0.18)",
                        color: "#38bfff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>
                      {aiLoading === log.id ? (
                        <span style={{ width: 13, height: 13, border: "2px solid rgba(56,191,255,0.3)", borderTopColor: "#38bfff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {aiLoading === log.id ? "Generating narrative & scanning for claims..." : "Generate AI Narrative & Detect Delay Claims"}
                    </button>
                  )}

                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
                    Logged by {log.created_by}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setLogPhotos([]); setTranscript(""); } }}>
          <div style={{ background: "#151b24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 640, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 20 }}>
              <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700 }}>New Daily Log</div>
              {/* Voice recording button */}
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {transcribing && <span style={{ color:"rgba(255,255,255,0.5)", fontSize:12 }}>Transcribing…</span>}
                {transcript && !transcribing && <span style={{ color:"#22d3a0", fontSize:12 }}>Form filled from voice</span>}
                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={transcribing}
                  title={recording ? "Stop recording" : "Record voice to fill form"}
                  style={{
                    width:38, height:38, borderRadius:"50%", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                    background: recording ? "rgba(244,63,94,0.2)" : "rgba(0,168,240,0.12)",
                    boxShadow: recording ? "0 0 0 4px rgba(244,63,94,0.25)" : "none",
                    transition:"all 200ms",
                  }}>
                  {recording ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f43f5e"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bfff" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3z"/>
                      <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Transcript preview */}
            {transcript && (
              <div style={{ background:"rgba(34,211,160,0.05)", border:"1px solid rgba(34,211,160,0.15)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>
                <span style={{ color:"#22d3a0", fontWeight:600, fontSize:11 }}>VOICE TRANSCRIPT · </span>{transcript}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Weather</label>
                  <select value={form.weather} onChange={e => setForm(p => ({ ...p, weather: e.target.value as WeatherCondition }))}
                    style={{ width: "100%", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", cursor: "pointer" }}>
                    {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{WEATHER_ICON[w]} {w}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                {[
                  { label: "Temp High", key: "temp_high", placeholder: "82°F" },
                  { label: "Temp Low", key: "temp_low", placeholder: "65°F" },
                  { label: "Crew Count", key: "crew_count", placeholder: "34" },
                  { label: "Labor Hours", key: "labor_hours", placeholder: "272" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                  </div>
                ))}
              </div>

              {[
                { label: "Work Performed", key: "work_performed", placeholder: "Describe all work activities completed today...", rows: 4 },
                { label: "Delays / Issues", key: "delays", placeholder: "Describe any delays, disruptions, or issues...", rows: 2 },
                { label: "Equipment on Site", key: "equipment", placeholder: "e.g. 1x Tower Crane, 2x Scissor Lifts...", rows: 2 },
                { label: "Safety Incidents", key: "incidents", placeholder: "None — or describe any incidents or near-misses", rows: 2 },
                { label: "Visitors", key: "visitors", placeholder: "e.g. Owner's Rep — Jane Smith (AM inspection)", rows: 1 },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <textarea value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} rows={f.rows}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                </div>
              ))}
            </div>

            {/* Photo upload */}
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 8 }}>Site Photos (optional)</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                {logPhotos.map((p, i) => (
                  <div key={i} style={{ position:"relative", width:80, height:80 }}>
                    <img src={p.url} style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)" }} />
                    {!p.analysis && photoLoading && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                      </div>
                    )}
                    {p.analysis && (
                      <div title={p.analysis.description} style={{ position:"absolute", bottom:4, right:4, background: p.analysis.severity==="High"?"#f43f5e":p.analysis.severity==="Medium"?"#f97316":"#22d3a0", borderRadius:4, padding:"2px 5px", fontSize:10, fontWeight:700, color:"#fff" }}>
                        {p.analysis.severity || "OK"}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => photoInputRef.current?.click()}
                  style={{ width:80, height:80, borderRadius:8, border:"2px dashed rgba(255,255,255,0.15)", background:"transparent", color:"rgba(255,255,255,0.3)", fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  +
                </button>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                onChange={e => { Array.from(e.target.files || []).forEach(addPhoto); e.target.value = ""; }} />
              {logPhotos.some(p => p.analysis) && (
                <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
                  {logPhotos.filter(p=>p.analysis).map((p,i) => p.analysis?.ai_notes && (
                    <div key={i}>• {p.analysis.ai_notes}</div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowModal(false); setLogPhotos([]); setTranscript(""); }}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={createLog} disabled={aiLoading === "create"}
                style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {aiLoading === "create" ? "Saving..." : "Save Daily Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
