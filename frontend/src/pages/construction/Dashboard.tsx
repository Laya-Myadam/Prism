import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import { getDashboard } from "../../api/client";

interface Props { appState: AppState; }

const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 } as React.CSSProperties;

// ── Demo project — always visible, no upload needed ───────────────────────────
const DEMO = {
  name: "Riverside Heights Mixed-Use",
  value: "$11.4M",
  owner: "Pinnacle Urban Developers",
  gc: "Hardrock General Contracting",
  completion: "December 2025",
  ld: "$2,000/day",
  isDemo: true,
  stats: { total_documents:14, contracts:1, drawings:4, specs:2, daily_reports:5, rfis:12, change_orders:5, inspections:2 },
  risks: [
    { severity:"High",   title:"3 RFIs overdue by 14+ days",               description:"RFI-009, RFI-011, RFI-014 have exceeded the 14-day response window. Contractor may claim delay.", source:"RFI" },
    { severity:"High",   title:"Liquidated damages clause active",           description:"Foundation work is 2 days behind critical path. LD rate of $2,000/day applies.", source:"Contract" },
    { severity:"Medium", title:"CO-004 pending approval for 8 days",        description:"Change order for waterproofing upgrade worth $34,500 awaiting owner sign-off.", source:"Change Orders" },
    { severity:"Medium", title:"Structural steel submittal not approved",    description:"Submittal S-014 for rebar schedule returned with comments. Resubmission overdue.", source:"Submittals" },
    { severity:"Low",    title:"Retention release conditions unclear",       description:"Contract clause 9.3 does not specify practical completion criteria for retention release.", source:"Contract" },
  ],
  schedule: {
    status: "At Risk",
    summary: "Foundation work is 2 days behind schedule. Critical path affected — recovery plan required by end of week.",
    critical_activities: ["Foundation Concrete Pour", "Rebar Installation Level 1", "Structural Steel Erection"],
  },
  extracted_sections: {
    "Contract": { project_name:"Riverside Heights Mixed-Use", project_value:"$11.4M", owner:"Pinnacle Urban Developers", liquidated_damages:"$2,000/day", retention:"5%" },
    "Daily Reports": { work_summary:"Formwork at grid lines A1-A4 completed. Concrete pour scheduled for Thursday.", total_delays_reported:"2", weather_impacts:"Rain delay on March 12 — 4 hours lost" },
    "RFIs": { total_rfis:"12", open_rfis:"7", common_topics:"Waterproofing, concrete strength, structural connections" },
  },
};

export default function Dashboard({ appState }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState<"demo"|"real">("demo");

  useEffect(() => {
    if (appState.sessionId) {
      setLoading(true);
      getDashboard(appState.sessionId)
        .then(d => {
          if (d && Object.keys(d).length > 0 && d.facts) {
            setData(d);
            if (d?.facts?.project_name) {
              appState.setProjectName(d.facts.project_name);
              appState.setProjectBuilt(true);
              setActiveProject("real"); // auto-switch to real project when available
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [appState.sessionId]);

  // ── Active project data — demo or real ───────────────────────────────────
  const showDemo = activeProject === "demo" || !appState.projectBuilt;
  const facts   = showDemo ? { project_name:DEMO.name, project_value:DEMO.value, owner:DEMO.owner, general_contractor:DEMO.gc, completion_date:DEMO.completion, liquidated_damages:DEMO.ld } : (data?.facts || {});
  const stats   = showDemo ? DEMO.stats : data?.stats;
  const risks   = showDemo ? DEMO.risks : (data?.risks || []);
  const schedule = showDemo ? DEMO.schedule : data?.schedule_health;
  const extracted = showDemo ? DEMO.extracted_sections : data?.extracted_sections;

  const metrics = stats ? [
    { label:"Total Documents", value:String(stats.total_documents), sub:`${stats.contracts} contract${stats.contracts!==1?"s":""}`, accent:"#00a8f0" },
    { label:"Drawings",        value:String(stats.drawings),        sub:"Indexed",   accent:"#38bfff" },
    { label:"RFIs",            value:String(stats.rfis),            sub:"Uploaded",  accent:"#f59e0b" },
    { label:"Daily Reports",   value:String(stats.daily_reports),   sub:"Uploaded",  accent:"#a78bfa" },
    { label:"Change Orders",   value:String(stats.change_orders),   sub:"Uploaded",  accent:"#f43f5e" },
    { label:"Specs",           value:String(stats.specs),           sub:"Indexed",   accent:"#22d3a0" },
  ] : [];

  const scheduleColor = schedule?.status === "On Track" ? "#22d3a0" : schedule?.status === "Delayed" ? "#f43f5e" : "#f59e0b";

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", maxWidth:1200 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>
          Good morning, {appState.user?.name?.split(" ")[0] || "there"}
        </h1>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, fontFamily:M }}>
          {facts.project_name ? `Active: ${facts.project_name}` : "Select a project below"}
        </p>
      </div>

      {/* ── Project selector strip ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        {/* Demo project chip */}
        <button onClick={()=>setActiveProject("demo")} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:10, border:`1px solid ${activeProject==="demo"?"rgba(0,168,240,0.4)":"rgba(255,255,255,0.08)"}`, background:activeProject==="demo"?"rgba(0,168,240,0.1)":"rgba(255,255,255,0.03)", cursor:"pointer", fontFamily:F, transition:"all 0.15s", textAlign:"left" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b", boxShadow:activeProject==="demo"?"0 0 6px #f59e0b":"none", flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:activeProject==="demo"?"#38bfff":"rgba(255,255,255,0.65)" }}>Riverside Heights Mixed-Use</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>DEMO · At Risk · 61%</div>
          </div>
          <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(245,158,11,0.15)", color:"#f59e0b", fontFamily:M, border:"1px solid rgba(245,158,11,0.2)", marginLeft:4 }}>DEMO</span>
        </button>

        {/* Real project chip — only when built */}
        {appState.projectBuilt && data?.facts?.project_name && (
          <button onClick={()=>setActiveProject("real")} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:10, border:`1px solid ${activeProject==="real"?"rgba(0,168,240,0.4)":"rgba(255,255,255,0.08)"}`, background:activeProject==="real"?"rgba(0,168,240,0.1)":"rgba(255,255,255,0.03)", cursor:"pointer", fontFamily:F, transition:"all 0.15s", textAlign:"left" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22d3a0", boxShadow:activeProject==="real"?"0 0 6px #22d3a0":"none", flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:activeProject==="real"?"#38bfff":"rgba(255,255,255,0.65)" }}>{data.facts.project_name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:M }}>YOUR PROJECT · {data.stats?.total_documents || 0} docs</div>
            </div>
            <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(34,211,160,0.15)", color:"#22d3a0", fontFamily:M, border:"1px solid rgba(34,211,160,0.2)", marginLeft:4 }}>LIVE</span>
          </button>
        )}

        {/* Add new project */}
        <button onClick={()=>navigate("/documents")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10, border:"1px dashed rgba(255,255,255,0.15)", background:"transparent", cursor:"pointer", fontFamily:F, color:"rgba(255,255,255,0.4)", fontSize:12, transition:"all 0.15s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(0,168,240,0.3)";(e.currentTarget as HTMLButtonElement).style.color="#38bfff";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.15)";(e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.4)";}}>
          <span style={{ fontSize:16, lineHeight:1 }}>+</span> Upload New Project
        </button>

        {loading && <div style={{ width:14, height:14, border:"2px solid rgba(0,168,240,0.3)", borderTopColor:"#00a8f0", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>}
      </div>

      {/* Demo banner */}
      {showDemo && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderRadius:8, background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", marginBottom:20 }}>
          <span style={{ fontSize:12, color:"rgba(245,158,11,0.9)" }}>📋 You're viewing a demo project. <span style={{ color:"rgba(255,255,255,0.5)" }}>Upload your own documents to see real AI insights.</span></span>
          <button onClick={()=>navigate("/documents")} style={{ fontSize:11, color:"#f59e0b", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontFamily:F, fontWeight:600 }}>Upload Docs →</button>
        </div>
      )}

      {/* Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:24 }}>
        {metrics.map(m=>(
          <div key={m.label} style={{ ...card, padding:"16px" }}>
            <div style={{ fontSize:22, fontWeight:700, color:m.accent, letterSpacing:"-0.03em", lineHeight:1 }}>{m.value}</div>
            <div style={{ fontSize:12, fontWeight:600, color:"#f0f4f8", marginTop:6 }}>{m.label}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:M, marginTop:3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Project facts strip */}
      <div style={{ ...card, padding:"14px 20px", marginBottom:16, display:"flex", flexWrap:"wrap", gap:24 }}>
        {[
          ["Project", facts.project_name],
          ["Value", facts.project_value],
          ["Owner", facts.owner],
          ["GC", facts.general_contractor],
          ["Completion", facts.completion_date],
          ["LD Rate", facts.liquidated_damages],
        ].filter(([,v])=>v).map(([l,v])=>(
          <div key={l as string}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:500, color:"#f0f4f8" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>
        {/* Left */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Risk Intelligence */}
          <div style={{ ...card, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Risk Intelligence</div>
              {risks.filter((r:any)=>r.severity==="High").length > 0 && (
                <span style={{ background:"rgba(244,63,94,0.1)", color:"#f43f5e", fontSize:10, padding:"2px 8px", borderRadius:4, fontFamily:M, border:"1px solid rgba(244,63,94,0.2)" }}>
                  {risks.filter((r:any)=>r.severity==="High").length} HIGH
                </span>
              )}
            </div>
            {risks.map((r:any,i:number)=>(
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", borderBottom:i<risks.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", flexShrink:0, marginTop:4, background:r.severity==="High"?"#f43f5e":r.severity==="Medium"?"#f59e0b":"#22d3a0", boxShadow:r.severity==="High"?"0 0 6px #f43f5e":"none" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:500 }}>{r.title}</div>
                  {r.description && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2, lineHeight:1.5 }}>{r.description}</div>}
                </div>
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontFamily:M, background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>{r.source||r.severity}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ ...card, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Quick Actions</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { label:"Ask Project",       sub:"Q&A across all docs",  path:"/documents",    accent:"#00a8f0" },
                { label:"Analyze Blueprint", sub:"CV + dimensions",      path:"/intelligence", accent:"#38bfff" },
                { label:"Add Workers",       sub:"Update crew roster",   path:"/workforce",    accent:"#a78bfa" },
                { label:"View Schedule",     sub:"Tasks & milestones",   path:"/scheduling",   accent:"#f59e0b" },
              ].map(a=>(
                <button key={a.label} onClick={()=>navigate(a.path)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.15s", fontFamily:F }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=a.accent+"40";(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.07)";(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.03)";}}>
                  <div style={{ fontSize:13, fontWeight:600, color:a.accent }}>{a.label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:3 }}>{a.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Schedule health */}
          <div style={{ ...card, padding:20, borderColor:`${scheduleColor}30` }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Schedule Health</div>
            {schedule ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:scheduleColor, boxShadow:`0 0 6px ${scheduleColor}` }}/>
                  <span style={{ color:scheduleColor, fontSize:12, fontWeight:700, fontFamily:M }}>{(schedule.status||"").toUpperCase()}</span>
                </div>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6, marginBottom:14 }}>{schedule.summary}</p>
                {schedule.critical_activities?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Critical Path</div>
                    {schedule.critical_activities.slice(0,3).map((a:string,i:number)=>(
                      <div key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.5)", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>→ {a}</div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Document Insights */}
          {extracted && Object.keys(extracted).length > 0 && (
            <div style={{ ...card, padding:20, flex:1, overflowY:"auto", maxHeight:320 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Document Insights</div>
              {Object.entries(extracted).map(([type, section]: [string, any])=>(
                <div key={type} style={{ marginBottom:14, paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize:10, color:"rgba(0,168,240,0.7)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{type}</div>
                  {Object.entries(section).filter(([,v])=>v&&typeof v==="string").slice(0,3).map(([k,v])=>(
                    <div key={k} style={{ display:"flex", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", minWidth:100, flexShrink:0, textTransform:"capitalize" }}>{k.replace(/_/g," ")}</span>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.65)", lineHeight:1.4 }}>{v as string}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}