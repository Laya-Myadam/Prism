import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";


const statusColor: Record<string,string> = { "On Track":"#22d3a0", "At Risk":"#f59e0b", "Delayed":"#f43f5e" };
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"8px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" };
const lbl: React.CSSProperties = { fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", display:"block", marginBottom:6 };

export default function Projects({ appState }: { appState: AppState }) {
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", client:"", value:"", end_date:"" });
  const [selected, setSelected] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/construction/projects/${appState.sessionId}`);
      if (r.ok) {
        const data = await r.json();
        setUserProjects(data);
      }
    } catch {}
    setLoading(false);
  };

  const addProject = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/construction/projects/create`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, name: form.name, client: form.client, value: form.value||"$0", end_date: form.end_date }),
      });
      if (r.ok) {
        const data = await r.json();
        setUserProjects(prev => [data, ...prev]);
        setForm({ name:"", client:"", value:"", end_date:"" });
        setShowForm(false);
      }
    } catch {}
    setSaving(false);
  };

  const updateProject = async (id: string, updates: any) => {
    setUserProjects(prev => prev.map(p => p.id === id ? {...p, ...updates} : p));
    try {
      await fetch(`${API}/construction/projects/update`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, id, ...updates }),
      });
    } catch {}
  };

  const allProjects = [
    ...(appState.projectBuilt && appState.projectName ? [{
      id: "live-upload",
      name: appState.projectName,
      client: "Your Project",
      value: "—",
      status: "On Track",
      completion: 0,
      phase: "Indexed",
      rfi: 0,
      workers: 0,
      start_date: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
      end_date: "—",
      isReal: true,
    }] : []),
    ...userProjects.map(p => ({...p, isReal: p.session_id !== "demo"})),
  ];

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:3 }}>Projects</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M }}>{allProjects.length} projects · {userProjects.filter(p=>p.session_id==="demo").length} demo · {userProjects.filter(p=>p.session_id!=="demo").length} yours</p>
        </div>
        <button onClick={()=>setShowForm(true)} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, boxShadow:"0 0 16px rgba(0,168,240,0.25)" }}>+ New Project</button>
      </div>

      <div style={{ padding:"8px 14px", borderRadius:7, background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.15)", marginBottom:20, fontSize:12, color:"rgba(245,158,11,0.8)" }}>
        📋 Demo projects illustrate how PRISM works. Your created projects are saved to the database.
      </div>

      {showForm && (
        <div style={{ background:"rgba(0,168,240,0.05)", border:"1px solid rgba(0,168,240,0.2)", borderRadius:12, padding:20, marginBottom:20, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
          {[{key:"name",label:"Project Name",ph:"Riverside Heights..."},{key:"client",label:"Client",ph:"Pinnacle Developers"},{key:"value",label:"Contract Value",ph:"$11.4M"},{key:"end_date",label:"End Date",ph:"Dec 2025"}].map(f=>(
            <div key={f.key}><label style={lbl}>{f.label.toUpperCase()}</label><input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inp}/></div>
          ))}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addProject} disabled={saving} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontWeight:600, cursor:"pointer", fontFamily:F, fontSize:13 }}>{saving?"Saving…":"Add"}</button>
            <button onClick={()=>setShowForm(false)} style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"8px 12px", cursor:"pointer", fontFamily:F, fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,0.2)", fontSize:13 }}>Loading projects…</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {allProjects.map((p:any)=>(
          <div key={p.id} onClick={()=>setSelected(selected===p.id?null:p.id)}
            style={{ background:"#1c2535", border:`1px solid ${selected===p.id?"rgba(0,168,240,0.3)":p.isReal?"rgba(34,211,160,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:12, padding:20, cursor:"pointer", transition:"all 0.2s", position:"relative" as const }}>

            <div style={{ position:"absolute", top:12, right:12 }}>
              {p.isDemo && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(245,158,11,0.12)", color:"#f59e0b", fontFamily:M, border:"1px solid rgba(245,158,11,0.2)" }}>DEMO</span>}
              {p.isReal && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(34,211,160,0.12)", color:"#22d3a0", fontFamily:M, border:"1px solid rgba(34,211,160,0.2)" }}>LIVE</span>}
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, paddingRight:48 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:3, letterSpacing:"-0.01em" }}>{p.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{p.client}</div>
              </div>
              {p.isDemo ? (
                <span style={{ fontSize:10, padding:"3px 8px", borderRadius:100, background:`${statusColor[p.status]||"#64748b"}18`, color:statusColor[p.status]||"#64748b", fontFamily:M, border:`1px solid ${statusColor[p.status]||"#64748b"}35`, flexShrink:0 }}>{p.status}</span>
              ) : (
                <select value={p.status} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();updateProject(p.id,{status:e.target.value});}}
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"3px 7px", color:statusColor[p.status]||"#f0f4f8", fontSize:11, fontFamily:F, cursor:"pointer" }}>
                  {["On Track","At Risk","Delayed"].map(s=><option key={s} style={{ background:"#1c2535" }}>{s}</option>)}
                </select>
              )}
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Completion</span>
                <span style={{ fontSize:11, color:"#f0f4f8", fontFamily:M }}>{p.completion}%</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:2 }}>
                <div style={{ height:"100%", width:`${p.completion}%`, borderRadius:2, background:statusColor[p.status]||"#22d3a0", transition:"width 0.7s ease" }}/>
              </div>
              {p.isReal && !p.isDemo && (
                <input type="range" min={0} max={100} value={p.completion} onClick={e=>e.stopPropagation()}
                  onChange={e=>{e.stopPropagation();updateProject(p.id,{completion:parseInt(e.target.value)});}}
                  style={{ width:"100%", marginTop:6, accentColor:"#00a8f0", cursor:"pointer" }}/>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
              {[{label:"Value",val:p.value},{label:"Phase",val:p.phase},{label:"RFIs",val:p.rfi},{label:"Workers",val:p.workers}].map(s=>(
                <div key={s.label}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:M, marginBottom:3 }}>{s.label}</div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {selected===p.id && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8, flexWrap:"wrap" }}>
                <button onClick={e=>{e.stopPropagation();appState.setProjectName(p.name);}} style={{ background:"rgba(0,168,240,0.12)", border:"1px solid rgba(0,168,240,0.25)", color:"#38bfff", borderRadius:6, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:F }}>Set Active</button>
                {p.isDemo && <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", padding:"5px 0", fontFamily:M }}>Demo — upload your docs to replace</span>}
                {p.isReal && <span style={{ fontSize:11, color:"rgba(34,211,160,0.5)", padding:"5px 0", fontFamily:M }}>✓ Saved to database</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
