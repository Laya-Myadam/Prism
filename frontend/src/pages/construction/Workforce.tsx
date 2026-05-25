import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";

const TRADES = ["Concrete","Formwork","HSE","Rebar","MEP","Civil","Crane","Electrical","Plumbing","Carpentry","Steel","Other"];
const ROLES = ["Foreman","Carpenter","Safety Officer","Ironworker","Engineer","Surveyor","Operator","Laborer","Superintendent","Inspector","Other"];
const TRADE_COLOR: Record<string,string> = { Concrete:"#00a8f0",Formwork:"#a78bfa",HSE:"#22d3a0",Rebar:"#38bfff",MEP:"#f59e0b",Civil:"#fbbf24",Crane:"#f43f5e",Electrical:"#fb923c",Plumbing:"#34d399",Carpentry:"#818cf8",Steel:"#94a3b8",Other:"#64748b" };
const STATUS_COLOR: Record<string,string> = { Active:"#22d3a0","On Leave":"#f59e0b",Inactive:"#f43f5e" };

const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" };

function TabBar({ tabs, active, onChange }: { tabs:{id:string;label:string}[]; active:string; onChange:(s:string)=>void }) {
  return (
    <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:4, marginBottom:24, width:"fit-content" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ padding:"7px 18px", borderRadius:7, border:"none", background:active===t.id?"rgba(0,168,240,0.15)":"transparent", color:active===t.id?"#38bfff":"rgba(255,255,255,0.38)", fontSize:13, fontWeight:active===t.id?600:400, cursor:"pointer", fontFamily:F, transition:"all 150ms" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Workforce({ appState }: { appState: AppState }) {
  const [tab, setTab] = useState("construction");
  const [workers, setWorkers] = useState<any[]>([]);
  const [pmWorkers, setPmWorkers] = useState<any[]>([]);
  const [filterTrade, setFilterTrade] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<any|null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", role:"Foreman", trade:"Concrete", company:"", phone:"", email:"", status:"Active", start_date:"", daily_rate:"" });

  useEffect(() => { load(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/construction/workers/${appState.sessionId}`);
      if (r.ok) {
        const data = await r.json();
        setWorkers(data.filter((w:any) => !w.is_pm));
        setPmWorkers(data.filter((w:any) => w.is_pm));
      }
    } catch {}
  };

  const openAdd = (isPM = false) => {
    setEditWorker(null);
    setForm({ name:"", role:isPM?"Property Manager":"Foreman", trade:isPM?"Management":"Concrete", company:"", phone:"", email:"", status:"Active", start_date:"", daily_rate:"" });
    setShowModal(true);
  };

  const openEdit = (w: any) => {
    setEditWorker(w);
    setForm({ name:w.name||"", role:w.role||"", trade:w.trade||"", company:w.company||"", phone:w.phone||"", email:w.email||"", status:w.status||"Active", start_date:w.start_date||"", daily_rate:String(w.daily_rate||"") });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editWorker) {
      const r = await fetch(`${API}/construction/workers/update`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, id: editWorker.id, ...form, daily_rate: parseFloat(form.daily_rate)||0 }),
      });
      if (r.ok) {
        const updated = await r.json();
        setWorkers(prev => prev.map(w => w.id === editWorker.id ? { ...w, ...updated } : w));
        setPmWorkers(prev => prev.map(w => w.id === editWorker.id ? { ...w, ...updated } : w));
      }
    } else {
      const r = await fetch(`${API}/construction/workers/create`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, ...form, daily_rate: parseFloat(form.daily_rate)||0 }),
      });
      if (r.ok) {
        const newW = await r.json();
        if (tab === "pm") setPmWorkers(prev => [newW, ...prev]);
        else setWorkers(prev => [newW, ...prev]);
      }
    }
    setSaving(false);
    setShowModal(false);
  };

  const deleteWorker = async (w: any) => {
    if (!confirm(`Remove ${w.name}?`)) return;
    await fetch(`${API}/construction/workers/${appState.sessionId}/${w.id}`, { method:"DELETE" });
    setWorkers(prev => prev.filter(x => x.id !== w.id));
    setPmWorkers(prev => prev.filter(x => x.id !== w.id));
  };

  const displayWorkers = tab === "pm" ? pmWorkers : workers;
  const filtered = displayWorkers.filter(w => {
    const matchT = filterTrade === "All" || w.trade === filterTrade;
    const matchS = (w.name||"").toLowerCase().includes(search.toLowerCase()) || (w.trade||"").toLowerCase().includes(search.toLowerCase()) || (w.role||"").toLowerCase().includes(search.toLowerCase());
    return matchT && matchS;
  });

  const totalPayroll = workers.reduce((a,w) => a + (w.daily_rate||0), 0);

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:"0 0 4px" }}>Workforce</h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Manage workers · Track trades · Supabase-persisted</p>
        </div>
        <button onClick={() => openAdd(tab === "pm")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"linear-gradient(135deg,#00a8f0,#0054a0)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          Add Worker
        </button>
      </div>

      <TabBar tabs={[{id:"construction",label:"Site Workers"},{id:"pm",label:"PM Contractors"}]} active={tab} onChange={setTab} />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:tab==="pm"?"PM Staff":"Site Workers", value:(tab==="pm"?pmWorkers:workers).length, color:"#f0f4f8" },
          { label:"Active", value:(tab==="pm"?pmWorkers:workers).filter(w=>w.status==="Active").length, color:"#22d3a0" },
          { label:"On Leave", value:(tab==="pm"?pmWorkers:workers).filter(w=>w.status==="On Leave").length, color:"#f59e0b" },
          { label:"Daily Payroll", value:`$${totalPayroll.toLocaleString()}`, color:"#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, maxWidth:300 }}>
          <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }} width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, trade, role…" style={{ width:"100%", paddingLeft:36, padding:"9px 12px 9px 36px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#f0f4f8", fontSize:13, outline:"none", fontFamily:F, boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["All", ...TRADES.slice(0,6)].map(t => (
            <button key={t} onClick={() => setFilterTrade(t)} style={{ padding:"7px 12px", borderRadius:7, border:filterTrade===t?"1px solid rgba(0,168,240,0.3)":"1px solid rgba(255,255,255,0.08)", background:filterTrade===t?"rgba(0,168,240,0.12)":"transparent", color:filterTrade===t?"#38bfff":"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", fontFamily:F }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Worker cards */}
      {filtered.length === 0 ? (
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"48px 20px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>
          {displayWorkers.length === 0 ? `No ${tab==="pm"?"PM contractors":"site workers"} added yet — click "Add Worker" to start.` : "No workers match the filter."}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {filtered.map(w => {
            const tc = TRADE_COLOR[w.trade] || "#64748b";
            const sc = STATUS_COLOR[w.status] || "#64748b";
            return (
              <div key={w.id} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:16, animation:"fadeUp 0.2s ease", transition:"border-color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(255,255,255,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor="rgba(255,255,255,0.07)")}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${tc}20`, border:`1px solid ${tc}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:tc }}>{(w.name||"?").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{w.name}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 }}>{w.role}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={() => openEdit(w)} style={{ width:26, height:26, borderRadius:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => deleteWorker(w)} style={{ width:26, height:26, borderRadius:6, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.15)", color:"#f43f5e", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  <span style={{ fontSize:10, fontFamily:M, padding:"2px 7px", borderRadius:4, background:`${tc}15`, color:tc, border:`1px solid ${tc}25` }}>{w.trade}</span>
                  <span style={{ fontSize:10, fontFamily:M, padding:"2px 7px", borderRadius:4, background:`${sc}15`, color:sc, border:`1px solid ${sc}25` }}>{w.status}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {w.company && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>🏢 {w.company}</div>}
                  {w.phone && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>📞 {w.phone}</div>}
                  {w.email && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>✉️ {w.email}</div>}
                  {w.daily_rate > 0 && <div style={{ fontSize:11, color:"#a78bfa", marginTop:2 }}>💰 ${w.daily_rate}/day</div>}
                </div>
                {w.id && <div style={{ fontSize:9, fontFamily:M, color:"rgba(255,255,255,0.15)", marginTop:8 }}>{w.id}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }} onClick={() => setShowModal(false)}>
          <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:32, width:520, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:"0 0 20px" }}>{editWorker ? "Edit Worker" : "Add Worker"}</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[{k:"name",l:"Full Name",ph:"Name"},{k:"company",l:"Company",ph:"Company name"}].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>{f.l.toUpperCase()}</label>
                    <input value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>TRADE</label>
                  <select value={form.trade} onChange={e => setForm(p=>({...p,trade:e.target.value}))} style={{ ...inp }}>
                    {TRADES.map(t => <option key={t} style={{ background:"#1c2535" }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>ROLE</label>
                  <select value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))} style={{ ...inp }}>
                    {ROLES.map(r => <option key={r} style={{ background:"#1c2535" }}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[{k:"phone",l:"Phone",ph:"+1 555-0000"},{k:"email",l:"Email",ph:"email@co.com"},{k:"daily_rate",l:"Daily Rate ($)",ph:"0"}].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>{f.l.toUpperCase()}</label>
                    <input value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>STATUS</label>
                  <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} style={{ ...inp }}>
                    {["Active","On Leave","Inactive"].map(s => <option key={s} style={{ background:"#1c2535" }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:5 }}>START DATE</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p=>({...p,start_date:e.target.value}))} style={inp}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex:1, padding:11, borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", fontFamily:F }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ flex:2, padding:11, borderRadius:9, border:"none", background:"linear-gradient(135deg,#00a8f0,#0054a0)", color:"#fff", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {saving ? <><div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Saving…</> : editWorker ? "Save Changes" : "Add Worker"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
