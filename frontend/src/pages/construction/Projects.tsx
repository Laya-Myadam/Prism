import { useState } from "react";
import type { AppState } from "../../App";

// ── Demo projects — always present ────────────────────────────────────────────
const DEMO_PROJECTS = [
  { id:1, name:"Riverside Heights Mixed-Use", client:"Pinnacle Urban Developers", value:"$11.4M", status:"At Risk",  completion:61, phase:"Structure",  rfi:12, workers:34, start:"Jan 2025", end:"Dec 2025", isDemo:true },
  { id:2, name:"Westgate Commercial Tower",   client:"BuildRight Properties",      value:"$24.8M", status:"On Track", completion:38, phase:"Foundation", rfi:5,  workers:52, start:"Mar 2025", end:"Jun 2026", isDemo:true },
  { id:3, name:"Lakeside Residential Block C",client:"HomeFirst Developers",       value:"$6.2M",  status:"On Track", completion:84, phase:"Finishing",  rfi:2,  workers:18, start:"Aug 2024", end:"Apr 2025", isDemo:true },
];

const statusColor: Record<string,string> = { "On Track":"#22d3a0", "At Risk":"#f59e0b", "Delayed":"#f43f5e" };
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"8px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" };
const lbl: React.CSSProperties = { fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", display:"block", marginBottom:6 };

export default function Projects({ appState }: { appState: AppState }) {
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", client:"", value:"", end:"" });
  const [selected, setSelected] = useState<number|null>(null);

  // Merge demo + real uploaded project + manually added projects
  const allProjects = [
    ...DEMO_PROJECTS,
    // If user built a project via docs upload, show it as a real project card
    ...(appState.projectBuilt && appState.projectName ? [{
      id: 9999,
      name: appState.projectName,
      client: "Your Project",
      value: "—",
      status: "On Track",
      completion: 0,
      phase: "Indexed",
      rfi: 0,
      workers: 0,
      start: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
      end: "—",
      isDemo: false,
      isReal: true,
    }] : []),
    ...userProjects,
  ];

  const addProject = () => {
    if (!form.name) return;
    setUserProjects(p => [...p, {
      id: Date.now(), name:form.name, client:form.client, value:form.value||"$0",
      status:"On Track", completion:0, phase:"Planning", rfi:0, workers:0,
      start:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
      end:form.end, isDemo:false,
    }]);
    setForm({ name:"", client:"", value:"", end:"" });
    setShowForm(false);
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:3 }}>Projects</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M }}>{allProjects.length} projects · {DEMO_PROJECTS.length} demo · {allProjects.length - DEMO_PROJECTS.length} yours</p>
        </div>
        <button onClick={()=>setShowForm(true)} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, boxShadow:"0 0 16px rgba(0,168,240,0.25)" }}>+ New Project</button>
      </div>

      {/* Demo notice */}
      <div style={{ padding:"8px 14px", borderRadius:7, background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.15)", marginBottom:20, fontSize:12, color:"rgba(245,158,11,0.8)" }}>
        📋 Demo projects are shown to illustrate how PRISM works. Upload your own documents to create a live project.
      </div>

      {showForm && (
        <div style={{ background:"rgba(0,168,240,0.05)", border:"1px solid rgba(0,168,240,0.2)", borderRadius:12, padding:20, marginBottom:20, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
          {[{key:"name",label:"Project Name",ph:"Riverside Heights..."},{key:"client",label:"Client",ph:"Pinnacle Developers"},{key:"value",label:"Contract Value",ph:"$11.4M"},{key:"end",label:"End Date",ph:"Dec 2025"}].map(f=>(
            <div key={f.key}><label style={lbl}>{f.label.toUpperCase()}</label><input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inp}/></div>
          ))}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addProject} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontWeight:600, cursor:"pointer", fontFamily:F, fontSize:13 }}>Add</button>
            <button onClick={()=>setShowForm(false)} style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"8px 12px", cursor:"pointer", fontFamily:F, fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {allProjects.map((p:any)=>(
          <div key={p.id} onClick={()=>setSelected(selected===p.id?null:p.id)}
            style={{ background:"#1c2535", border:`1px solid ${selected===p.id?"rgba(0,168,240,0.3)":p.isReal?"rgba(34,211,160,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:12, padding:20, cursor:"pointer", transition:"all 0.2s", position:"relative" as const }}
            onMouseEnter={e=>{if(selected!==p.id)(e.currentTarget as HTMLDivElement).style.borderColor=p.isReal?"rgba(34,211,160,0.35)":"rgba(255,255,255,0.13)";}}
            onMouseLeave={e=>{if(selected!==p.id)(e.currentTarget as HTMLDivElement).style.borderColor=p.isReal?"rgba(34,211,160,0.2)":"rgba(255,255,255,0.07)";}}>

            {/* Demo / Live badge */}
            <div style={{ position:"absolute", top:12, right:12 }}>
              {p.isDemo && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(245,158,11,0.12)", color:"#f59e0b", fontFamily:M, border:"1px solid rgba(245,158,11,0.2)" }}>DEMO</span>}
              {p.isReal && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(34,211,160,0.12)", color:"#22d3a0", fontFamily:M, border:"1px solid rgba(34,211,160,0.2)" }}>LIVE</span>}
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, paddingRight:48 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:3, letterSpacing:"-0.01em" }}>{p.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{p.client}</div>
              </div>
              <span style={{ fontSize:10, padding:"3px 8px", borderRadius:100, background:`${statusColor[p.status]}18`, color:statusColor[p.status], fontFamily:M, border:`1px solid ${statusColor[p.status]}35`, flexShrink:0 }}>{p.status}</span>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Completion</span>
                <span style={{ fontSize:11, color:"#f0f4f8", fontFamily:M }}>{p.completion}%</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:2 }}>
                <div style={{ height:"100%", width:`${p.completion}%`, borderRadius:2, background:statusColor[p.status], transition:"width 0.7s ease" }}/>
              </div>
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
              <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8 }}>
                <button onClick={e=>{e.stopPropagation();appState.setProjectName(p.name);}} style={{ background:"rgba(0,168,240,0.12)", border:"1px solid rgba(0,168,240,0.25)", color:"#38bfff", borderRadius:6, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:F }}>Set Active</button>
                {!p.isDemo && <button onClick={e=>{e.stopPropagation();}} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.45)", borderRadius:6, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:F }}>View Docs</button>}
                {p.isDemo && <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", padding:"5px 0", fontFamily:M }}>Demo project — upload your docs to replace</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}