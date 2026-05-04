import { useState, useRef } from "react";
import type { AppState } from "../../App";
import { Upload, Loader2, AlertCircle, Eye, Ruler, Package, Brain, FileText, Send, ShieldAlert, Users, ClipboardCheck } from "lucide-react";

interface Props { appState: AppState; }
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const C: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TABS = [
  { id:"cv",       label:"Blueprint / CV" },
  { id:"ask",      label:"Document Q&A" },
  { id:"contract", label:"Contract Risk" },
  { id:"meeting",  label:"Meeting Intelligence" },
  { id:"spec",     label:"Spec Compliance" },
] as const;

type Tab = typeof TABS[number]["id"];

const severityColor: Record<string,string> = { Critical:"#f43f5e", High:"#f97316", Medium:"#f59e0b", Low:"#22d3a0" };

export default function Intelligence({ appState }: Props) {
  const [tab, setTab] = useState<Tab>("cv");

  // CV tab state
  const [image, setImage]     = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError]     = useState("");
  const [result, setResult]       = useState<any>(null);
  const [mode, setMode]           = useState<"blueprint"|"site">("blueprint");
  const inputRef = useRef<HTMLInputElement>(null);

  // Doc Q&A state
  const [docFile, setDocFile]         = useState<File|null>(null);
  const [docUploaded, setDocUploaded] = useState(false);
  const [docLoading, setDocLoading]   = useState(false);
  const [docError, setDocError]       = useState("");
  const [question, setQuestion]       = useState("");
  const [messages, setMessages]       = useState<{role:string;content:string}[]>([]);
  const [askLoading, setAskLoading]   = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Contract Risk state
  const [contractLoading, setContractLoading] = useState(false);
  const [contractResult, setContractResult]   = useState<any>(null);
  const [contractError, setContractError]     = useState("");

  // Meeting Intelligence state
  const [meetingFile, setMeetingFile]         = useState<File|null>(null);
  const [meetingLoading, setMeetingLoading]   = useState(false);
  const [meetingResult, setMeetingResult]     = useState<any>(null);
  const [meetingError, setMeetingError]       = useState("");
  const meetingInputRef = useRef<HTMLInputElement>(null);

  // Spec Compliance state
  const [specFile, setSpecFile]       = useState<File|null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specResult, setSpecResult]   = useState<any>(null);
  const [specError, setSpecError]     = useState("");
  const specInputRef = useRef<HTMLInputElement>(null);

  // ── CV handlers ───────────────────────────────────────────────────────────
  const handleFile = (f: File|null) => {
    if (!f) return;
    setImage(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setResult(null); setCvError("");
  };

  const analyze = async () => {
    if (!image) return;
    setCvLoading(true); setCvError("");
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId);
      fd.append("file", image);
      fd.append("mode", mode);
      const res = await fetch(`${API_BASE}/construction/analyze-blueprint`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch (e: any) { setCvError(e.message ?? "Analysis failed"); }
    finally { setCvLoading(false); }
  };

  // ── Doc Q&A handlers ──────────────────────────────────────────────────────
  const uploadDoc = async (f: File) => {
    setDocLoading(true); setDocError(""); setDocUploaded(false); setMessages([]);
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId);
      fd.append("file", f);
      const res = await fetch(`${API_BASE}/general/upload`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setDocUploaded(true);
      setMessages([{ role:"assistant", content:`Uploaded ${f.name}. Ask me anything.` }]);
    } catch (e: any) { setDocError(e.message ?? "Upload failed"); }
    finally { setDocLoading(false); }
  };

  const askDoc = async () => {
    if (!question.trim() || askLoading) return;
    const q = question.trim();
    setMessages(p => [...p, { role:"user", content:q }]);
    setQuestion(""); setAskLoading(true);
    try {
      const res = await fetch(`${API_BASE}/general/ask`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setMessages(data.chat_history);
    } catch (e: any) { setMessages(p => [...p, { role:"assistant", content:`Error: ${e.message}` }]); }
    finally { setAskLoading(false); }
  };

  // ── Contract Risk handler ─────────────────────────────────────────────────
  const scanContractRisk = async () => {
    setContractLoading(true); setContractError(""); setContractResult(null);
    try {
      const res = await fetch(`${API_BASE}/construction/contract-risk`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, question: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      if (data.error) throw new Error(data.error);
      setContractResult(data);
    } catch (e: any) { setContractError(e.message ?? "Contract scan failed"); }
    finally { setContractLoading(false); }
  };

  // ── Meeting handler ───────────────────────────────────────────────────────
  const processMeeting = async (f: File) => {
    setMeetingFile(f); setMeetingLoading(true); setMeetingError(""); setMeetingResult(null);
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId);
      fd.append("file", f);
      const res = await fetch(`${API_BASE}/construction/meeting-intelligence`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setMeetingResult(data);
    } catch (e: any) { setMeetingError(e.message ?? "Processing failed"); }
    finally { setMeetingLoading(false); }
  };

  // ── Spec Compliance handler ───────────────────────────────────────────────
  const checkSpecCompliance = async (f: File) => {
    setSpecFile(f); setSpecLoading(true); setSpecError(""); setSpecResult(null);
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId);
      fd.append("file", f);
      const res = await fetch(`${API_BASE}/construction/spec-compliance`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setSpecResult(data);
    } catch (e: any) { setSpecError(e.message ?? "Compliance check failed"); }
    finally { setSpecLoading(false); }
  };

  const priorityColor: Record<string,string> = { High:"#f43f5e", Medium:"#f59e0b", Low:"#22d3a0" };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", maxWidth:1100 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Construction Intelligence</h1>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Blueprint CV · Document Q&A · Contract Risk · Meeting Intelligence · Spec Compliance</p>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:24, overflowX:"auto" as const }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"8px 16px", border:"none", background:"transparent", color:tab===t.id?"#38bfff":"rgba(255,255,255,0.35)", fontSize:13, fontWeight:tab===t.id?600:400, cursor:"pointer", fontFamily:F, borderBottom:`2px solid ${tab===t.id?"#00a8f0":"transparent"}`, marginBottom:-1, transition:"all 0.15s", whiteSpace:"nowrap" as const }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BLUEPRINT / CV TAB ── */}
      {tab === "cv" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={C}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Analysis Mode</div>
              <div style={{ display:"flex", gap:8 }}>
                {([["blueprint","Blueprint / Drawing"],["site","Site Photo"]] as const).map(([m, l]) => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"9px", borderRadius:8, border:`1px solid ${mode===m?"rgba(0,168,240,0.4)":"rgba(255,255,255,0.08)"}`, background:mode===m?"rgba(0,168,240,0.12)":"transparent", color:mode===m?"#38bfff":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F, transition:"all 0.15s" }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={C}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Upload File</div>
              <div onClick={() => inputRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:"28px 16px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", transition:"all 0.2s", background:"rgba(255,255,255,0.02)", textAlign:"center" as const }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,168,240,0.5)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                {preview
                  ? <img src={preview} alt="preview" style={{ maxHeight:140, maxWidth:"100%", borderRadius:8, objectFit:"contain" }} />
                  : <>
                      <div style={{ width:44, height:44, borderRadius:10, background:"rgba(0,168,240,0.1)", border:"1px solid rgba(0,168,240,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12, color:"#00a8f0" }}><Upload size={20}/></div>
                      <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Drop blueprint, photo or PDF</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>JPG · PNG · PDF</div>
                    </>
                }
                <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files?.[0] || null)} />
              </div>
              {image && <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, fontSize:12, color:"rgba(255,255,255,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{image.name}</div>}
            </div>
            <button onClick={analyze} disabled={!image || cvLoading} style={{ padding:"12px", borderRadius:9, border:"none", background:(!image||cvLoading)?"rgba(0,168,240,0.35)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:14, fontWeight:600, cursor:(!image||cvLoading)?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}>
              {cvLoading ? <><Loader2 size={15} style={{ animation:"spin 0.7s linear infinite" }}/> Analyzing...</> : <><Eye size={15}/> Analyze {mode==="blueprint"?"Blueprint":"Site Photo"}</>}
            </button>
            {cvError && <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13 }}><AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/>{cvError}</div>}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14, overflowY:"auto", maxHeight:"80vh" }}>
            {!result && !cvLoading && (
              <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, textAlign:"center" as const }}>
                <div style={{ width:56, height:56, borderRadius:14, background:"rgba(0,168,240,0.08)", border:"1px solid rgba(0,168,240,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, color:"rgba(0,168,240,0.5)" }}><Brain size={26}/></div>
                <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Gemini Vision Ready</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", maxWidth:220, lineHeight:1.6 }}>Upload a blueprint or site photo to extract objects, dimensions, and materials.</div>
              </div>
            )}
            {cvLoading && (
              <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(0,168,240,0.2)", borderTopColor:"#00a8f0", animation:"spin 0.8s linear infinite" }}/>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Analyzing...</div>
              </div>
            )}
            {result && !cvLoading && (
              <>
                <div style={{ ...C, padding:"8px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" as const }}>
                  <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)" }}>ENGINE</span>
                  <span style={{ fontSize:11, fontFamily:M, color:result.engine==="gemini-vision"?"#22d3a0":"#f59e0b", fontWeight:600 }}>{result.engine||"unknown"}</span>
                  {result.drawing_type && <><span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.2)" }}>TYPE</span><span style={{ fontSize:11, color:"#f0f4f8", fontWeight:500 }}>{result.drawing_type}</span></>}
                  {result.scale && <><span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.2)" }}>SCALE</span><span style={{ fontSize:11, color:"#f0f4f8" }}>{result.scale}</span></>}
                </div>
                {result.description && <div style={C}><div style={{ fontSize:10, fontWeight:600, color:"rgba(0,168,240,0.7)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Summary</div><p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.65, margin:0 }}>{result.description}</p></div>}
                {(result.room_count!=null || result.total_floor_area || result.door_count!=null || result.window_count!=null) && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                    {[{label:"Rooms",value:result.room_count},{label:"Floor Area",value:result.total_floor_area},{label:"Doors",value:result.door_count},{label:"Windows",value:result.window_count}].filter(s=>s.value!=null).map(s=>(
                      <div key={s.label} style={{ background:"rgba(0,168,240,0.08)", border:"1px solid rgba(0,168,240,0.15)", borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ fontSize:18, fontWeight:700, color:"#38bfff", letterSpacing:"-0.02em" }}>{String(s.value)}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:M, marginTop:3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {result.objects_detected?.length > 0 && (
                  <div style={C}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}><Eye size={13} color="#38bfff"/><span style={{ fontSize:10, fontWeight:600, color:"rgba(0,168,240,0.7)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const }}>Objects Detected</span></div>
                    <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6 }}>
                      {result.objects_detected.map((o: string, i: number) => <span key={i} style={{ padding:"3px 10px", borderRadius:100, fontSize:11, background:"rgba(56,191,255,0.1)", color:"#38bfff", border:"1px solid rgba(56,191,255,0.2)", fontFamily:M }}>{o}</span>)}
                    </div>
                  </div>
                )}
                {result.notable_features?.length > 0 && (
                  <div style={C}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(245,158,11,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Notable Features</div>
                    {result.notable_features.map((n: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.65)", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", lineHeight:1.5 }}>→ {n}</div>)}
                  </div>
                )}
                {result.materials?.length > 0 && (
                  <div style={C}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}><Package size={13} color="#22d3a0"/><span style={{ fontSize:10, fontWeight:600, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const }}>Materials</span></div>
                    <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6 }}>
                      {result.materials.map((m: string, i: number) => <span key={i} style={{ padding:"3px 10px", borderRadius:100, fontSize:11, background:"rgba(34,211,160,0.1)", color:"#22d3a0", border:"1px solid rgba(34,211,160,0.2)", fontFamily:M }}>{m}</span>)}
                    </div>
                  </div>
                )}
                {result.dimensions && Object.keys(result.dimensions).length > 0 && (
                  <div style={C}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}><Ruler size={13} color="#a78bfa"/><span style={{ fontSize:10, fontWeight:600, color:"rgba(167,139,250,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const }}>Dimensions</span></div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                      {Object.entries(result.dimensions).map(([k, v]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 8px", background:"rgba(255,255,255,0.03)", borderRadius:6 }}>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, maxWidth:100 }}>{k}</span>
                          <span style={{ fontSize:11, fontFamily:M, color:"#f0f4f8", flexShrink:0 }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.hazards?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(244,63,94,0.2)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(244,63,94,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>⚠ Hazards</div>
                    {result.hazards.map((h: string, i: number) => <div key={i} style={{ fontSize:12, color:"#f43f5e", padding:"4px 0" }}>• {h}</div>)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── DOCUMENT Q&A TAB ── */}
      {tab === "ask" && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20, height:"65vh" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={C}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Upload Document</div>
              <div onClick={() => docInputRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:"20px 12px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", transition:"all 0.2s", background:"rgba(255,255,255,0.02)", textAlign:"center" as const }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,168,240,0.5)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                <FileText size={24} color="#00a8f0" style={{ marginBottom:8 }}/>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Drop any PDF</div>
                <input ref={docInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setDocFile(f); uploadDoc(f); } }}/>
              </div>
              {docFile && <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{docFile.name}</div>}
              {docLoading && <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:8 }}><Loader2 size={13} style={{ animation:"spin 0.7s linear infinite" }}/>Uploading...</div>}
              {docUploaded && <div style={{ fontSize:12, color:"#22d3a0", marginTop:8 }}>✓ Ready</div>}
              {docError && <div style={{ fontSize:12, color:"#f43f5e", marginTop:8 }}>{docError}</div>}
            </div>
            <div style={{ ...C, padding:"14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Try asking</div>
              {["Summarize this document","What are the key dates?","Who are the main parties?","What are the payment terms?","List all obligations"].map((q, i) => (
                <button key={i} onClick={() => { if (docUploaded) setQuestion(q); }} style={{ display:"block", width:"100%", textAlign:"left" as const, padding:"6px 0", background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:12, cursor:docUploaded?"pointer":"default", fontFamily:F }}
                  onMouseEnter={e => { if (docUploaded) (e.currentTarget as HTMLButtonElement).style.color = "#f0f4f8"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}>
                  → {q}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:12 }}>
              {messages.length === 0 && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center" as const, color:"rgba(255,255,255,0.25)" }}>
                  <FileText size={32} style={{ marginBottom:12, opacity:0.4 }}/>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Upload a document to start</div>
                  <div style={{ fontSize:12 }}>Any PDF — contract, spec, report, drawing notes</div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display:"flex", flexDirection:m.role==="user"?"row-reverse":"row", gap:10 }}>
                  <div style={m.role==="user"
                    ? { background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", borderRadius:"16px 16px 4px 16px", padding:"10px 14px", fontSize:13, lineHeight:1.55, maxWidth:420 }
                    : { background:"#212d3d", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px 16px 16px 4px", padding:"10px 14px", fontSize:13, lineHeight:1.55, color:"#f0f4f8", maxWidth:480 }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {askLoading && (
                <div style={{ background:"#212d3d", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px 16px 16px 4px", padding:"10px 14px", display:"flex", alignItems:"center", gap:8, alignSelf:"flex-start" }}>
                  <Loader2 size={13} color="rgba(255,255,255,0.4)" style={{ animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Searching document...</span>
                </div>
              )}
            </div>
            <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:10 }}>
              <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter") askDoc(); }} placeholder={docUploaded ? "Ask anything about this document..." : "Upload a document first"} disabled={!docUploaded} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" }}/>
              <button onClick={askDoc} disabled={!question.trim() || !docUploaded || askLoading} style={{ padding:"10px 14px", borderRadius:8, border:"none", background:!question.trim()||!docUploaded?"rgba(0,168,240,0.3)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", cursor:!question.trim()||!docUploaded?"not-allowed":"pointer", display:"flex", alignItems:"center" }}>
                <Send size={15}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTRACT RISK TAB ── */}
      {tab === "contract" && (
        <div style={{ maxWidth:800 }}>
          <div style={{ ...C, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Contract Risk Scanner</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>AI scans your uploaded contract documents for risky clauses, missing provisions, and financial exposure.</div>
              </div>
              <button onClick={scanContractRisk} disabled={contractLoading} style={{ padding:"10px 20px", borderRadius:9, border:"none", background:contractLoading?"rgba(244,63,94,0.3)":"linear-gradient(135deg,#f43f5e,#b91c3b)", color:"#fff", fontSize:13, fontWeight:600, cursor:contractLoading?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:8, flexShrink:0, marginLeft:16 }}>
                {contractLoading ? <><Loader2 size={14} style={{ animation:"spin 0.7s linear infinite" }}/> Scanning...</> : <><ShieldAlert size={14}/> Scan Contract Risk</>}
              </button>
            </div>
            {!appState.projectBuilt && <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, fontSize:12, color:"#f59e0b" }}>⚠ Build a project first to scan real contract documents. Using demo data.</div>}
          </div>

          {contractError && <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:16 }}><AlertCircle size={15} style={{ flexShrink:0 }}/>{contractError}</div>}

          {contractResult && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Risk score */}
              <div style={{ ...C, display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ width:70, height:70, borderRadius:"50%", border:`5px solid ${contractResult.overall_risk_score >= 70 ? "#f43f5e" : contractResult.overall_risk_score >= 40 ? "#f59e0b" : "#22d3a0"}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:contractResult.overall_risk_score >= 70 ? "#f43f5e" : contractResult.overall_risk_score >= 40 ? "#f59e0b" : "#22d3a0", lineHeight:1 }}>{contractResult.overall_risk_score}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:M }}>RISK</div>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#f0f4f8", marginBottom:6 }}>Contract Risk Assessment</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65 }}>{contractResult.risk_summary}</div>
                </div>
              </div>

              {/* Clauses */}
              {contractResult.clauses?.map((cl: any, i: number) => (
                <div key={i} style={{ ...C, borderColor:`${severityColor[cl.severity] ?? "#f59e0b"}25` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{cl.title}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:4, fontFamily:M }}>{cl.category}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:severityColor[cl.severity] ?? "#f59e0b", background:`${severityColor[cl.severity] ?? "#f59e0b"}18`, padding:"3px 10px", borderRadius:5, fontFamily:M }}>{cl.severity}</span>
                    </div>
                  </div>
                  {cl.excerpt && <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", fontFamily:M, padding:"8px 12px", background:"rgba(255,255,255,0.03)", borderRadius:6, marginBottom:10, lineHeight:1.5 }}>"{cl.excerpt}"</div>}
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:8, lineHeight:1.55 }}>{cl.risk_explanation}</div>
                  <div style={{ fontSize:12, color:"#22d3a0", fontWeight:500 }}>→ Mitigation: {cl.mitigation}</div>
                </div>
              ))}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {contractResult.positive_provisions?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(34,211,160,0.15)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Positive Provisions</div>
                    {contractResult.positive_provisions.map((p: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", padding:"5px 0", borderBottom:i < contractResult.positive_provisions.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>✓ {p}</div>)}
                  </div>
                )}
                {contractResult.missing_provisions?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(245,158,11,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Missing Provisions</div>
                    {contractResult.missing_provisions.map((p: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", padding:"5px 0", borderBottom:i < contractResult.missing_provisions.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>⚠ {p}</div>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MEETING INTELLIGENCE TAB ── */}
      {tab === "meeting" && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={C}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Upload Meeting Notes</div>
              <div onClick={() => meetingInputRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:"28px 12px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", transition:"all 0.2s", background:"rgba(255,255,255,0.02)", textAlign:"center" as const }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(167,139,250,0.5)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                <Users size={24} color="#a78bfa" style={{ marginBottom:8 }}/>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Meeting minutes or notes PDF</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>PDF only</div>
                <input ref={meetingInputRef} type="file" accept=".pdf,.txt" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) processMeeting(f); }}/>
              </div>
              {meetingFile && <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{meetingFile.name}</div>}
              {meetingLoading && <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:8 }}><Loader2 size={13} style={{ animation:"spin 0.7s linear infinite" }}/>Extracting intelligence...</div>}
            </div>
            <div style={{ ...C, padding:"14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>AI Extracts</div>
              {["Action items with owners & deadlines","Key decisions made","Risks & issues raised","Open unresolved items","Next meeting date"].map((item, i) => (
                <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ color:"#a78bfa", fontSize:12 }}>→</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {meetingError && <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:16 }}><AlertCircle size={15} style={{ flexShrink:0 }}/>{meetingError}</div>}

            {!meetingResult && !meetingLoading && (
              <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:380, textAlign:"center" as const }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}><Users size={28} color="rgba(167,139,250,0.5)"/></div>
                <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>Meeting Intelligence Ready</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", maxWidth:280, lineHeight:1.7 }}>Upload meeting minutes or notes and the AI will extract all action items, decisions, risks, and open issues.</div>
              </div>
            )}

            {meetingLoading && (
              <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:380, gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(167,139,250,0.2)", borderTopColor:"#a78bfa", animation:"spin 0.8s linear infinite" }}/>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Extracting meeting intelligence...</div>
              </div>
            )}

            {meetingResult && !meetingLoading && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={C}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{meetingResult.meeting_title}</div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap" as const }}>
                    {meetingResult.meeting_date && meetingResult.meeting_date !== "Not specified" && <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontFamily:M }}>{meetingResult.meeting_date}</span>}
                    {meetingResult.attendees?.length > 0 && <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{meetingResult.attendees.join(", ")}</span>}
                  </div>
                  {meetingResult.summary && <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65, marginTop:10 }}>{meetingResult.summary}</div>}
                </div>

                {meetingResult.action_items?.length > 0 && (
                  <div style={C}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(0,168,240,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Action Items</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {meetingResult.action_items.map((a: any, i: number) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 12px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:"1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ flex:1, marginRight:12 }}>
                            <div style={{ fontSize:13, fontWeight:500, color:"#f0f4f8", marginBottom:4 }}>{a.task}</div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{a.owner} {a.due_date && a.due_date !== "Not specified" ? `· Due: ${a.due_date}` : ""}</div>
                          </div>
                          <span style={{ fontSize:10, fontWeight:700, color:priorityColor[a.priority] ?? "#f59e0b", background:`${priorityColor[a.priority] ?? "#f59e0b"}18`, padding:"3px 8px", borderRadius:4, fontFamily:M, flexShrink:0 }}>{a.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {meetingResult.decisions?.length > 0 && (
                    <div style={{ ...C, borderColor:"rgba(34,211,160,0.15)" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Decisions Made</div>
                      {meetingResult.decisions.map((d: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", padding:"5px 0", borderBottom:i < meetingResult.decisions.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>✓ {d}</div>)}
                    </div>
                  )}
                  {meetingResult.risks_raised?.length > 0 && (
                    <div style={{ ...C, borderColor:"rgba(244,63,94,0.15)" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:"rgba(244,63,94,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Risks Raised</div>
                      {meetingResult.risks_raised.map((r: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", padding:"5px 0", borderBottom:i < meetingResult.risks_raised.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>⚠ {r}</div>)}
                    </div>
                  )}
                  {meetingResult.open_issues?.length > 0 && (
                    <div style={{ ...C, borderColor:"rgba(245,158,11,0.15)", gridColumn:"1 / -1" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:"rgba(245,158,11,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Open Issues</div>
                      {meetingResult.open_issues.map((o: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", padding:"5px 0", borderBottom:i < meetingResult.open_issues.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>→ {o}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SPEC COMPLIANCE TAB ── */}
      {tab === "spec" && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={C}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Upload Submittal</div>
              <div onClick={() => specInputRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.12)", borderRadius:10, padding:"28px 12px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", transition:"all 0.2s", background:"rgba(255,255,255,0.02)", textAlign:"center" as const }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(34,211,160,0.5)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                <ClipboardCheck size={24} color="#22d3a0" style={{ marginBottom:8 }}/>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Submittal PDF to check</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>Compared against project specs</div>
                <input ref={specInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) checkSpecCompliance(f); }}/>
              </div>
              {specFile && <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{specFile.name}</div>}
              {specLoading && <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:8 }}><Loader2 size={13} style={{ animation:"spin 0.7s linear infinite" }}/>Checking compliance...</div>}
            </div>
            <div style={{ ...C, padding:"14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>AI Compares</div>
              {["Material grades and standards","Dimensional requirements","Testing certifications","Performance criteria","Code compliance references"].map((item, i) => (
                <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ color:"#22d3a0", fontSize:12 }}>→</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {specError && <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:16 }}><AlertCircle size={15} style={{ flexShrink:0 }}/>{specError}</div>}

            {!specResult && !specLoading && (
              <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:380, textAlign:"center" as const }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"rgba(34,211,160,0.08)", border:"1px solid rgba(34,211,160,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}><ClipboardCheck size={28} color="rgba(34,211,160,0.5)"/></div>
                <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>Spec Compliance Ready</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", maxWidth:280, lineHeight:1.7 }}>Upload a submittal PDF and the AI compares it against your project specifications, flagging non-conformances and missing information.</div>
              </div>
            )}

            {specLoading && (
              <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:380, gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(34,211,160,0.2)", borderTopColor:"#22d3a0", animation:"spin 0.8s linear infinite" }}/>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Checking specification compliance...</div>
              </div>
            )}

            {specResult && !specLoading && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Score + status */}
                <div style={{ ...C, display:"flex", alignItems:"center", gap:20 }}>
                  <div style={{ width:70, height:70, borderRadius:"50%", border:`5px solid ${specResult.compliance_score >= 80 ? "#22d3a0" : specResult.compliance_score >= 60 ? "#f59e0b" : "#f43f5e"}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:specResult.compliance_score >= 80 ? "#22d3a0" : specResult.compliance_score >= 60 ? "#f59e0b" : "#f43f5e", lineHeight:1 }}>{specResult.compliance_score}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:M }}>/ 100</div>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#f0f4f8", marginBottom:4 }}>{specResult.overall_status}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65 }}>{specResult.summary}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:6 }}>{specResult.submittal_title}</div>
                  </div>
                </div>

                {specResult.non_compliant_items?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(244,63,94,0.15)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(244,63,94,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:12 }}>Non-Compliant Items</div>
                    {specResult.non_compliant_items.map((nc: any, i: number) => (
                      <div key={i} style={{ padding:"10px 12px", background:"rgba(244,63,94,0.05)", border:"1px solid rgba(244,63,94,0.1)", borderRadius:8, marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:600 }}>{nc.item}</span>
                          <span style={{ fontSize:10, fontWeight:700, color:severityColor[nc.severity] ?? "#f59e0b", background:`${severityColor[nc.severity] ?? "#f59e0b"}18`, padding:"2px 8px", borderRadius:4, fontFamily:M }}>{nc.severity}</span>
                        </div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Required: <span style={{ color:"rgba(255,255,255,0.6)" }}>{nc.spec_requirement}</span> · Submitted: <span style={{ color:"#f43f5e" }}>{nc.submitted_value}</span></div>
                        <div style={{ fontSize:12, color:"#f59e0b" }}>→ {nc.action}</div>
                      </div>
                    ))}
                  </div>
                )}

                {specResult.compliant_items?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(34,211,160,0.15)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Compliant Items</div>
                    {specResult.compliant_items.map((ci: any, i: number) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i < specResult.compliant_items.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>✓ {ci.item}</span>
                        {ci.spec_reference && <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, flexShrink:0, marginLeft:8 }}>{ci.spec_reference}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {specResult.missing_information?.length > 0 && (
                  <div style={{ ...C, borderColor:"rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"rgba(245,158,11,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>Missing Information</div>
                    {specResult.missing_information.map((m: string, i: number) => <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", padding:"5px 0", borderBottom:i < specResult.missing_information.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>⚠ {m}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
