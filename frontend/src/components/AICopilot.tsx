import { useState, useRef, useEffect } from "react";
import type { AppState } from "../App";
import { askProject } from "../api/client";

interface Message {
  role: "user" | "ai";
  text: string;
}

const suggestions = [
  "What are the open RFIs?",
  "Summarize this week's delays",
  "Draft a delay notice",
  "Who is responsible for waterproofing?",
  "What tasks are overdue?",
  "Show me the risk flags",
];

export default function AICopilot({ appState }: { appState: AppState }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      if (!appState.projectBuilt) {
        setMessages(prev => [...prev, { role: "ai", text: "No project loaded yet. Please go to Documents and upload your project files first." }]);
      } else {
        const res = await askProject(appState.sessionId, q);
        setMessages(prev => [...prev, { role: "ai", text: res.answer }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        @keyframes copilotSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes copilotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
        }
        .copilot-input {
          flex: 1; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 8px 12px;
          color: #fff; font-family: 'Syne', sans-serif; font-size: 13px;
          outline: none; resize: none;
        }
        .copilot-input:focus { border-color: rgba(74,222,128,0.4); }
        .copilot-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "copilotPulse 3s ease-in-out infinite",
          boxShadow: "0 4px 20px rgba(74,222,128,0.3)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#0a0f0a" stroke="#0a0f0a" strokeWidth="1.5"/>
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 360, height: 520,
          background: "#111827",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          fontFamily: "'Syne', sans-serif",
          animation: "copilotSlideUp 0.25s ease",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,222,128,0.1)",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #4ade80, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#0a0f0a"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>AI Copilot</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                {appState.projectName || "No project loaded"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              cursor: "pointer", fontSize: 18, lineHeight: 1,
            }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 && (
              <div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", marginBottom: 16, marginTop: 8 }}>
                  Ask anything about your project
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)} style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6, padding: "5px 10px",
                      color: "rgba(255,255,255,0.5)", fontSize: 11,
                      cursor: "pointer", fontFamily: "'Syne', sans-serif",
                      textAlign: "left",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 12px", borderRadius: 10,
                  background: m.role === "user"
                    ? "linear-gradient(135deg, #4ade80, #16a34a)"
                    : "rgba(255,255,255,0.06)",
                  color: m.role === "user" ? "#0a0f0a" : "rgba(255,255,255,0.85)",
                  fontSize: 12, lineHeight: 1.6, fontWeight: m.role === "user" ? 600 : 400,
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: "50%", background: "#4ade80",
                    animation: `copilotDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            )}
            <style>{`@keyframes copilotDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 8,
          }}>
            <textarea
              className="copilot-input"
              rows={1}
              placeholder="Ask about your project..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{
              width: 34, height: 34, borderRadius: 8, border: "none",
              background: input.trim() ? "#4ade80" : "rgba(255,255,255,0.06)",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, alignSelf: "flex-end",
              transition: "background 0.15s",
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