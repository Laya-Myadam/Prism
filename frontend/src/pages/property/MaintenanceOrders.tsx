import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";

const PRIORITY_COLOR: Record<string,string> = { High:"#f43f5e", Medium:"#f59e0b", Low:"#22d3a0" };
const STATUS_COLOR: Record<string,{bg:string;text:string;border:string}> = {
  Open:       { bg:"rgba(0,168,240,0.1)",   text:"#38bfff",  border:"rgba(0,168,240,0.25)" },
  "In Progress":{ bg:"rgba(245,158,11,0.1)",text:"#f59e0b",  border:"rgba(245,158,11,0.25)" },
  Resolved:   { bg:"rgba(34,211,160,0.1)",  text:"#22d3a0",  border:"rgba(34,211,160,0.25)" },
  Cancelled:  { bg:"rgba(255,255,255,0.05)",text:"rgba(255,255,255,0.3)", border:"rgba(255,255,255,0.1)" },
};
const CATEGORIES = ["Plumbing","Electrical","HVAC","Appliance","Structural","Pest Control","Cleaning","Landscaping","General"];
const VENDORS = ["In-House","Licensed Plumber","Electrician","HVAC Technician","General Contractor","Pest Control Co."];

const today = () => new Date().toISOString().split("T")[0];
const dueIn = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate()+d); return dt.toISOString().split("T")[0]; };

const DEMO_ORDERS = [
  { id:"MR-001", unit:"4B", tenant_name:"Sarah Mitchell", category:"Plumbing", description:"Kitchen faucet leaking steadily — water collecting under sink. Tenant reports it started 3 days ago.", priority:"High", status:"Open", assigned_to:"Licensed Plumber", date_submitted:"2025-05-20", date_due:"2025-05-22", date_resolved:null, ai_diagnosis:"Likely worn cartridge or compression valve. Common failure point in fixtures over 5 years. Recommend cartridge replacement first ($40 part, 1hr labor). If leak persists, inspect supply line for cracks.", estimated_cost:180 },
  { id:"MR-002", unit:"2A", tenant_name:"James Okoye", category:"HVAC", description:"AC unit not cooling below 78°F even when set to 68°F. Unit is 4 years old. Tenant says it runs constantly but room stays warm.", priority:"High", status:"In Progress", assigned_to:"HVAC Technician", date_submitted:"2025-05-18", date_due:"2025-05-21", date_resolved:null, ai_diagnosis:"Symptoms indicate low refrigerant charge or dirty condenser coils. Recommend refrigerant pressure test first. If charge is low, inspect for leaks before recharging. Condenser coil cleaning may also restore 15–20% efficiency.", estimated_cost:380 },
  { id:"MR-003", unit:"7C", tenant_name:"Marcus Lee", category:"Electrical", description:"Outlet in living room sparks when plugging in devices. Two other outlets on the same wall also stopped working.", priority:"High", status:"Open", assigned_to:"Electrician", date_submitted:"2025-05-21", date_due:"2025-05-22", date_resolved:null, ai_diagnosis:"Sparking outlet with cascading failures suggests a tripped GFCI outlet or a shared circuit breaker issue. Check GFCI reset in bathroom first (common in older wiring layouts). If GFCI is not the issue, the circuit may have a loose neutral connection — requires licensed electrician immediately.", estimated_cost:220 },
  { id:"MR-004", unit:"1D", tenant_name:"Priya Sharma", category:"Appliance", description:"Dishwasher not draining — standing water in bottom after cycle. Unit is 2 years old.", priority:"Medium", status:"Open", assigned_to:"General Maintenance", date_submitted:"2025-05-19", date_due:"2025-05-25", date_resolved:null, ai_diagnosis:"Most likely a clogged drain filter or kinked drain hose. Clean the filter basket first (tenant can do this). If issue persists, check drain hose routing and garbage disposal knockout plug. Part cost minimal — labor under 1 hour.", estimated_cost:95 },
  { id:"MR-005", unit:"Suite 100", tenant_name:"Rivera Holdings LLC", category:"General", description:"Lobby entrance door handle is loose and the door doesn't close flush — security concern for commercial tenant.", priority:"Medium", status:"Resolved", assigned_to:"In-House", date_submitted:"2025-05-15", date_due:"2025-05-17", date_resolved:"2025-05-16", ai_diagnosis:"Door alignment issue typically caused by worn hinge screws or a settling door frame. Tighten hinge screws with longer screws first. If door frame has shifted, a door realignment kit or frame repair may be needed. Quick fix likely sufficient.", estimated_cost:45 },
  { id:"MR-006", unit:"3A", tenant_name:"Elena Vasquez", category:"Pest Control", description:"Tenant reports seeing cockroaches in kitchen area, particularly near sink and under refrigerator. First occurrence.", priority:"Low", status:"Open", assigned_to:"Pest Control Co.", date_submitted:"2025-05-22", date_due:"2025-05-29", date_resolved:null, ai_diagnosis:"First-occurrence cockroach sighting in kitchen — likely entered via plumbing gaps or shared wall from adjacent unit. Recommend gel bait application under sink and behind appliances plus sealing any plumbing penetrations. Schedule adjacent units for inspection within 7 days.", estimated_cost:150 },
];

export default function MaintenanceOrders({ appState }: { appState: AppState }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ unit:"", tenant_name:"", category:"Plumbing", description:"", priority:"Medium", assigned_to:"In-House", date_due: dueIn(3), estimated_cost:"" });
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => { load(); loadApprovals(); }, [appState.sessionId]);

  const loadApprovals = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/approvals/${appState.sessionId}`);
      if (r.ok) setApprovals(await r.json());
    } catch {}
  };

  const requestApproval = async (reference_id: string, title: string, description: string) => {
    try {
      await fetch(`${API}/approvals/request`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, type:"maintenance", reference_id, title, description, requested_by: appState.user?.name || "Staff" }),
      });
      await loadApprovals();
    } catch {}
  };

  const approvalFor = (id: string) => approvals.find(a => a.reference_id === id);

  const load = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/pm/maintenance/${appState.sessionId}`);
      if (r.ok) {
        const data = await r.json();
        setOrders(data.length > 0 ? data : DEMO_ORDERS);
      } else {
        setOrders(DEMO_ORDERS);
      }
    } catch { setOrders(DEMO_ORDERS); }
  };

  const create = async () => {
    if (!form.description.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${API}/pm/maintenance/create`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, ...form, estimated_cost: parseFloat(form.estimated_cost)||0, date_submitted: today() }),
      });
      if (r.ok) {
        const data = await r.json();
        setOrders(prev => [data, ...prev]);
        setShowModal(false);
        setForm({ unit:"", tenant_name:"", category:"Plumbing", description:"", priority:"Medium", assigned_to:"In-House", date_due: dueIn(3), estimated_cost:"" });
        if (form.priority === "High") {
          await requestApproval(data.id, `Dispatch Approval: Unit ${form.unit} — ${form.category}`, `High priority ${form.category} issue in Unit ${form.unit} (${form.tenant_name}). Assigned to ${form.assigned_to}. Estimated cost $${form.estimated_cost||0}. Supervisor approval required before dispatch.`);
        }
      }
    } catch {}
    setCreating(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { session_id: appState.sessionId, id, status };
    if (status === "Resolved") updates.date_resolved = today();
    await fetch(`${API}/pm/maintenance/update`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(updates),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const filtered = orders.filter(o => {
    const matchF = filter === "All" || o.status === filter;
    const matchS = (o.unit||"").toLowerCase().includes(search.toLowerCase()) || (o.description||"").toLowerCase().includes(search.toLowerCase()) || (o.tenant_name||"").toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const stats = {
    total: orders.length,
    open: orders.filter(o => o.status === "Open").length,
    inProgress: orders.filter(o => o.status === "In Progress").length,
    resolved: orders.filter(o => o.status === "Resolved").length,
    totalCost: orders.reduce((a,o) => a+(o.estimated_cost||0), 0),
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .mr-row:hover{background:rgba(255,255,255,0.03)!important}`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#38bfff,#0072b8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>Maintenance Orders</h1>
            <span style={{ fontSize:9, fontWeight:700, background:"rgba(56,191,255,0.15)", color:"#38bfff", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Track maintenance requests · AI diagnoses issues · Vendor assignment</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"linear-gradient(135deg,#38bfff,#0072b8)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          New Request
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total", value:stats.total, color:"#f0f4f8" },
          { label:"Open", value:stats.open, color:"#38bfff" },
          { label:"In Progress", value:stats.inProgress, color:"#f59e0b" },
          { label:"Resolved", value:stats.resolved, color:"#22d3a0" },
          { label:"Est. Cost", value:`$${(stats.totalCost/1000).toFixed(1)}K`, color:"#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, maxWidth:300 }}>
          <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }} width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search unit, tenant, issue…" style={{ width:"100%", paddingLeft:36, padding:"9px 12px 9px 36px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#f0f4f8", fontSize:13, outline:"none", fontFamily:F, boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["All","Open","In Progress","Resolved"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"8px 14px", borderRadius:7, border:filter===f?"1px solid rgba(56,191,255,0.3)":"1px solid rgba(255,255,255,0.08)", background:filter===f?"rgba(56,191,255,0.12)":"transparent", color:filter===f?"#38bfff":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:filter===f?600:400, cursor:"pointer", fontFamily:F }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" }}>
        {/* Columns: ID · Unit · Description · Category · Due · Priority · Status */}
        <div style={{ display:"grid", gridTemplateColumns:"72px 56px minmax(0,1fr) 88px 88px 72px 118px", gap:8, padding:"11px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>
          {["ID","Unit","Description","Category","Due","Priority","Status"].map(h => (
            <div key={h} style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:"48px 20px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>
            {orders.length === 0 ? "No maintenance requests yet — create your first one." : "No requests match the filter."}
          </div>
        ) : filtered.map((o, i) => {
          const sc = STATUS_COLOR[o.status] || STATUS_COLOR.Open;
          const isExp = expanded === o.id;
          const apr = approvalFor(o.id);
          return (
            <div key={o.id} style={{ borderBottom: i < filtered.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="mr-row" style={{ display:"grid", gridTemplateColumns:"72px 56px minmax(0,1fr) 88px 88px 72px 118px", gap:8, padding:"13px 20px", cursor:"pointer", transition:"background 150ms", alignItems:"center" }}
                onClick={() => setExpanded(isExp ? null : o.id)}>
                <div style={{ fontFamily:M, fontSize:11, color:"#38bfff", fontWeight:600 }}>{o.id}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>{o.unit || "—"}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.description}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.tenant_name || "—"}</div>
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.category}</div>
                <div style={{ fontSize:11, fontFamily:M, color:"rgba(255,255,255,0.4)" }}>{o.date_due || "—"}</div>
                <div>
                  <span style={{ fontSize:10, fontFamily:M, fontWeight:700, padding:"3px 7px", borderRadius:5, background:`${PRIORITY_COLOR[o.priority]||"#64748b"}20`, color:PRIORITY_COLOR[o.priority]||"#64748b", border:`1px solid ${PRIORITY_COLOR[o.priority]||"#64748b"}35`, whiteSpace:"nowrap" }}>{(o.priority||"Med").toUpperCase()}</span>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${sc.border}`, borderRadius:6, padding:"5px 6px", color:sc.text, fontSize:11, fontFamily:F, cursor:"pointer", fontWeight:600 }}>
                    {["Open","In Progress","Resolved","Cancelled"].map(s => <option key={s} style={{ background:"#1c2535", color:"#f0f4f8" }}>{s}</option>)}
                  </select>
                </div>
              </div>
              {isExp && (
                <div style={{ padding:"0 20px 16px", animation:"fadeUp 0.2s ease" }}>
                  {apr && (
                    <div style={{ marginBottom:10, padding:"10px 14px", borderRadius:8, background: apr.status==="Approved"?"rgba(34,211,160,0.07)":apr.status==="Rejected"?"rgba(244,63,94,0.07)":"rgba(245,158,11,0.07)", border: `1px solid ${apr.status==="Approved"?"rgba(34,211,160,0.2)":apr.status==="Rejected"?"rgba(244,63,94,0.2)":"rgba(245,158,11,0.2)"}` }}>
                      <div style={{ fontSize:10, fontFamily:M, letterSpacing:"0.06em", marginBottom:4, color: apr.status==="Approved"?"#22d3a0":apr.status==="Rejected"?"#f43f5e":"#f59e0b" }}>
                        {apr.status==="Pending" ? "⏳ AWAITING DISPATCH APPROVAL" : apr.status==="Approved" ? "✓ DISPATCH APPROVED" : "✗ DISPATCH REJECTED"}
                      </div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                        {apr.status==="Pending" ? "Supervisor must approve before dispatching vendor." : `${apr.reviewed_by}${apr.review_notes ? ": " + apr.review_notes : ""}`}
                      </div>
                    </div>
                  )}
                  <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                      <div style={{ fontSize:10, fontFamily:M, color:"rgba(56,191,255,0.7)", letterSpacing:"0.08em", marginBottom:8 }}>DETAILS</div>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65, margin:"0 0 10px" }}>{o.description}</p>
                      {[["Assigned To", o.assigned_to||"—"], ["Est. Cost", o.estimated_cost?`$${o.estimated_cost}`:"—"], ["Resolved", o.date_resolved||"Open"]].map(([k,v]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{k}</span>
                          <span style={{ fontSize:12, fontFamily:M, color:"#f0f4f8" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {o.ai_diagnosis && (
                      <div>
                        <div style={{ fontSize:10, fontFamily:M, color:"rgba(34,211,160,0.7)", letterSpacing:"0.08em", marginBottom:8 }}>AI DIAGNOSIS</div>
                        <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65, margin:0 }}>{o.ai_diagnosis}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }} onClick={() => setShowModal(false)}>
          <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:32, width:540, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:"0 0 20px" }}>New Maintenance Request</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[{k:"unit",l:"Unit/Suite",ph:"e.g. 4B"},{k:"tenant_name",l:"Tenant Name",ph:"Full name"}].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>{f.l.toUpperCase()}</label>
                    <input value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>ISSUE DESCRIPTION</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the maintenance issue…" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
                {([{k:"category",l:"Category",opts:CATEGORIES},{k:"priority",l:"Priority",opts:["High","Medium","Low"]},{k:"assigned_to",l:"Assign To",opts:VENDORS}] as any[]).map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>{f.l.toUpperCase()}</label>
                    <select value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 10px", color:"#f0f4f8", fontSize:12, fontFamily:F, outline:"none" }}>
                      {f.opts.map((o: string) => <option key={o} style={{ background:"#1c2535" }}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>EST. COST ($)</label>
                  <input type="number" value={form.estimated_cost} onChange={e => setForm(p=>({...p,estimated_cost:e.target.value}))} placeholder="0" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>DUE DATE</label>
                <input type="date" value={form.date_due} onChange={e => setForm(p=>({...p,date_due:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex:1, padding:11, borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", fontFamily:F }}>Cancel</button>
                <button onClick={create} disabled={creating} style={{ flex:2, padding:11, borderRadius:9, border:"none", background:"linear-gradient(135deg,#38bfff,#0072b8)", color:"#fff", fontSize:13, fontWeight:600, cursor:creating?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {creating ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Creating…</> : "Create + AI Diagnose"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
