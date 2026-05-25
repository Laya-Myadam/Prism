import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };
const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" };

type Tenant = { name: string; leased_sf: string; cam_cap_pct: string };

const DEMO_REPORT = {
  id:"CAM-DEMO",
  property_name:"Westgate Plaza",
  reconcile_year:"2024",
  total_cam_pool:124800,
  total_leasable_sf:38500,
  ai_summary:"CAM reconciliation for Westgate Plaza FY2024 is complete. Three of five tenants are subject to CAM caps ranging from 5–8%, with Rivera Holdings and Sunrise Café reaching their cap limits — resulting in $6,240 in unrecoverable CAM expenses absorbed by the landlord. Total billable CAM recovered: $118,560 (95% recovery rate). Recommend reviewing lease structure for new tenants to negotiate higher or uncapped CAM provisions.",
  tenants:[
    { name:"Rivera Holdings LLC", leased_sf:12000, pro_rata_pct:31.17, cam_share:38942, cam_cap:null, capped:false, billable:38942 },
    { name:"Sunrise Café", leased_sf:3200, pro_rata_pct:8.31, cam_share:10380, cam_cap:9860, capped:true, billable:9860 },
    { name:"Atlas Fitness", leased_sf:8500, pro_rata_pct:22.08, cam_share:27560, cam_cap:null, capped:false, billable:27560 },
    { name:"Urban Dental", leased_sf:4800, pro_rata_pct:12.47, cam_share:15563, cam_cap:14800, capped:true, billable:14800 },
    { name:"TechLab Co.", leased_sf:10000, pro_rata_pct:25.97, cam_share:32398, cam_cap:null, capped:false, billable:32398 },
  ],
};

export default function CAMReconciliation({ appState }: { appState: AppState }) {
  const [reports, setReports] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [form, setForm] = useState({ property_name:"Westgate Plaza", reconcile_year: new Date().getFullYear().toString(), total_cam_pool:"124800", total_leasable_sf:"38500" });
  const [tenants, setTenants] = useState<Tenant[]>([
    { name:"Rivera Holdings LLC", leased_sf:"12000", cam_cap_pct:"" },
    { name:"Sunrise Café",        leased_sf:"3200",  cam_cap_pct:"5" },
    { name:"Atlas Fitness",       leased_sf:"8500",  cam_cap_pct:"" },
    { name:"Urban Dental",        leased_sf:"4800",  cam_cap_pct:"8" },
    { name:"TechLab Co.",         leased_sf:"10000", cam_cap_pct:"" },
  ]);

  useEffect(() => { load(); loadApprovals(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/pm/cam/${appState.sessionId}`);
      if (r.ok) {
        const data = await r.json();
        setReports(data.length > 0 ? data : [DEMO_REPORT]);
        setExpanded(data.length > 0 ? null : "CAM-DEMO");
      } else {
        setReports([DEMO_REPORT]);
        setExpanded("CAM-DEMO");
      }
    } catch { setReports([DEMO_REPORT]); setExpanded("CAM-DEMO"); }
  };

  const loadApprovals = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/approvals/${appState.sessionId}`);
      if (r.ok) setApprovals(await r.json());
    } catch {}
  };

  const requestApproval = async (reference_id: string, property: string, year: string) => {
    try {
      await fetch(`${API}/approvals/request`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, type:"cam", reference_id, title: `CAM Reconciliation: ${property} ${year}`, description: `CAM reconciliation calculated for ${property} FY${year}. Supervisor must review and approve before tenant billing letters are sent.`, requested_by: appState.user?.name || "Staff" }),
      });
      await loadApprovals();
    } catch {}
  };

  const approvalFor = (id: string) => approvals.find(a => a.reference_id === id);

  const addTenantRow = () => setTenants(prev => [...prev, { name:"", leased_sf:"", cam_cap_pct:"" }]);
  const removeTenantRow = (i: number) => setTenants(prev => prev.filter((_,idx) => idx !== i));
  const updateTenant = (i: number, k: keyof Tenant, v: string) => setTenants(prev => prev.map((t, idx) => idx === i ? {...t, [k]: v} : t));

  const totalSF = tenants.reduce((a,t) => a + (parseFloat(t.leased_sf)||0), 0);
  const camPool = parseFloat(form.total_cam_pool)||0;

  const reconcile = async () => {
    if (!camPool || !form.total_leasable_sf) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/pm/cam/reconcile`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          session_id: appState.sessionId,
          property_name: form.property_name,
          reconcile_year: form.reconcile_year,
          total_cam_pool: camPool,
          total_leasable_sf: parseFloat(form.total_leasable_sf)||0,
          tenants: tenants.filter(t => t.name && t.leased_sf).map(t => ({
            name: t.name,
            leased_sf: parseFloat(t.leased_sf)||0,
            cam_cap_pct: parseFloat(t.cam_cap_pct)||0,
          })),
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setReports(prev => [data, ...prev]);
        setExpanded(data.id);
        await requestApproval(data.id, form.property_name, form.reconcile_year);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:28 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#f43f5e,#b91c3b)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4h2v4zm0-6h-2V7h2v4z" fill="#fff"/></svg>
        </div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>CAM Reconciliation</h1>
            <span style={{ fontSize:9, fontWeight:700, background:"rgba(244,63,94,0.15)", color:"#f43f5e", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Calculate each tenant's pro-rata CAM share · AI flags capped tenants and anomalies.</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Input */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:14, color:"rgba(255,255,255,0.7)" }}>Property Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>PROPERTY NAME</label>
                <input value={form.property_name} onChange={e => setForm(p=>({...p,property_name:e.target.value}))} placeholder="e.g. Westgate Plaza" style={inp}/>
              </div>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>RECONCILE YEAR</label>
                <input value={form.reconcile_year} onChange={e => setForm(p=>({...p,reconcile_year:e.target.value}))} placeholder="2025" style={inp}/>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>TOTAL CAM POOL ($)</label>
                <input type="number" value={form.total_cam_pool} onChange={e => setForm(p=>({...p,total_cam_pool:e.target.value}))} placeholder="0" style={inp}/>
              </div>
              <div>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>TOTAL LEASABLE SF</label>
                <input type="number" value={form.total_leasable_sf} onChange={e => setForm(p=>({...p,total_leasable_sf:e.target.value}))} placeholder="0" style={inp}/>
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>Tenants</div>
              <button onClick={addTenantRow} style={{ fontSize:11, color:"#f43f5e", background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.2)", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:F }}>+ Add Tenant</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 28px", gap:8, marginBottom:6 }}>
              {["Tenant Name","Leased SF","CAM Cap %",""].map(h => <div key={h} style={{ fontSize:9, fontFamily:M, color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>)}
            </div>
            {tenants.map((t, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 28px", gap:8, marginBottom:8 }}>
                <input value={t.name} onChange={e => updateTenant(i,"name",e.target.value)} placeholder="Tenant name" style={{ ...inp, fontSize:12 }}/>
                <input type="number" value={t.leased_sf} onChange={e => updateTenant(i,"leased_sf",e.target.value)} placeholder="SF" style={{ ...inp, fontSize:12 }}/>
                <input type="number" value={t.cam_cap_pct} onChange={e => updateTenant(i,"cam_cap_pct",e.target.value)} placeholder="0" style={{ ...inp, fontSize:12 }}/>
                <button onClick={() => removeTenantRow(i)} style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.15)", borderRadius:6, color:"#f43f5e", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
              </div>
            ))}
            {totalSF > 0 && (
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:M, marginTop:4 }}>
                Total leased: {totalSF.toLocaleString()} SF
                {parseFloat(form.total_leasable_sf) > 0 && ` · ${((totalSF/parseFloat(form.total_leasable_sf))*100).toFixed(1)}% occupied`}
              </div>
            )}
          </div>

          <button onClick={reconcile} disabled={loading||!camPool} style={{ padding:"13px", borderRadius:10, border:"none", background:loading||!camPool?"rgba(244,63,94,0.2)":"linear-gradient(135deg,#f43f5e,#b91c3b)", color:"#fff", fontSize:14, fontWeight:700, cursor:loading||!camPool?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? <><div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Reconciling…</> : "Run CAM Reconciliation"}
          </button>
        </div>

        {/* Preview */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:16, color:"rgba(255,255,255,0.7)" }}>Live CAM Preview</div>
          {tenants.filter(t => t.name && t.leased_sf).length === 0 ? (
            <div style={{ color:"rgba(255,255,255,0.2)", fontSize:13, textAlign:"center", padding:"32px 0" }}>Add tenants to see live CAM allocation</div>
          ) : (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 90px", gap:8, marginBottom:8 }}>
                {["Tenant","SF","Pro-Rata","CAM Share"].map(h => <div key={h} style={{ fontSize:9, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>)}
              </div>
              {tenants.filter(t => t.name && t.leased_sf).map((t, i) => {
                const sf = parseFloat(t.leased_sf)||0;
                const totalLeasable = parseFloat(form.total_leasable_sf)||1;
                const proRata = sf / totalLeasable;
                const share = camPool * proRata;
                const capLimit = parseFloat(t.cam_cap_pct) > 0 ? share * (1 + parseFloat(t.cam_cap_pct)/100) : null;
                const capped = capLimit !== null && share > capLimit;
                return (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 90px", gap:8, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize:12, color:"#f0f4f8" }}>{t.name}</div>
                    <div style={{ fontSize:12, fontFamily:M, color:"rgba(255,255,255,0.5)" }}>{sf.toLocaleString()}</div>
                    <div style={{ fontSize:12, fontFamily:M, color:"rgba(255,255,255,0.5)" }}>{(proRata*100).toFixed(1)}%</div>
                    <div>
                      <div style={{ fontSize:12, fontFamily:M, color:capped?"#f59e0b":"#22d3a0", fontWeight:600 }}>${share.toFixed(0)}</div>
                      {capped && <div style={{ fontSize:9, fontFamily:M, color:"#f59e0b" }}>CAPPED</div>}
                    </div>
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Total CAM Pool</span>
                <span style={{ fontSize:14, fontWeight:700, fontFamily:M, color:"#f43f5e" }}>${camPool.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Past reports */}
      {reports.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:12, fontFamily:M, letterSpacing:"0.08em" }}>PAST RECONCILIATIONS</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {reports.map(rep => {
              const isExp = expanded === rep.id;
              const tenantData = Array.isArray(rep.tenants) ? rep.tenants : (rep.tenants_data ? JSON.parse(rep.tenants_data) : []);
              const apr = approvalFor(rep.id);
              const camStatus = apr?.status==="Approved" ? "Finalized" : apr?.status==="Rejected" ? "Rejected" : apr ? "Pending Review" : null;
              return (
                <div key={rep.id} style={{ ...card, padding:0, overflow:"hidden", animation:"fadeUp 0.2s ease", borderColor: camStatus==="Finalized"?"rgba(34,211,160,0.2)":camStatus==="Pending Review"?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.07)" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 120px 120px 120px 80px", gap:12, padding:"14px 20px", cursor:"pointer", alignItems:"center" }}
                    onClick={() => setExpanded(isExp ? null : rep.id)}>
                    <div style={{ fontFamily:M, fontSize:11, color:"#f43f5e", fontWeight:600 }}>{rep.id}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{rep.property_name||"Unnamed"}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{rep.reconcile_year}</div>
                    </div>
                    <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2, fontFamily:M }}>CAM POOL</div><div style={{ fontSize:13, fontWeight:700, color:"#f43f5e" }}>${(rep.total_cam_pool||0).toLocaleString()}</div></div>
                    <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2, fontFamily:M }}>TENANTS</div><div style={{ fontSize:13, color:"#f0f4f8" }}>{tenantData.length}</div></div>
                    {camStatus ? (
                      <span style={{ fontSize:10, fontFamily:M, padding:"3px 8px", borderRadius:5, whiteSpace:"nowrap", background: camStatus==="Finalized"?"rgba(34,211,160,0.12)":camStatus==="Rejected"?"rgba(244,63,94,0.12)":"rgba(245,158,11,0.12)", color: camStatus==="Finalized"?"#22d3a0":camStatus==="Rejected"?"#f43f5e":"#f59e0b", border: `1px solid ${camStatus==="Finalized"?"rgba(34,211,160,0.25)":camStatus==="Rejected"?"rgba(244,63,94,0.25)":"rgba(245,158,11,0.25)"}` }}>{camStatus}</span>
                    ) : <div/>}
                    <svg style={{ color:"rgba(255,255,255,0.2)", transform:isExp?"rotate(180deg)":"none", transition:"transform 200ms", justifySelf:"end" }} width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  {isExp && (
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"16px 20px", animation:"fadeUp 0.2s ease" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        <div>
                          <div style={{ fontSize:10, fontFamily:M, color:"rgba(244,63,94,0.7)", letterSpacing:"0.08em", marginBottom:10 }}>TENANT ALLOCATIONS</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 90px 60px", gap:8, marginBottom:6 }}>
                            {["Tenant","SF","Pro-Rata","Billable","Capped?"].map(h => <div key={h} style={{ fontSize:9, fontFamily:M, color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em" }}>{h.toUpperCase()}</div>)}
                          </div>
                          {tenantData.map((t: any, i: number) => (
                            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 90px 60px", gap:8, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                              <div style={{ fontSize:12, color:"#f0f4f8" }}>{t.name}</div>
                              <div style={{ fontSize:11, fontFamily:M, color:"rgba(255,255,255,0.4)" }}>{(t.leased_sf||0).toLocaleString()}</div>
                              <div style={{ fontSize:11, fontFamily:M, color:"rgba(255,255,255,0.4)" }}>{t.pro_rata_pct}%</div>
                              <div style={{ fontSize:12, fontFamily:M, color:t.capped?"#f59e0b":"#22d3a0", fontWeight:600 }}>${(t.billable||0).toFixed(0)}</div>
                              <div style={{ fontSize:10, fontFamily:M, color:t.capped?"#f59e0b":"rgba(255,255,255,0.2)" }}>{t.capped?"YES":"—"}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontFamily:M, color:"rgba(34,211,160,0.7)", letterSpacing:"0.08em", marginBottom:10 }}>AI SUMMARY</div>
                          <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65, margin:0 }}>{rep.ai_summary}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
