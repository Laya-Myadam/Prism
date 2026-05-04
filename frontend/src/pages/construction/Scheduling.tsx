import { useState } from "react";
import type { AppState } from "../../App";

const initialTasks = [
  { id:1, name:"Site Preparation",           phase:"Foundation", start:0,  duration:10, progress:100, assignee:"Marcus R.", status:"Done",        priority:"high"   },
  { id:2, name:"Excavation & Grading",        phase:"Foundation", start:8,  duration:14, progress:100, assignee:"Carlos M.", status:"Done",        priority:"high"   },
  { id:3, name:"Foundation Concrete Pour",    phase:"Foundation", start:20, duration:12, progress:75,  assignee:"Marcus R.", status:"In Progress", priority:"high"   },
  { id:4, name:"Rebar Installation — Level 1",phase:"Structure",  start:30, duration:10, progress:40,  assignee:"Carlos M.", status:"In Progress", priority:"high"   },
  { id:5, name:"Formwork — Level 1",          phase:"Structure",  start:32, duration:8,  progress:20,  assignee:"James O.",  status:"In Progress", priority:"medium" },
  { id:6, name:"MEP Rough-In",                phase:"MEP",        start:40, duration:20, progress:0,   assignee:"Ahmed H.",  status:"Upcoming",    priority:"medium" },
  { id:7, name:"Waterproofing",               phase:"Envelope",   start:45, duration:8,  progress:0,   assignee:"TBD",       status:"Upcoming",    priority:"medium" },
  { id:8, name:"Safety Audit",                phase:"HSE",        start:35, duration:3,  progress:0,   assignee:"Priya N.",  status:"Overdue",     priority:"high"   },
  { id:9, name:"Owner Walkthrough",           phase:"Milestone",  start:60, duration:1,  progress:0,   assignee:"All",       status:"Upcoming",    priority:"low"    },
];

const phases = ["All","Foundation","Structure","MEP","Envelope","HSE","Milestone"];
const statusColor: Record<string,string> = { "Done":"#22d3a0", "In Progress":"#38bfff", "Upcoming":"#8a9bb0", "Overdue":"#f43f5e" };
const priorityColor: Record<string,string> = { high:"#f43f5e", medium:"#f59e0b", low:"#22d3a0" };
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"8px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none" };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Scheduling({ appState }: { appState: AppState }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"list"|"gantt">("list");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", phase:"Foundation", assignee:"", duration:"7", priority:"medium" });

  // NL Task state
  const [nlText, setNlText] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlParsed, setNlParsed] = useState<any>(null);
  const [nlError, setNlError] = useState("");

  // Optimizer state
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState<any>(null);
  const [optError, setOptError] = useState("");
  const [showOpt, setShowOpt] = useState(false);

  const filtered = filter === "All" ? tasks : tasks.filter(t => t.phase === filter);
  const totalDays = Math.max(...tasks.map(t => t.start + t.duration));

  const addTask = () => {
    if (!form.name) return;
    setTasks(p => [...p, { id:Date.now(), name:form.name, phase:form.phase, start:0, duration:parseInt(form.duration), progress:0, assignee:form.assignee, status:"Upcoming", priority:form.priority }]);
    setShowForm(false);
  };

  // Natural Language Task
  const parseNLTask = async () => {
    if (!nlText.trim()) return;
    setNlLoading(true); setNlError(""); setNlParsed(null);
    try {
      const res = await fetch(`${API_BASE}/construction/nl-task`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, text: nlText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Parse failed");
      setNlParsed(data);
    } catch (e: any) { setNlError(e.message ?? "Failed"); }
    finally { setNlLoading(false); }
  };

  const addNLTask = () => {
    if (!nlParsed) return;
    setTasks(p => [...p, {
      id: Date.now(),
      name: nlParsed.name,
      phase: nlParsed.phase,
      start: nlParsed.start_offset ?? 0,
      duration: nlParsed.duration ?? 5,
      progress: 0,
      assignee: nlParsed.assignee || "TBD",
      status: "Upcoming",
      priority: nlParsed.priority ?? "medium",
    }]);
    setNlText(""); setNlParsed(null);
  };

  // Schedule Optimizer
  const runOptimizer = async () => {
    setOptLoading(true); setOptError(""); setOptResult(null); setShowOpt(true);
    try {
      const res = await fetch(`${API_BASE}/construction/optimize-schedule`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, tasks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Optimization failed");
      setOptResult(data);
    } catch (e: any) { setOptError(e.message ?? "Failed"); }
    finally { setOptLoading(false); }
  };

  const effortColor: Record<string,string> = { Low:"#22d3a0", Medium:"#f59e0b", High:"#f43f5e" };
  const typeColor: Record<string,string> = { "Fast-Track":"#38bfff", "Parallel-Work":"#a78bfa", "Resource-Leveling":"#f59e0b", "Sequence-Change":"#22d3a0" };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:3 }}>Scheduling</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M }}>{tasks.filter(t=>t.status==="Overdue").length} overdue · {tasks.filter(t=>t.status==="In Progress").length} in progress</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={runOptimizer} disabled={optLoading} style={{ background:"linear-gradient(135deg,#a78bfa,#7c3aed)", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, fontWeight:600, cursor:optLoading?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:8 }}>
            {optLoading
              ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Optimizing...</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> AI Optimize</>
            }
          </button>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, overflow:"hidden" }}>
            {(["list","gantt"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ background:view===v?"rgba(0,168,240,0.12)":"transparent", color:view===v?"#38bfff":"rgba(255,255,255,0.4)", border:"none", padding:"7px 16px", cursor:"pointer", fontSize:12, fontFamily:F, fontWeight:600, transition:"all 0.15s" }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>+ Add Task</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { l:"Total Tasks",  v:tasks.length,                                    c:"#f0f4f8" },
          { l:"In Progress",  v:tasks.filter(t=>t.status==="In Progress").length, c:"#38bfff" },
          { l:"Overdue",      v:tasks.filter(t=>t.status==="Overdue").length,     c:"#f43f5e" },
          { l:"Completed",    v:tasks.filter(t=>t.status==="Done").length,        c:"#22d3a0" },
        ].map(s => (
          <div key={s.l} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c, letterSpacing:"-0.03em", lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:6 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Natural Language Task Creator ── */}
      <div style={{ background:"rgba(0,168,240,0.04)", border:"1px solid rgba(0,168,240,0.15)", borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"rgba(0,168,240,0.7)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:10 }}>
          AI · Natural Language Task
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <input
              value={nlText}
              onChange={e => setNlText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") parseNLTask(); }}
              placeholder='Type a task naturally, e.g. "Pour slab Tuesday, 3 days, assign to Marcus, high priority"'
              style={{ ...inp, fontSize:13 }}
            />
            {nlError && <div style={{ fontSize:11, color:"#f43f5e", marginTop:5 }}>{nlError}</div>}
          </div>
          <button onClick={parseNLTask} disabled={!nlText.trim() || nlLoading} style={{ padding:"8px 16px", borderRadius:7, border:"none", background:!nlText.trim()||nlLoading?"rgba(0,168,240,0.3)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:13, fontWeight:600, cursor:!nlText.trim()||nlLoading?"not-allowed":"pointer", fontFamily:F, flexShrink:0, display:"flex", alignItems:"center", gap:7 }}>
            {nlLoading
              ? <><div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Parsing...</>
              : "Parse"
            }
          </button>
        </div>

        {nlParsed && (
          <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(0,168,240,0.07)", border:"1px solid rgba(0,168,240,0.2)", borderRadius:9, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" as const }}>
            <div style={{ flex:1, display:"flex", gap:14, flexWrap:"wrap" as const }}>
              <div><span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.08em" }}>TASK </span><span style={{ fontSize:13, fontWeight:600 }}>{nlParsed.name}</span></div>
              <div><span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>PHASE </span><span style={{ fontSize:12, color:"#38bfff" }}>{nlParsed.phase}</span></div>
              <div><span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>DURATION </span><span style={{ fontSize:12, color:"#f0f4f8", fontFamily:M }}>{nlParsed.duration}d</span></div>
              <div><span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>ASSIGNEE </span><span style={{ fontSize:12 }}>{nlParsed.assignee}</span></div>
              <div><span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>PRIORITY </span><span style={{ fontSize:12, color:priorityColor[nlParsed.priority] ?? "#f59e0b" }}>{nlParsed.priority}</span></div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button onClick={addNLTask} style={{ padding:"7px 14px", borderRadius:7, border:"none", background:"linear-gradient(135deg,#22d3a0,#0a9a75)", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>Add to Schedule</button>
              <button onClick={() => setNlParsed(null)} style={{ padding:"7px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", fontFamily:F }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Schedule Optimizer Results ── */}
      {showOpt && (
        <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"rgba(167,139,250,0.8)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" as const }}>AI Schedule Optimizer</div>
            <button onClick={() => setShowOpt(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:16, fontFamily:F, padding:"0 4px" }}>✕</button>
          </div>

          {optLoading && (
            <div style={{ display:"flex", alignItems:"center", gap:10, color:"rgba(255,255,255,0.4)", fontSize:13, padding:"12px 0" }}>
              <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid rgba(167,139,250,0.2)", borderTopColor:"#a78bfa", animation:"spin 0.8s linear infinite" }}/>
              Analyzing schedule for optimization opportunities...
            </div>
          )}

          {optError && <div style={{ color:"#f43f5e", fontSize:13, padding:"8px 0" }}>{optError}</div>}

          {optResult && !optLoading && (
            <div>
              <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:optResult.schedule_health === "Critical" ? "#f43f5e" : optResult.schedule_health === "At Risk" ? "#f59e0b" : "#22d3a0" }}>{optResult.schedule_health}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>{optResult.summary}</div>
                {optResult.potential_days_recovered > 0 && (
                  <div style={{ background:"rgba(34,211,160,0.12)", border:"1px solid rgba(34,211,160,0.2)", borderRadius:6, padding:"4px 12px", fontSize:12, color:"#22d3a0", fontWeight:600, flexShrink:0 }}>+{optResult.potential_days_recovered}d recoverable</div>
                )}
              </div>

              {optResult.optimizations?.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {optResult.optimizations.map((o: any, i: number) => (
                    <div key={i} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:typeColor[o.type] ?? "#38bfff", background:`${typeColor[o.type] ?? "#38bfff"}18`, padding:"2px 8px", borderRadius:4, fontFamily:M }}>{o.type}</span>
                        <span style={{ fontSize:11, color:"#22d3a0", fontWeight:600, fontFamily:M }}>-{o.days_saved}d</span>
                      </div>
                      <div style={{ fontSize:12, fontWeight:500, color:"#f0f4f8", marginBottom:4 }}>{o.task_affected}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:6, lineHeight:1.5 }}>{o.action}</div>
                      <div style={{ display:"flex", gap:8 }}>
                        <span style={{ fontSize:10, color:effortColor[o.effort] ?? "#f59e0b", fontFamily:M }}>Effort: {o.effort}</span>
                        {o.risk && <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>· {o.risk}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {optResult.quick_wins?.length > 0 && (
                <div style={{ padding:"10px 14px", background:"rgba(34,211,160,0.05)", border:"1px solid rgba(34,211,160,0.1)", borderRadius:8 }}>
                  <div style={{ fontSize:10, color:"rgba(34,211,160,0.8)", fontFamily:M, letterSpacing:"0.08em", marginBottom:6 }}>QUICK WINS</div>
                  <div style={{ display:"flex", flexWrap:"wrap" as const, gap:8 }}>
                    {optResult.quick_wins.map((w: string, i: number) => (
                      <span key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:6, padding:"4px 10px" }}>→ {w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual add form */}
      {showForm && (
        <div style={{ background:"rgba(0,168,240,0.05)", border:"1px solid rgba(0,168,240,0.2)", borderRadius:12, padding:20, marginBottom:16, display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
          {[{k:"name",l:"Task Name",ph:"Foundation pour..."},{k:"assignee",l:"Assignee",ph:"Marcus R."},{k:"duration",l:"Duration (days)",ph:"7"}].map(f => (
            <div key={f.k}><label style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, display:"block", marginBottom:6 }}>{f.l.toUpperCase()}</label><input value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/></div>
          ))}
          {[{k:"phase",l:"Phase",opts:phases.filter(p=>p!=="All")},{k:"priority",l:"Priority",opts:["high","medium","low"]}].map(f => (
            <div key={f.k}><label style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, display:"block", marginBottom:6 }}>{f.l.toUpperCase()}</label><select value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} style={{...inp,cursor:"pointer"}}>{f.opts.map(o => <option key={o}>{o}</option>)}</select></div>
          ))}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addTask} style={{ background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontWeight:600, cursor:"pointer", fontFamily:F, fontSize:13 }}>Add</button>
            <button onClick={() => setShowForm(false)} style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"8px 12px", cursor:"pointer", fontFamily:F, fontSize:13 }}>✕</button>
          </div>
        </div>
      )}

      {/* Phase filter chips */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" as const }}>
        {phases.map(p => (
          <button key={p} onClick={() => setFilter(p)} style={{ background:filter===p?"rgba(0,168,240,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${filter===p?"rgba(0,168,240,0.3)":"rgba(255,255,255,0.08)"}`, color:filter===p?"#38bfff":"rgba(255,255,255,0.4)", borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:F, transition:"all 0.15s" }}>{p}</button>
        ))}
      </div>

      {/* Task list / gantt */}
      {view === "list" ? (
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                {["Task","Phase","Assignee","Duration","Progress","Status","Priority"].map(h => (
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left" as const, fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.08em", fontWeight:500, background:"rgba(255,255,255,0.02)" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,0.05)":"none", transition:"background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding:"11px 16px", fontSize:13, fontWeight:500 }}>{t.name}</td>
                  <td style={{ padding:"11px 16px" }}><span style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.45)", fontSize:11, padding:"2px 8px", borderRadius:4, fontFamily:M }}>{t.phase}</span></td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{t.assignee}</td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:M }}>{t.duration}d</td>
                  <td style={{ padding:"11px 16px", width:120 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.07)", borderRadius:2 }}>
                        <div style={{ height:"100%", width:`${t.progress}%`, borderRadius:2, background:statusColor[t.status] }}/>
                      </div>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:M, minWidth:28 }}>{t.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding:"11px 16px" }}><span style={{ color:statusColor[t.status], fontSize:12, fontWeight:500 }}>{t.status}</span></td>
                  <td style={{ padding:"11px 16px" }}><span style={{ color:priorityColor[t.priority], fontSize:11 }}>● {t.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20, overflowX:"auto" as const }}>
          <div style={{ minWidth:700 }}>
            {filtered.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ width:180, fontSize:12, color:"rgba(255,255,255,0.6)", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{t.name}</div>
                <div style={{ flex:1, position:"relative", height:22 }}>
                  <div style={{ position:"absolute", height:"100%", background:"rgba(255,255,255,0.04)", borderRadius:4, left:`${(t.start/totalDays)*100}%`, width:`${(t.duration/totalDays)*100}%`, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${t.progress}%`, background:statusColor[t.status], opacity:0.85, borderRadius:4 }}/>
                    <span style={{ position:"absolute", left:6, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#fff", fontFamily:M, whiteSpace:"nowrap" as const, mixBlendMode:"difference" as any }}>{t.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
