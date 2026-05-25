import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };
const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" };

const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

export default function NOIForecaster({ appState }: { appState: AppState }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [form, setForm] = useState({
    property_name:"Riverside Heights Mixed-Use", report_period:"2025",
    gross_potential_rent:"480000", vacancy_rate:"6",
    other_income:"18000",
    management_fee:"38400", insurance:"14400", taxes:"52000", maintenance:"28000", utilities:"9600", other_expenses:"8000",
    purchase_price:"5800000",
  });

  const DEMO_REPORT = {
    id:"NOI-DEMO", property_name:"Riverside Heights Mixed-Use", report_period:"2024",
    gross_potential_rent:456000, vacancy_loss:27360, other_income:15600,
    effective_gross:444240, operating_expenses:148200, noi:296040, cap_rate:5.1,
    ai_summary:"Riverside Heights is performing above the market average for mixed-use assets in this submarket, with an expense ratio of 33.4% — well below the 40–45% benchmark. The 6% vacancy rate is slightly elevated; lease-up of two vacant retail units could add $32K in annual NOI.",
    ai_recommendations:"1) Prioritize leasing the two vacant retail units to reduce vacancy loss by ~$32K/yr. 2) Renegotiate property insurance — current premium is 15% above market rate for comparable assets. 3) Consider a CAM audit on anchor tenant — CAM reimbursements appear underreported vs. actual expenses.",
    expense_breakdown:{ management_fee:36480, insurance:12800, taxes:48000, maintenance:25600, utilities:8800, other:16520 },
  };

  useEffect(() => { load(); loadApprovals(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/pm/noi/${appState.sessionId}`);
      if (r.ok) {
        const data = await r.json();
        setReports(data.length > 0 ? data : [DEMO_REPORT]);
        setExpanded(data.length > 0 ? null : "NOI-DEMO");
      } else {
        setReports([DEMO_REPORT]);
        setExpanded("NOI-DEMO");
      }
    } catch { setReports([DEMO_REPORT]); setExpanded("NOI-DEMO"); }
  };

  const loadApprovals = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/approvals/${appState.sessionId}`);
      if (r.ok) setApprovals(await r.json());
    } catch {}
  };

  const requestApproval = async (reference_id: string, property: string, noiValue: number) => {
    try {
      await fetch(`${API}/approvals/request`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, type:"noi", reference_id, title: `NOI Report: ${property}`, description: `NOI report calculated — NOI $${noiValue.toLocaleString()}/yr. Requires supervisor sign-off before publishing.`, requested_by: appState.user?.name || "Staff" }),
      });
      await loadApprovals();
    } catch {}
  };

  const approvalFor = (id: string) => approvals.find(a => a.reference_id === id);

  const n = (k: string) => parseFloat((form as any)[k]) || 0;
  const gpr = n("gross_potential_rent");
  const vacancyLoss = gpr * (n("vacancy_rate") / 100);
  const egi = gpr - vacancyLoss + n("other_income");
  const opex = n("management_fee") + n("insurance") + n("taxes") + n("maintenance") + n("utilities") + n("other_expenses");
  const noi = egi - opex;
  const capRate = n("purchase_price") > 0 ? (noi / n("purchase_price") * 100) : 0;
  const expenseRatio = egi > 0 ? (opex / egi * 100) : 0;

  const runForecast = async () => {
    if (!gpr) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/pm/noi/calculate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          session_id: appState.sessionId,
          property_name: form.property_name, report_period: form.report_period,
          gross_potential_rent: gpr, vacancy_rate: n("vacancy_rate"),
          other_income: n("other_income"),
          management_fee: n("management_fee"), insurance: n("insurance"),
          taxes: n("taxes"), maintenance: n("maintenance"),
          utilities: n("utilities"), other_expenses: n("other_expenses"),
          purchase_price: n("purchase_price"),
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setReports(prev => [data, ...prev]);
        setExpanded(data.id);
        await requestApproval(data.id, form.property_name, data.noi || noi);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:28 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#22d3a0,#059669)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 20l4-8 4 4 4-6 4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>NOI Forecaster</h1>
            <span style={{ fontSize:9, fontWeight:700, background:"rgba(34,211,160,0.15)", color:"#22d3a0", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Calculate Net Operating Income and get AI performance insights.</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Input panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:14, color:"rgba(255,255,255,0.7)" }}>Property Info</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{k:"property_name",l:"Property Name",ph:"e.g. Riverside Plaza"},{k:"report_period",l:"Report Period",ph:"e.g. 2025"}].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>{f.l.toUpperCase()}</label>
                  <input value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:14, color:"rgba(255,255,255,0.7)" }}>Income (Annual $)</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[{k:"gross_potential_rent",l:"Gross Potential Rent",ph:"0"},{k:"vacancy_rate",l:"Vacancy Rate (%)",ph:"5"},{k:"other_income",l:"Other Income",ph:"0"}].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>{f.l.toUpperCase()}</label>
                  <input type="number" value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:14, color:"rgba(255,255,255,0.7)" }}>Operating Expenses (Annual $)</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[{k:"management_fee",l:"Management Fee"},{k:"insurance",l:"Insurance"},{k:"taxes",l:"Property Taxes"},{k:"maintenance",l:"Maintenance"},{k:"utilities",l:"Utilities"},{k:"other_expenses",l:"Other"}].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>{f.l.toUpperCase()}</label>
                  <input type="number" value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder="0" style={inp}/>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:14, color:"rgba(255,255,255,0.7)" }}>Valuation (Optional)</div>
            <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", display:"block", marginBottom:4 }}>PURCHASE PRICE ($)</label>
            <input type="number" value={form.purchase_price} onChange={e => setForm(p=>({...p,purchase_price:e.target.value}))} placeholder="0" style={inp}/>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...card, borderColor:"rgba(34,211,160,0.2)" }}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:16, color:"rgba(255,255,255,0.7)" }}>Live NOI Preview</div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {[
                { label:"Gross Potential Rent", value:gpr, color:"rgba(255,255,255,0.7)", indent:0 },
                { label:`Vacancy Loss (${n("vacancy_rate")}%)`, value:-vacancyLoss, color:"#f43f5e", indent:0 },
                { label:"Other Income", value:n("other_income"), color:"rgba(255,255,255,0.7)", indent:0 },
                { label:"Effective Gross Income", value:egi, color:"#38bfff", indent:0, bold:true, border:true },
                { label:"Total Operating Expenses", value:-opex, color:"#f43f5e", indent:0 },
                { label:"Net Operating Income", value:noi, color:noi>=0?"#22d3a0":"#f43f5e", indent:0, bold:true, border:true, big:true },
              ].map((row, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:`${row.border?"10px 0":"6px 0"}`, borderTop:row.border?"1px solid rgba(255,255,255,0.08)":"none", marginTop:row.border?4:0 }}>
                  <span style={{ fontSize:row.bold?13:12, color:"rgba(255,255,255,0.5)", fontWeight:row.bold?600:400 }}>{row.label}</span>
                  <span style={{ fontSize:row.big?18:row.bold?13:12, fontWeight:row.big?800:row.bold?600:400, fontFamily:M, color:row.color }}>{fmt(Math.abs(row.value))}{(row.value||0)<0&&row.label!=="Total Operating Expenses"?" (loss)":""}</span>
                </div>
              ))}
              {capRate > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:4 }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Cap Rate</span>
                  <span style={{ fontSize:14, fontWeight:700, fontFamily:M, color:capRate>=6?"#22d3a0":capRate>=4?"#f59e0b":"#f43f5e" }}>{capRate.toFixed(2)}%</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Expense Ratio</span>
                <span style={{ fontSize:12, fontFamily:M, color:expenseRatio<=40?"#22d3a0":expenseRatio<=55?"#f59e0b":"#f43f5e" }}>{expenseRatio.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <button onClick={runForecast} disabled={loading||!gpr} style={{ padding:"13px", borderRadius:10, border:"none", background:loading||!gpr?"rgba(34,211,160,0.2)":"linear-gradient(135deg,#22d3a0,#059669)", color:"#fff", fontSize:14, fontWeight:700, cursor:loading||!gpr?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? <><div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Running AI Analysis…</> : "Run AI NOI Analysis"}
          </button>
        </div>
      </div>

      {/* Past reports */}
      {reports.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:12, fontFamily:M, letterSpacing:"0.08em" }}>PAST REPORTS</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {reports.map(rep => {
              const isExp = expanded === rep.id;
              const apr = approvalFor(rep.id);
              const pubStatus = apr?.status==="Approved" ? "Published" : apr?.status==="Rejected" ? "Rejected" : apr ? "Pending Review" : null;
              return (
                <div key={rep.id} style={{ ...card, padding:0, overflow:"hidden", animation:"fadeUp 0.2s ease" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 120px 120px 100px 120px 60px", gap:12, padding:"14px 20px", cursor:"pointer", alignItems:"center" }}
                    onClick={() => setExpanded(isExp ? null : rep.id)}>
                    <div style={{ fontFamily:M, fontSize:11, color:"#22d3a0", fontWeight:600 }}>{rep.id}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{rep.property_name || "Unnamed"}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{rep.report_period}</div>
                    </div>
                    <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2, fontFamily:M }}>NOI</div><div style={{ fontSize:14, fontWeight:700, color:rep.noi>=0?"#22d3a0":"#f43f5e" }}>{fmt(rep.noi)}</div></div>
                    <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2, fontFamily:M }}>EGI</div><div style={{ fontSize:13, color:"#38bfff" }}>{fmt(rep.effective_gross)}</div></div>
                    <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2, fontFamily:M }}>CAP RATE</div><div style={{ fontSize:13, fontWeight:600, color:rep.cap_rate>=6?"#22d3a0":rep.cap_rate>=4?"#f59e0b":"rgba(255,255,255,0.4)" }}>{rep.cap_rate?`${rep.cap_rate}%`:"—"}</div></div>
                    {pubStatus ? (
                      <span style={{ fontSize:10, fontFamily:M, padding:"3px 8px", borderRadius:5, whiteSpace:"nowrap", background: pubStatus==="Published"?"rgba(34,211,160,0.12)":pubStatus==="Rejected"?"rgba(244,63,94,0.12)":"rgba(245,158,11,0.12)", color: pubStatus==="Published"?"#22d3a0":pubStatus==="Rejected"?"#f43f5e":"#f59e0b", border: `1px solid ${pubStatus==="Published"?"rgba(34,211,160,0.25)":pubStatus==="Rejected"?"rgba(244,63,94,0.25)":"rgba(245,158,11,0.25)"}` }}>{pubStatus}</span>
                    ) : <div/>}
                    <svg style={{ color:"rgba(255,255,255,0.2)", transform:isExp?"rotate(180deg)":"none", transition:"transform 200ms", justifySelf:"end" }} width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  {isExp && (
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"16px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      <div>
                        <div style={{ fontSize:10, fontFamily:M, color:"rgba(34,211,160,0.7)", letterSpacing:"0.08em", marginBottom:10 }}>AI SUMMARY</div>
                        <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65, margin:"0 0 12px" }}>{rep.ai_summary}</p>
                        <div style={{ fontSize:10, fontFamily:M, color:"rgba(245,158,11,0.7)", letterSpacing:"0.08em", marginBottom:8 }}>RECOMMENDATIONS</div>
                        <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.65, margin:0 }}>{rep.ai_recommendations}</p>
                      </div>
                      <div>
                        <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:10 }}>EXPENSE BREAKDOWN</div>
                        {rep.expense_breakdown && Object.entries(rep.expense_breakdown).map(([k,v]:any) => v > 0 && (
                          <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", textTransform:"capitalize" }}>{k.replace(/_/g," ")}</span>
                            <span style={{ fontSize:12, fontFamily:M, color:"#f43f5e" }}>{fmt(v)}</span>
                          </div>
                        ))}
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
