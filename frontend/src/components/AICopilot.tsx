import { useState, useRef, useEffect, useCallback } from "react";
import type { AppState } from "../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Step {
  thought: string;
  action: string;
  observation: string;
}

interface AgentMessage {
  role: "user" | "ai";
  text: string;
  streaming?: boolean;
  steps?: Step[];
  agentUsed?: string;
  toolsCalled?: string[];
  activeTools?: string[];   // tools currently running (streaming)
  rating?: 1 | -1 | null;
  question?: string;        // stored for feedback submission
}

const suggestions = [
  "What are the open RFIs?",
  "Summarize this week's delays",
  "What tasks are overdue?",
  "Show weather risk summary",
  "Any critical punch items?",
  "What's the project completion status?",
];

export default function AICopilot({ appState }: { appState: AppState }) {
  const [open, setOpen]                   = useState(false);
  const [messages, setMessages]           = useState<AgentMessage[]>([]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const bottomRef                         = useRef<HTMLDivElement>(null);
  const abortRef                          = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);

    // Cancel any ongoing stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMessages(prev => [...prev, { role: "user", text: q }]);
    // Placeholder AI message
    setMessages(prev => [...prev, {
      role: "ai", text: "", streaming: true,
      agentUsed: "", toolsCalled: [], activeTools: [], question: q,
    }]);

    try {
      const res = await fetch(`${API}/agent/stream`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ session_id: appState.sessionId || "demo", message: q }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let agentUsed = "";
      let toolsCalled: string[] = [];
      let activeTools: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: Record<string, any>;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          if (data.type === "meta") {
            agentUsed = data.agent_used ?? "";
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], agentUsed };
              return updated;
            });
          }

          if (data.type === "token") {
            setMessages(prev => {
              const updated = [...prev];
              const last    = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, text: last.text + data.content };
              return updated;
            });
          }

          if (data.type === "tool_start") {
            activeTools = [...activeTools, data.tool];
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], activeTools: [...activeTools] };
              return updated;
            });
          }

          if (data.type === "tool_end") {
            activeTools  = activeTools.filter(t => t !== data.tool);
            toolsCalled  = [...new Set([...toolsCalled, data.tool])];
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                activeTools: [...activeTools],
                toolsCalled: [...toolsCalled],
              };
              return updated;
            });
          }

          if (data.type === "done") {
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role:        "ai",
                text:        data.answer || updated[updated.length - 1].text,
                streaming:   false,
                agentUsed:   data.agent_used || agentUsed,
                toolsCalled: data.tools_called || toolsCalled,
                activeTools: [],
                rating:      null,
                question:    q,
              };
              return updated;
            });
          }

          if (data.type === "error") {
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "ai", text: data.message, streaming: false, rating: null, question: q,
              };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai", text: "Something went wrong. Please try again.", streaming: false,
        };
        return updated;
      });
    }
    setLoading(false);
  }, [input, loading, appState.sessionId]);

  const submitFeedback = async (idx: number, rating: 1 | -1) => {
    const msg = messages[idx];
    if (!msg || msg.role !== "ai" || !msg.question) return;

    setMessages(prev => {
      const updated = [...prev];
      updated[idx]  = { ...updated[idx], rating };
      return updated;
    });

    try {
      await fetch(`${API}/eval/feedback`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          session_id:  appState.sessionId || "demo",
          question:    msg.question,
          answer:      msg.text,
          agent_used:  msg.agentUsed || "",
          tools_called: msg.toolsCalled || [],
          rating,
        }),
      });
    } catch { /* non-blocking */ }
  };

  const toggleSteps = (idx: number) =>
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        @keyframes copilotSlideUp {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes copilotPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(74,222,128,0.4); }
          50%      { box-shadow:0 0 0 8px rgba(74,222,128,0); }
        }
        @keyframes copilotDot {
          0%,80%,100%{transform:scale(0.6);opacity:0.4}
          40%{transform:scale(1);opacity:1}
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes toolPulse {
          0%,100%{opacity:0.5} 50%{opacity:1}
        }
        .copilot-input {
          flex:1; background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:8px; padding:8px 12px;
          color:#fff; font-family:'Syne',sans-serif; font-size:13px;
          outline:none; resize:none;
        }
        .copilot-input:focus { border-color:rgba(74,222,128,0.4); }
        .copilot-input::placeholder { color:rgba(255,255,255,0.2); }
        .tool-chip {
          display:inline-block; padding:2px 7px; border-radius:4px;
          background:rgba(74,222,128,0.12); border:1px solid rgba(74,222,128,0.25);
          color:#4ade80; font-size:10px; font-family:'IBM Plex Mono',monospace; margin:2px;
        }
        .tool-chip-active {
          display:inline-block; padding:2px 7px; border-radius:4px;
          background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.3);
          color:#fbbf24; font-size:10px; font-family:'IBM Plex Mono',monospace;
          margin:2px; animation:toolPulse 1s ease-in-out infinite;
        }
        .agent-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:2px 8px; border-radius:4px;
          background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.2);
          color:rgba(74,222,128,0.7); font-size:10px;
          font-family:'IBM Plex Mono',monospace; margin-bottom:6px;
        }
        .cursor { display:inline-block; width:2px; height:12px; background:#4ade80; margin-left:1px; animation:blink 1s step-end infinite; vertical-align:text-bottom; }
        .feedback-btn {
          background:none; border:none; cursor:pointer; padding:3px 6px; border-radius:4px;
          font-size:13px; transition:background 0.15s; color:rgba(255,255,255,0.3);
        }
        .feedback-btn:hover { background:rgba(255,255,255,0.08); }
        .feedback-btn.active-up   { color:#4ade80; }
        .feedback-btn.active-down { color:#f87171; }
      `}</style>

      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          position:"fixed", bottom:28, right:28, zIndex:1000,
          width:52, height:52, borderRadius:"50%",
          background:"linear-gradient(135deg,#4ade80,#16a34a)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          animation:"copilotPulse 3s ease-in-out infinite",
          boxShadow:"0 4px 20px rgba(74,222,128,0.3)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#0a0f0a" stroke="#0a0f0a" strokeWidth="1.5"/>
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:1000,
          width:420, height:600,
          background:"#111827",
          border:"1px solid rgba(74,222,128,0.2)",
          borderRadius:16,
          display:"flex", flexDirection:"column",
          fontFamily:"'Syne',sans-serif",
          animation:"copilotSlideUp 0.25s ease",
          boxShadow:"0 20px 60px rgba(0,0,0,0.6),0 0 0 1px rgba(74,222,128,0.1)",
        }}>
          {/* Header */}
          <div style={{
            padding:"14px 16px",
            borderBottom:"1px solid rgba(255,255,255,0.06)",
            display:"flex", alignItems:"center", gap:10,
          }}>
            <div style={{
              width:28, height:28, borderRadius:8,
              background:"linear-gradient(135deg,#4ade80,#16a34a)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#0a0f0a"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#fff", fontSize:13, fontWeight:700 }}>PRISM AI Agent</div>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10, fontFamily:"'IBM Plex Mono',monospace" }}>
                Streaming · Multi-agent · RAG
              </div>
            </div>
            <button onClick={() => { setOpen(false); abortRef.current?.abort(); }} style={{
              background:"none", border:"none", color:"rgba(255,255,255,0.3)",
              cursor:"pointer", fontSize:18, lineHeight:1,
            }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
            {messages.length === 0 && (
              <div>
                <div style={{ color:"rgba(255,255,255,0.25)", fontSize:12, textAlign:"center", marginBottom:16, marginTop:8 }}>
                  Ask anything — agents query live project data
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)} style={{
                      background:"rgba(255,255,255,0.04)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:6, padding:"5px 10px",
                      color:"rgba(255,255,255,0.5)", fontSize:11,
                      cursor:"pointer", fontFamily:"'Syne',sans-serif", textAlign:"left",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:m.role === "user" ? "flex-end" : "flex-start" }}>
                {/* User bubble */}
                {m.role === "user" && (
                  <div style={{
                    maxWidth:"85%", padding:"9px 12px", borderRadius:10,
                    background:"linear-gradient(135deg,#4ade80,#16a34a)",
                    color:"#0a0f0a", fontSize:12, lineHeight:1.6, fontWeight:600,
                  }}>{m.text}</div>
                )}

                {/* AI response */}
                {m.role === "ai" && (
                  <div style={{ maxWidth:"95%", width:"100%" }}>
                    {/* Agent badge */}
                    {m.agentUsed && (
                      <div className="agent-badge">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {m.agentUsed}
                      </div>
                    )}

                    {/* Active tool indicator */}
                    {m.activeTools && m.activeTools.length > 0 && (
                      <div style={{ marginBottom:4, display:"flex", flexWrap:"wrap" }}>
                        {m.activeTools.map(t => (
                          <span key={t} className="tool-chip-active">⚙ {t.replace("get_", "")}</span>
                        ))}
                      </div>
                    )}

                    {/* Answer text */}
                    <div style={{
                      padding:"9px 12px", borderRadius:10,
                      background:"rgba(255,255,255,0.06)",
                      color:"rgba(255,255,255,0.85)",
                      fontSize:12, lineHeight:1.6, whiteSpace:"pre-wrap",
                    }}>
                      {m.text || (m.streaming ? "" : "No answer generated.")}
                      {m.streaming && <span className="cursor" />}
                    </div>

                    {/* Completed tools + feedback row */}
                    {!m.streaming && (
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
                        {/* Tool chips */}
                        <div style={{ display:"flex", flexWrap:"wrap", flex:1 }}>
                          {[...new Set(m.toolsCalled || [])].map(t => (
                            <span key={t} className="tool-chip">{t.replace("get_", "")}</span>
                          ))}
                        </div>

                        {/* Thumbs feedback */}
                        {m.question && (
                          <div style={{ display:"flex", gap:2, flexShrink:0, marginLeft:6 }}>
                            <button
                              className={`feedback-btn${m.rating === 1 ? " active-up" : ""}`}
                              onClick={() => submitFeedback(i, 1)}
                              title="Good answer"
                            >👍</button>
                            <button
                              className={`feedback-btn${m.rating === -1 ? " active-down" : ""}`}
                              onClick={() => submitFeedback(i, -1)}
                              title="Bad answer"
                            >👎</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reasoning steps */}
                    {m.steps && m.steps.length > 0 && (
                      <>
                        <button className="steps-toggle" onClick={() => toggleSteps(i)} style={{
                          display:"flex", alignItems:"center", gap:5,
                          color:"rgba(255,255,255,0.35)", fontSize:10,
                          background:"none", border:"none", cursor:"pointer",
                          fontFamily:"'IBM Plex Mono',monospace", padding:"4px 0 2px", marginTop:4,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: expandedSteps[i] ? "rotate(90deg)" : "none", transition:"transform 0.15s" }}>
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {expandedSteps[i] ? "Hide" : "Show"} reasoning ({m.steps.length} step{m.steps.length !== 1 ? "s" : ""})
                        </button>
                        {expandedSteps[i] && (
                          <div style={{ marginTop:6, padding:"10px 12px", background:"rgba(0,0,0,0.3)", borderRadius:8, border:"1px solid rgba(255,255,255,0.05)" }}>
                            {m.steps.map((step, si) => (
                              <div key={si} style={{ borderLeft:"2px solid rgba(74,222,128,0.25)", paddingLeft:8, marginBottom:6 }}>
                                {step.thought && (
                                  <div>
                                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'IBM Plex Mono',monospace", color:"rgba(147,197,253,0.7)" }}>Thought</div>
                                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", lineHeight:1.5, marginTop:2 }}>{step.thought}</div>
                                  </div>
                                )}
                                <div style={{ marginTop:4 }}>
                                  <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'IBM Plex Mono',monospace", color:"rgba(74,222,128,0.7)" }}>Action → {step.action}</div>
                                </div>
                                {step.observation && (
                                  <div style={{ marginTop:4 }}>
                                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'IBM Plex Mono',monospace", color:"rgba(251,191,36,0.7)" }}>Observation</div>
                                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)", lineHeight:1.5, marginTop:2, fontFamily:"'IBM Plex Mono',monospace" }}>
                                      {step.observation.length > 200 ? step.observation.slice(0, 200) + "…" : step.observation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Global loading dots (before first token arrives) */}
            {loading && messages[messages.length - 1]?.text === "" && (
              <div style={{ display:"flex", gap:4, padding:"4px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:5, height:5, borderRadius:"50%", background:"#4ade80",
                    animation:`copilotDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding:"10px 14px",
            borderTop:"1px solid rgba(255,255,255,0.06)",
            display:"flex", gap:8,
          }}>
            <textarea
              className="copilot-input"
              rows={1}
              placeholder="Ask about RFIs, schedule, risks, leases…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{
              width:34, height:34, borderRadius:8, border:"none",
              background:input.trim() ? "#4ade80" : "rgba(255,255,255,0.06)",
              cursor:input.trim() ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, alignSelf:"flex-end", transition:"background 0.15s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={input.trim() ? "#0a0f0a" : "rgba(255,255,255,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
