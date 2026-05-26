import { useState, useEffect } from "react";
import type { AppState, AIProvider } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Settings({ appState }: { appState: AppState }) {
  const [form, setForm] = useState({
    name: appState.user?.name || "",
    email: appState.user?.email || "",
    company: appState.user?.company || "",
    role: appState.user?.role || "",
    notifications: true,
    autoRisk: true,
    emailAlerts: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!appState.user?.uid) return;
    fetch(`${API}/user/settings/${appState.user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d) setForm(prev => ({
          ...prev,
          notifications: d.notifications ?? true,
          autoRisk: d.auto_risk ?? true,
          emailAlerts: d.email_alerts ?? false,
        }));
      })
      .catch(() => {});
  }, [appState.user?.uid]);

  const roles = ["Project Manager","Site Engineer","Architect","Quantity Surveyor","Safety Officer","Director"];
  const F = "'Outfit',sans-serif";
  const M = "'JetBrains Mono',monospace";
  const inp: React.CSSProperties = { width:"100%", background:"#1e2a3a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#f0f4f8", fontFamily:F, fontSize:14, outline:"none", transition:"all 0.2s" };
  const lbl: React.CSSProperties = { fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:7 };
  const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24, marginBottom:14 };
  const secLabel: React.CSSProperties = { fontSize:10, fontWeight:600, color:"rgba(0,168,240,0.7)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:20, display:"block" };

  const focusIn = (e: any) => { e.target.style.borderColor="rgba(0,168,240,0.5)"; e.target.style.boxShadow="0 0 0 3px rgba(0,168,240,0.1)"; };
  const focusOut = (e: any) => { e.target.style.borderColor="rgba(255,255,255,0.1)"; e.target.style.boxShadow="none"; };

  const save = async () => {
    if (!appState.user) return;
    const updated = { ...appState.user, name: form.name, company: form.company, role: form.role };
    appState.setUser(updated);
    try {
      await fetch(`${API}/user/settings/save`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: appState.user.uid,
          session_id: appState.sessionId,
          notifications: form.notifications,
          auto_risk: form.autoRisk,
          email_alerts: form.emailAlerts,
        }),
      });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", maxWidth:640 }}>

      <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:24 }}>Settings</h1>

      {/* Profile */}
      <div style={card}>
        <span style={secLabel}>Profile</span>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#00a8f0,#0054a0)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, fontWeight:700 }}>
            {form.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:600 }}>{form.name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:M, marginTop:2 }}>{form.role} · {form.company || "No company set"}</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[{k:"name",l:"Full Name"},{k:"email",l:"Email Address"},{k:"company",l:"Company"}].map(f=>(
            <div key={f.k} style={f.k==="company"?{gridColumn:"1 / -1"}:{}}>
              <label style={lbl}>{f.l}</label>
              <input
                style={{...inp, opacity: f.k==="email" ? 0.5 : 1}}
                value={(form as any)[f.k]}
                disabled={f.k==="email"}
                onChange={e=>f.k!=="email" && setForm(p=>({...p,[f.k]:e.target.value}))}
                onFocus={f.k!=="email" ? focusIn : undefined}
                onBlur={f.k!=="email" ? focusOut : undefined}
              />
            </div>
          ))}
          <div>
            <label style={lbl}>Role</label>
            <select style={{...inp,cursor:"pointer"}} value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} onFocus={focusIn} onBlur={focusOut}>
              {roles.map(r=><option key={r} style={{ background:"#1c2535", color:"#f0f4f8" }}>{r}</option>)}
            </select>
          </div>
        </div>
        <button onClick={save} style={{ marginTop:20, background:saved?"rgba(0,168,240,0.1)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:saved?"#00a8f0":"#fff", border:saved?"1px solid rgba(0,168,240,0.3)":"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, transition:"all 0.2s", boxShadow:saved?"none":"0 0 16px rgba(0,168,240,0.25)" }}>
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      {/* Preferences */}
      <div style={card}>
        <span style={secLabel}>Preferences</span>
        {[
          {k:"notifications",l:"In-app notifications",sub:"Show risk alerts and updates in the dashboard"},
          {k:"autoRisk",l:"Auto risk scanning",sub:"Automatically scan documents for risks on upload"},
          {k:"emailAlerts",l:"Email alerts",sub:"Send overdue RFI and schedule alerts via email"},
        ].map((s,i,arr)=>(
          <div key={s.k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{s.l}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{s.sub}</div>
            </div>
            <button onClick={()=>setForm(p=>({...p,[s.k]:!(p as any)[s.k]}))} style={{ width:40, height:22, borderRadius:11, border:"none", cursor:"pointer", background:(form as any)[s.k]?"#00a8f0":"rgba(255,255,255,0.1)", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff", position:"absolute", top:4, left:(form as any)[s.k]?22:4, transition:"left 0.2s" }}/>
            </button>
          </div>
        ))}
      </div>

      {/* AI Model Provider */}
      <div style={card}>
        <span style={secLabel}>AI Model Provider</span>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:16, lineHeight:1.6 }}>
          Groq LLaMA is the default for all tasks. Switch individual tasks to HuggingFace models to compare outputs or test specialized models.
        </div>
        {([
          { task:"summarization" as keyof AIProvider, label:"Summarization", sub:"Daily Log narrative · Meeting summary · PM Log", options:[
            { value:"groq",           display:"Groq — LLaMA 3.1 8B" },
            { value:"bart-large-cnn", display:"HuggingFace — BART-large-cnn" },
          ]},
          { task:"classification" as keyof AIProvider, label:"Text Classification", sub:"Document type · RFI priority · Change order risk", options:[
            { value:"groq",            display:"Groq — LLaMA 3.1 8B" },
            { value:"bart-large-mnli", display:"HuggingFace — BART-large-mnli (zero-shot)" },
          ]},
          { task:"ner" as keyof AIProvider, label:"Named Entity Recognition", sub:"Contracts · Obligations · Knowledge Graph entities", options:[
            { value:"groq",          display:"Groq — LLaMA 3.1 8B" },
            { value:"bert-base-NER", display:"HuggingFace — BERT-base-NER" },
          ]},
          { task:"qa" as keyof AIProvider, label:"Extractive QA", sub:"Contract clause lookup · Spec fact extraction", options:[
            { value:"groq",                display:"Groq — LLaMA 3.1 8B" },
            { value:"roberta-base-squad2", display:"HuggingFace — RoBERTa-base-SQuAD2" },
          ]},
        ] as { task: keyof AIProvider; label: string; sub: string; options: {value: string; display: string}[] }[]).map((row, i, arr) => (
          <div key={row.task} style={{ padding:"14px 0", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{row.label}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{row.sub}</div>
              </div>
              <select
                value={appState.aiProvider[row.task]}
                onChange={e => appState.setAiProvider({ ...appState.aiProvider, [row.task]: e.target.value as any })}
                style={{ ...inp, width:"auto", minWidth:280, fontSize:12, padding:"7px 10px", cursor:"pointer",
                  borderColor: appState.aiProvider[row.task] !== "groq" ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)",
                  color: appState.aiProvider[row.task] !== "groq" ? "#a78bfa" : "#f0f4f8",
                }}
              >
                {row.options.map(o => <option key={o.value} value={o.value} style={{ background:"#1c2535", color:"#f0f4f8" }}>{o.display}</option>)}
              </select>
            </div>
            {appState.aiProvider[row.task] !== "groq" && (
              <div style={{ marginTop:8, padding:"6px 10px", borderRadius:6, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.15)", fontSize:11, color:"rgba(167,139,250,0.8)", fontFamily:M }}>
                ⚡ HuggingFace Inference API — requires HUGGINGFACE_API_KEY · free tier rate limited
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => appState.setAiProvider({ summarization:"groq", classification:"groq", ner:"groq", qa:"groq" })}
          style={{ marginTop:16, padding:"8px 16px", borderRadius:7, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer", fontFamily:F }}
        >
          Reset all to Groq
        </button>
      </div>

      {/* System */}
      <div style={card}>
        <span style={secLabel}>System</span>
        {[
          ["AI Model","LLaMA 3.1 8B (Groq)"],["Vision Model","Gemini 2.0 Flash"],
          ["Embeddings","all-MiniLM-L6-v2"],["Vector Store","FAISS (In-memory)"],["Version","Prism v2.0"],
        ].map(([l,v])=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{l}</span>
            <span style={{ fontSize:12, fontFamily:M, color:"rgba(255,255,255,0.65)" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={appState.logout} style={{ background:"rgba(244,63,94,0.08)", color:"#f43f5e", border:"1px solid rgba(244,63,94,0.2)", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>
        Sign Out
      </button>
    </div>
  );
}
