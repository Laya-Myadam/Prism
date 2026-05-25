import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };

const RISK_COLOR: Record<string,{bg:string;text:string;border:string;bar:string}> = {
  Low:     { bg:"rgba(34,211,160,0.1)",  text:"#22d3a0", border:"rgba(34,211,160,0.25)", bar:"#22d3a0" },
  Medium:  { bg:"rgba(245,158,11,0.1)",  text:"#f59e0b", border:"rgba(245,158,11,0.25)", bar:"#f59e0b" },
  High:    { bg:"rgba(244,63,94,0.1)",   text:"#f43f5e", border:"rgba(244,63,94,0.25)",  bar:"#f43f5e" },
  Unknown: { bg:"rgba(255,255,255,0.05)", text:"rgba(255,255,255,0.4)", border:"rgba(255,255,255,0.1)", bar:"#64748b" },
};

const DEMO_TENANTS = [
  { id:"T-001", session_id:"demo", name:"Sarah Mitchell", unit:"4B", email:"s.mitchell@email.com", phone:"+1 555-0201", move_in:"2023-03-01", lease_end:"2025-03-01", monthly_rent:3200, risk_level:"Low", risk_score:"88/100", risk_details:"Strong financial profile with annual income of $128K, credit score 740, and 4 years of stable employment at a tech firm. No prior evictions or late payments on record. Excellent long-term tenant candidate.", status:"Active" },
  { id:"T-002", session_id:"demo", name:"James Okoye", unit:"2A", email:"j.okoye@mail.com", phone:"+1 555-0202", move_in:"2024-01-15", lease_end:"2025-01-15", monthly_rent:2800, risk_level:"Medium", risk_score:"61/100", risk_details:"Self-employed with variable income averaging $85K/year. Credit score 680. One late payment reported 18 months ago. Recommend requesting additional security deposit and 3-month bank statements before renewal.", status:"Active" },
  { id:"T-003", session_id:"demo", name:"Rivera Holdings LLC", unit:"Suite 100", email:"mgmt@riveraholdings.com", phone:"+1 555-0203", move_in:"2022-06-01", lease_end:"2027-06-01", monthly_rent:8500, risk_level:"Low", risk_score:"92/100", risk_details:"Established commercial tenant with 12-year operating history. Revenue of $2.4M last fiscal year. Strong covenant — minimal risk. Anchor tenant status with long-term lease through 2027.", status:"Active" },
  { id:"T-004", session_id:"demo", name:"Marcus Lee", unit:"7C", email:"m.lee@gmail.com", phone:"+1 555-0204", move_in:"2024-08-01", lease_end:"2025-08-01", monthly_rent:1950, risk_level:"High", risk_score:"34/100", risk_details:"Recent job change with income drop from $72K to $48K. Credit score 590. Two late payments in the past 12 months. Recommend payment plan monitoring and 60-day notice if delinquency continues. Consider non-renewal.", status:"Active" },
  { id:"T-005", session_id:"demo", name:"Priya Sharma", unit:"1D", email:"p.sharma@techco.io", phone:"+1 555-0205", move_in:"2023-09-01", lease_end:"2025-09-01", monthly_rent:2600, risk_level:"Low", risk_score:"81/100", risk_details:"Senior software engineer with $145K income. Credit score 715. No eviction history. Requested one lease renewal already — reliable long-term tenant. Minor concern: planning a move to larger unit within 6 months.", status:"Active" },
];

export default function TenantRisk({ appState }: { appState: AppState }) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [form, setForm] = useState({ name:"", unit:"", email:"", phone:"", move_in:"", lease_end:"", monthly_rent:"", financial_info:"" });
  const [approvals, setApprovals] = useState<any[]>([]);
  const [escalating, setEscalating] = useState<string|null>(null);

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
        body: JSON.stringify({ session_id: appState.sessionId, type:"tenant", reference_id, title, description, requested_by: appState.user?.name || "Staff" }),
      });
      await loadApprovals();
    } catch {}
  };

  const escalate = async (t: any) => {
    setEscalating(t.id);
    await requestApproval(t.id, `High Risk Tenant: ${t.name} (Unit ${t.unit})`, `Tenant risk score ${t.risk_score} — risk level HIGH. Supervisor review required to determine lease renewal or action plan.`);
    setEscalating(null);
  };

  const approvalFor = (id: string) => approvals.find(a => a.reference_id === id);

  const load = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/pm/tenant/${appState.sessionId}`);
      if (r.ok) {
        const data = await r.json();
        setTenants(data.length > 0 ? data : DEMO_TENANTS);
      } else {
        setTenants(DEMO_TENANTS);
      }
    } catch { setTenants(DEMO_TENANTS); }
  };

  const addTenant = async () => {
    if (!form.name.trim()) return;
    setScoring(true);
    try {
      const r = await fetch(`${API}/pm/tenant/create`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, ...form, monthly_rent: parseFloat(form.monthly_rent)||0 }),
      });
      if (r.ok) {
        const data = await r.json();
        setTenants(prev => [data, ...prev]);
        setShowModal(false);
        setForm({ name:"", unit:"", email:"", phone:"", move_in:"", lease_end:"", monthly_rent:"", financial_info:"" });
        if (data.risk_level === "High") {
          await requestApproval(data.id, `High Risk Tenant: ${data.name} (Unit ${data.unit})`, `Tenant risk score ${data.risk_score} — HIGH risk. Supervisor review required.`);
        }
      }
    } catch {}
    setScoring(false);
  };

  const updateStatus = async (t: any, status: string) => {
    await fetch(`${API}/pm/tenant/update`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ session_id: appState.sessionId, id: t.id, status }),
    });
    setTenants(prev => prev.map(x => x.id === t.id ? { ...x, status } : x));
  };

  const stats = {
    total: tenants.length,
    low: tenants.filter(t => t.risk_level === "Low").length,
    medium: tenants.filter(t => t.risk_level === "Medium").length,
    high: tenants.filter(t => t.risk_level === "High").length,
    totalRent: tenants.reduce((a,t) => a + (t.monthly_rent||0), 0),
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#d97706)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="#fff" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>Tenant Risk Scoring</h1>
            <span style={{ fontSize:9, fontWeight:700, background:"rgba(245,158,11,0.15)", color:"#f59e0b", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>AI scores tenant creditworthiness from financial info and documents.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"linear-gradient(135deg,#f59e0b,#d97706)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          Add Tenant
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Tenants", value:stats.total, color:"#f0f4f8" },
          { label:"Low Risk", value:stats.low, color:"#22d3a0" },
          { label:"Medium Risk", value:stats.medium, color:"#f59e0b" },
          { label:"High Risk", value:stats.high, color:"#f43f5e" },
          { label:"Monthly Rent", value:`$${(stats.totalRent/1000).toFixed(1)}K`, color:"#a78bfa" },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"70px 1fr 90px 100px 110px 100px 90px 100px", gap:12, padding:"11px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>
          {["ID","Tenant","Unit","Monthly Rent","Move In","Lease End","Risk","Status"].map(h => (
            <div key={h} style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {tenants.length === 0 ? (
          <div style={{ padding:"48px 20px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>No tenants added yet — click "Add Tenant" to score your first tenant.</div>
        ) : tenants.map((t, i) => {
          const rc = RISK_COLOR[t.risk_level] || RISK_COLOR.Unknown;
          const isExp = expanded === t.id;
          const apr = approvalFor(t.id);
          const hasEscalation = !!apr;
          return (
            <div key={t.id} style={{ borderBottom: i < tenants.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ display:"grid", gridTemplateColumns:"70px 1fr 90px 100px 110px 100px 90px 100px", gap:12, padding:"14px 20px", cursor:"pointer", alignItems:"center" }}
                onClick={() => setExpanded(isExp ? null : t.id)}>
                <div style={{ fontFamily:M, fontSize:11, color:"#f59e0b", fontWeight:600 }}>{t.id}</div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{t.name}</div>
                    {hasEscalation && (
                      <span style={{ fontSize:9, fontFamily:M, padding:"2px 6px", borderRadius:4, background: apr.status==="Approved"?"rgba(34,211,160,0.12)":apr.status==="Rejected"?"rgba(244,63,94,0.12)":"rgba(244,63,94,0.12)", color: apr.status==="Approved"?"#22d3a0":apr.status==="Rejected"?"#f43f5e":"#f43f5e", border: `1px solid ${apr.status==="Approved"?"rgba(34,211,160,0.25)":"rgba(244,63,94,0.25)"}` }}>
                        {apr.status==="Approved"?"Reviewed":apr.status==="Rejected"?"Action Required":"Escalated"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{t.email || "—"}</div>
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{t.unit || "—"}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#a78bfa" }}>${(t.monthly_rent||0).toLocaleString()}</div>
                <div style={{ fontSize:11, fontFamily:M, color:"rgba(255,255,255,0.4)" }}>{t.move_in || "—"}</div>
                <div style={{ fontSize:11, fontFamily:M, color:"rgba(255,255,255,0.4)" }}>{t.lease_end || "—"}</div>
                <span style={{ fontSize:10, fontFamily:M, padding:"3px 7px", borderRadius:5, background:rc.bg, color:rc.text, border:`1px solid ${rc.border}` }}>
                  {t.risk_level || "Unknown"}
                </span>
                <select value={t.status || "Active"} onChange={e => { e.stopPropagation(); updateStatus(t, e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"4px 8px", color:"#f0f4f8", fontSize:11, fontFamily:F, cursor:"pointer" }}>
                  {["Active","Notice","Vacated"].map(s => <option key={s} style={{ background:"#1c2535" }}>{s}</option>)}
                </select>
              </div>
              {isExp && (
                <div style={{ padding:"0 20px 16px", animation:"fadeUp 0.2s ease" }}>
                  {t.risk_details && (
                    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:16, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <div style={{ fontSize:10, fontFamily:M, color:"rgba(245,158,11,0.7)", letterSpacing:"0.08em" }}>AI RISK ASSESSMENT</div>
                        <div style={{ fontSize:13, fontWeight:700, color:rc.text }}>{t.risk_score}</div>
                      </div>
                      <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:2, marginBottom:12 }}>
                        <div style={{ height:"100%", borderRadius:2, background:rc.bar, width: t.risk_level==="Low"?"75%":t.risk_level==="Medium"?"45%":"20%" }}/>
                      </div>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65, margin:"0 0 12px" }}>{t.risk_details}</p>
                      {t.risk_level === "High" && !hasEscalation && (
                        <button disabled={escalating===t.id} onClick={e => { e.stopPropagation(); escalate(t); }}
                          style={{ padding:"7px 14px", borderRadius:7, border:"1px solid rgba(244,63,94,0.3)", background:"rgba(244,63,94,0.1)", color:"#f43f5e", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
                          {escalating===t.id ? "Escalating..." : "⚠ Escalate for Supervisor Review"}
                        </button>
                      )}
                      {hasEscalation && (
                        <div style={{ padding:"8px 12px", borderRadius:7, background:"rgba(244,63,94,0.06)", border:"1px solid rgba(244,63,94,0.15)", fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                          {apr.status==="Pending" ? "⏳ Awaiting supervisor review" : apr.status==="Approved" ? `✓ Reviewed by ${apr.reviewed_by}${apr.review_notes ? ": " + apr.review_notes : ""}` : `✗ Action Required: ${apr.review_notes}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }} onClick={() => setShowModal(false)}>
          <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:32, width:540, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:"0 0 20px" }}>Add Tenant</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[{k:"name",l:"Tenant Name",ph:"Full name"},{k:"unit",l:"Unit / Suite",ph:"e.g. 4B"},{k:"email",l:"Email",ph:"tenant@email.com"},{k:"phone",l:"Phone",ph:"+1 555-0000"}].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>{f.l.toUpperCase()}</label>
                    <input value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[{k:"move_in",l:"Move In",t:"date"},{k:"lease_end",l:"Lease End",t:"date"},{k:"monthly_rent",l:"Monthly Rent ($)",t:"number"}].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>{f.l.toUpperCase()}</label>
                    <input type={f.t} value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>FINANCIAL INFO (FOR AI SCORING)</label>
                <textarea rows={4} value={form.financial_info} onChange={e => setForm(p=>({...p,financial_info:e.target.value}))} placeholder="e.g. Annual income $120K, credit score 720, 2 years employment at tech company, no prior evictions…" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:4, fontFamily:M }}>Leave blank to skip AI scoring</div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex:1, padding:11, borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", fontFamily:F }}>Cancel</button>
                <button onClick={addTenant} disabled={scoring} style={{ flex:2, padding:11, borderRadius:9, border:"none", background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff", fontSize:13, fontWeight:600, cursor:scoring?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {scoring ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Scoring…</> : "Add & Score Tenant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
