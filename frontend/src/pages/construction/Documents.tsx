import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import { askProject, clearConstructionChat } from "../../api/client";
import type { ChatMessage } from "../../api/client";
import FileUpload from "../../components/FileUpload";
import DocClassifier from "../../components/DocClassifier";
import { Send, Trash2, Loader2, AlertCircle, CheckCircle, Bot, FileText, Lightbulb } from "lucide-react";
import { useRef, useEffect } from "react";

interface Props { appState: AppState; }

type SetupStep = "upload" | "classify" | "done";

const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, ...extra });

const EXAMPLE_QUESTIONS = [
  "Who is responsible for waterproofing?",
  "What are the liquidated damages terms?",
  "Are we in delay based on the daily reports?",
  "What concrete strength is required at the foundations?",
  "What does the contract say about change orders?",
  "Are there any conflicts between specs and drawings?",
  "What work was completed last week?",
  "What open RFIs are unresolved?",
];

const steps = [{ id:"upload", label:"Upload" },{ id:"classify", label:"Classify" },{ id:"build", label:"Build" }];

export default function Documents({ appState }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"setup"|"ask">(appState.projectBuilt ? "ask" : "setup");
  const [setupStep, setSetupStep] = useState<SetupStep>("upload");
  const [classified, setClassified] = useState<any[]>([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, askLoading]);

  const handleClassified = (docs: any[]) => { setClassified(docs); setSetupStep("classify"); };

  const handleBuild = async (docs: any[]) => {
    setSetupLoading(true);
    setSetupError("");
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${base}/construction/build-project`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, classified_docs: docs }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Build failed."); }
      const data = await res.json();
      appState.setProjectBuilt(true);
      if (data.dashboard?.facts?.project_name) appState.setProjectName(data.dashboard.facts.project_name);
      else if (data.dashboard?.project_name) appState.setProjectName(data.dashboard.project_name);
      setSetupStep("done");
      setTimeout(() => setTab("ask"), 1200);
    } catch (e: any) {
      setSetupError(e.message || "Build failed.");
    } finally {
      setSetupLoading(false);
    }
  };

  const sendMessage = async (question: string) => {
    if (!question.trim() || askLoading) return;
    setAskError("");
    setMessages(prev => [...prev, { role:"user", content:question }]);
    setInput("");
    setAskLoading(true);
    try {
      const res = await askProject(appState.sessionId, question);
      setMessages(res.chat_history);
    } catch (e: any) {
      setAskError(e?.response?.data?.detail || "Failed to get answer.");
      setMessages(prev => prev.slice(0,-1));
    } finally {
      setAskLoading(false);
    }
  };

  const handleClear = async () => {
    await clearConstructionChat(appState.sessionId);
    setMessages([]);
    setAskError("");
  };

  const stepOrder = ["upload","classify","build","done"];

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", maxWidth:900, height:"calc(100vh - 52px)", display:"flex", flexDirection:"column" }}>

      <div style={{ marginBottom:20, flexShrink:0 }}>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:12 }}>Documents</h1>
        <div style={{ display:"flex", gap:4, borderBottom:"1px solid rgba(255,255,255,0.07)", paddingBottom:0 }}>
          {[{ id:"setup", label:"Project Setup" },{ id:"ask", label:"Ask Your Documents" }].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)} style={{ padding:"8px 16px", borderRadius:"8px 8px 0 0", border:"none", background:tab===t.id?"#1c2535":"transparent", color:tab===t.id?"#38bfff":"rgba(255,255,255,0.35)", fontSize:13, fontWeight:tab===t.id?600:400, cursor:"pointer", fontFamily:F, borderBottom:tab===t.id?"2px solid #00a8f0":"2px solid transparent", transition:"all 0.15s", marginBottom:-1 }}>
              {t.label}
              {t.id==="ask" && appState.projectBuilt && <span style={{ marginLeft:6, background:"rgba(34,211,160,0.15)", color:"#22d3a0", fontSize:9, padding:"1px 5px", borderRadius:3, fontFamily:M }}>READY</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── SETUP TAB ── */}
      {tab==="setup" && (
        <div style={{ flex:1, overflowY:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:24 }}>
            {steps.map((s,i)=>{
              const current = stepOrder.indexOf(setupStep);
              const idx = stepOrder.indexOf(s.id);
              const done = current>idx; const active = current===idx;
              return (
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:active?"rgba(0,168,240,0.15)":done?"rgba(34,211,160,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${active?"rgba(0,168,240,0.4)":done?"rgba(34,211,160,0.25)":"rgba(255,255,255,0.08)"}` }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:active?"#00a8f0":done?"#22d3a0":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:active||done?"#fff":"rgba(255,255,255,0.3)", fontFamily:M }}>
                      {done?"✓":i+1}
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:active?"#38bfff":done?"#22d3a0":"rgba(255,255,255,0.3)" }}>{s.label}</span>
                  </div>
                  {i<steps.length-1 && <div style={{ width:24, height:1, background:"rgba(255,255,255,0.1)" }}/>}
                </div>
              );
            })}
          </div>

          {setupError && (
            <div style={{ display:"flex", gap:10, padding:"12px 16px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:20 }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {setupError}
            </div>
          )}

          {setupStep==="upload" && (
            <div style={card({ padding:24 })}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Upload Project Documents</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Upload contracts, drawings, specs, RFIs, daily reports — all at once. AI will auto-classify each one.</div>
              <FileUpload sessionId={appState.sessionId} loading={setupLoading} setLoading={setSetupLoading} setError={setSetupError} onUploadComplete={handleClassified}/>
            </div>
          )}

          {setupStep==="classify" && (
            <div style={card({ padding:24 })}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Review Classifications</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>AI has classified your documents. Fix any incorrect types before building the index.</div>
              <DocClassifier classified={classified} onBuild={handleBuild} loading={setupLoading} setError={setSetupError}/>
            </div>
          )}

          {setupStep==="done" && (
            <div style={card({ padding:24, borderColor:"rgba(34,211,160,0.25)" })}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"rgba(34,211,160,0.1)", border:"1px solid rgba(34,211,160,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CheckCircle size={22} color="#22d3a0"/>
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#22d3a0" }}>Project Built Successfully</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{classified.length} documents indexed — switching to Q&A...</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>navigate("/dashboard")} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, boxShadow:"0 0 16px rgba(0,168,240,0.25)" }}>Go to Dashboard</button>
                <button onClick={()=>setTab("ask")} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>Ask Documents</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ASK TAB ── */}
      {tab==="ask" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
          {!appState.projectBuilt ? (
            <div style={{ ...card(), padding:32, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📂</div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No project built yet</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Set up your project first to enable document Q&A</div>
              <button onClick={()=>setTab("setup")} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>Go to Setup</button>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>Ask Your Project</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Searching across all documents in <span style={{ color:"#f0f4f8" }}>{appState.projectName||"your project"}</span></div>
                </div>
                {messages.length>0 && (
                  <button onClick={handleClear} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", fontFamily:F }}>
                    <Trash2 size={12}/> Clear
                  </button>
                )}
              </div>

              {messages.length===0 && (
                <div style={{ ...card(), padding:20, marginBottom:16, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <Lightbulb size={14} color="#f59e0b"/>
                    <span style={{ fontSize:12, fontWeight:600 }}>Construction-specific questions</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {EXAMPLE_QUESTIONS.map((q,i)=>(
                      <button key={i} onClick={()=>sendMessage(q)} style={{ textAlign:"left", padding:"9px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)", color:"rgba(255,255,255,0.55)", fontSize:12, cursor:"pointer", fontFamily:F, transition:"all 0.15s" }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(0,168,240,0.3)";(e.currentTarget as HTMLButtonElement).style.color="#f0f4f8";}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.07)";(e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.55)";}}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, marginBottom:14, minHeight:0 }}>
                {messages.map((msg,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, flexDirection:msg.role==="user"?"row-reverse":"row" }}>
                    {msg.role==="assistant" && (
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(0,168,240,0.2)", border:"1px solid rgba(0,168,240,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                        <Bot size={13} color="#38bfff"/>
                      </div>
                    )}
                    <div style={{ maxWidth:520 }}>
                      <div style={ msg.role==="user" ? { background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", borderRadius:"16px 16px 4px 16px", padding:"10px 14px", fontSize:13, lineHeight:1.55 } : { background:"#212d3d", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px 16px 16px 4px", padding:"10px 14px", fontSize:13, lineHeight:1.55, color:"#f0f4f8" }}>
                        {msg.content}
                      </div>
                      {msg.role==="assistant" && (
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4, paddingLeft:4 }}>
                          <FileText size={10} color="rgba(255,255,255,0.25)"/>
                          <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:M }}>Searched across all project documents</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {askLoading && (
                  <div style={{ display:"flex", gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(0,168,240,0.2)", border:"1px solid rgba(0,168,240,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Bot size={13} color="#38bfff"/>
                    </div>
                    <div style={{ background:"#212d3d", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px 16px 16px 4px", padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                      <Loader2 size={13} color="rgba(255,255,255,0.4)" style={{ animation:"spin 0.7s linear infinite" }}/>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Searching all project documents...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {askError && (
                <div style={{ display:"flex", gap:8, padding:"10px 14px", borderRadius:8, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:12, marginBottom:10, flexShrink:0 }}>
                  <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/> {askError}
                </div>
              )}

              <div style={{ ...card(), padding:16, flexShrink:0 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
                  <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input);}}} placeholder="Ask anything across all your project documents..." rows={2} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", resize:"none", lineHeight:1.5 }}/>
                  <button onClick={()=>sendMessage(input)} disabled={!input.trim()||askLoading} style={{ padding:"10px 14px", borderRadius:8, border:"none", background:!input.trim()||askLoading?"rgba(0,168,240,0.35)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", cursor:!input.trim()||askLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {askLoading ? <Loader2 size={15} style={{ animation:"spin 0.7s linear infinite" }}/> : <Send size={15}/>}
                  </button>
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:8, fontFamily:M }}>{messages.length} messages · Searches contracts, drawings, specs, RFIs, daily reports</div>
              </div>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}