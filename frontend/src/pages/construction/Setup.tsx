import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import FileUpload from "../../components/FileUpload";
import DocClassifier from "../../components/DocClassifier";
import { CheckCircle, AlertCircle } from "lucide-react";

interface Props { appState: AppState; }

type Step = "upload" | "classify" | "build" | "done";

const steps = [
  { id:"upload",   label:"Upload"   },
  { id:"classify", label:"Classify" },
  { id:"build",    label:"Build"    },
];

export default function Setup({ appState }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [classified, setClassified] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);

  const handleClassified = (docs: any[]) => {
    setClassified(docs);
    setStep("classify");
  };

  const handleBuild = async (docs: any[]) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/construction/build-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, classified_docs: docs }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Build failed."); }
      const data = await res.json();
      setDashboard(data.dashboard);
      appState.setProjectBuilt(true);
      if (data.dashboard?.project_name) appState.setProjectName(data.dashboard.project_name);
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Build failed.");
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 };

  return (
    <div style={{ padding:"28px 32px", fontFamily:"'Outfit',sans-serif", color:"#f0f4f8", maxWidth:760 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Project Setup</h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>Upload your project documents. AI will classify and index them automatically.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:28 }}>
        {steps.map((s, i) => {
          const stepOrder = ["upload","classify","build","done"];
          const current = stepOrder.indexOf(step);
          const idx = stepOrder.indexOf(s.id);
          const done = current > idx;
          const active = current === idx;
          return (
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:active?"rgba(0,168,240,0.15)":done?"rgba(34,211,160,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${active?"rgba(0,168,240,0.4)":done?"rgba(34,211,160,0.25)":"rgba(255,255,255,0.08)"}` }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:active?"#00a8f0":done?"#22d3a0":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:active||done?"#fff":"rgba(255,255,255,0.3)", fontFamily:"'JetBrains Mono',monospace" }}>
                  {done ? "✓" : i+1}
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:active?"#38bfff":done?"#22d3a0":"rgba(255,255,255,0.3)" }}>{s.label}</span>
              </div>
              {i < steps.length-1 && <div style={{ width:24, height:1, background:"rgba(255,255,255,0.1)" }}/>}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:10, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginBottom:20 }}>
          <AlertCircle size={15}/> {error}
        </div>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Upload Project Documents</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Upload contracts, drawings, specs, RFIs, daily reports — all at once</div>
          <FileUpload
            sessionId={appState.sessionId}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            onUploadComplete={handleClassified}
          />
        </div>
      )}

      {/* Step: Classify */}
      {step === "classify" && (
        <div style={card}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Review Classifications</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>AI has classified your documents. Correct any misclassifications before building.</div>
          <DocClassifier
            classified={classified}
            onBuild={handleBuild}
            loading={loading}
            setError={setError}
          />
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div style={{ ...card, borderColor:"rgba(34,211,160,0.25)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(34,211,160,0.1)", border:"1px solid rgba(34,211,160,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CheckCircle size={22} color="#22d3a0"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#22d3a0" }}>Project Built Successfully</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{classified.length} documents indexed and ready</div>
            </div>
          </div>

          {/* Dashboard preview */}
          {dashboard && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
              {[
                { label:"Documents", value: classified.length },
                { label:"Project Name", value: dashboard.project_name || appState.projectName || "—" },
                { label:"Status", value: "Ready" },
              ].map(m => (
                <div key={m.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{m.label}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#f0f4f8", letterSpacing:"-0.02em" }}>{m.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => navigate("/dashboard")} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:"0 0 16px rgba(0,168,240,0.25)" }}>
              Go to Dashboard
            </button>
            <button onClick={() => navigate("/construction/ask")} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              Ask Your Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}