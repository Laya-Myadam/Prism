import { useState, useEffect, useRef } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card: React.CSSProperties = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 };

const CONF_STYLE: Record<string,{bg:string;text:string;border:string;icon:string}> = {
  High:   { bg:"rgba(34,211,160,0.1)",  text:"#22d3a0", border:"rgba(34,211,160,0.25)",  icon:"✓" },
  Medium: { bg:"rgba(245,158,11,0.1)",  text:"#f59e0b", border:"rgba(245,158,11,0.25)",  icon:"~" },
  Low:    { bg:"rgba(244,63,94,0.1)",   text:"#f43f5e", border:"rgba(244,63,94,0.25)",   icon:"!" },
};

const APR_STYLE: Record<string,{bg:string;text:string;border:string}> = {
  Pending:  { bg:"rgba(245,158,11,0.1)",  text:"#f59e0b", border:"rgba(245,158,11,0.25)" },
  Rejected: { bg:"rgba(244,63,94,0.1)",   text:"#f43f5e", border:"rgba(244,63,94,0.25)" },
  Approved: { bg:"rgba(34,211,160,0.1)",  text:"#22d3a0", border:"rgba(34,211,160,0.25)" },
  Active:   { bg:"rgba(34,211,160,0.1)",  text:"#22d3a0", border:"rgba(34,211,160,0.25)" },
};

function notFound(v: any) {
  if (v === null || v === undefined) return true;
  const s = String(v);
  return s === "—" || s.toLowerCase().includes("not stated") || s.toLowerCase().includes("not found") || s.toLowerCase().includes("review required");
}

export default function LeaseAbstraction({ appState }: { appState: AppState }) {
  const [leases, setLeases]       = useState<any[]>([]);
  const [expanded, setExpanded]   = useState<string|null>(null);
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState("");
  const [approvals, setApprovals] = useState<any[]>([]);
  const [dragOver, setDragOver]   = useState(false);
  const [rawText, setRawText]     = useState("");
  const [propAddr, setPropAddr]   = useState("");
  const [fileName, setFileName]   = useState("");
  const [parsing, setParsing]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); loadApprovals(); }, [appState.sessionId]);

  // Refresh approvals whenever user navigates back to this tab/page
  useEffect(() => {
    const onFocus = () => loadApprovals();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/pm/lease/${appState.sessionId}`);
      if (r.ok) setLeases(await r.json());
    } catch {}
    setLoading(false);
  };

  const loadApprovals = async () => {
    if (!appState.sessionId) return;
    try {
      const r = await fetch(`${API}/approvals/${appState.sessionId}`);
      if (r.ok) setApprovals(await r.json());
    } catch {}
  };

  const requestApproval = async (type: string, reference_id: string, title: string, description: string) => {
    try {
      await fetch(`${API}/approvals/request`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id:appState.sessionId, type, reference_id, title, description, requested_by:appState.user?.name||"Staff" }),
      });
      await loadApprovals();
    } catch {}
  };

  const approvalFor = (id: string) => approvals.find(a => a.reference_id === id);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setRawText("");
    setParsing(true);
    setExtractMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch(`${API}/pm/lease/parse-text`, { method:"POST", body:form });
      if (r.ok) {
        const d = await r.json();
        if (d.error) { setExtractMsg(d.error); }
        else { setRawText(d.text || ""); }
      } else {
        setExtractMsg("Could not read PDF — try again.");
      }
    } catch { setExtractMsg("Connection error."); }
    setParsing(false);
  };

  const abstractLease = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    setExtractMsg("Extracting lease terms with AI…");
    try {
      const r = await fetch(`${API}/pm/lease/abstract`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: appState.sessionId, raw_text: rawText, property_address: propAddr }),
      });
      if (!r.ok) { setExtractMsg("Extraction failed — try again."); setExtracting(false); return; }
      const data = await r.json();
      setLeases(prev => [data, ...prev]);
      setShowModal(false);
      setRawText(""); setPropAddr(""); setFileName(""); setExtractMsg("");
      await requestApproval(
        "lease", data.id,
        `Lease Approval: ${data.tenant_name || "Unknown Tenant"}`,
        `New lease for ${data.property_address || "—"} — $${(data.monthly_rent||0).toLocaleString()}/mo. Requires supervisor approval.`
      );
    } catch { setExtractMsg("Connection error."); }
    setExtracting(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") handleFile(f);
  };

  const totalRent  = leases.reduce((a,l) => a + (l.monthly_rent||0), 0);
  const activeCount = leases.filter(l => {
    const apr = approvalFor(l.id);
    return !apr || apr.status === "Approved";
  }).length;
  const pendingCount = leases.filter(l => {
    const apr = approvalFor(l.id);
    return apr?.status === "Pending";
  }).length;
  const avgTI = leases.length ? leases.reduce((a,l) => a+(l.ti_allowance||0), 0)/leases.length : 0;

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", minHeight:"100%", background:"#0f1319" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#fff" strokeWidth="1.8"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.03em", margin:0 }}>Lease Abstraction</h1>
            <span style={{ fontSize:9, fontWeight:700, background:"rgba(167,139,250,0.15)", color:"#a78bfa", padding:"2px 7px", borderRadius:4, fontFamily:M, letterSpacing:"0.05em" }}>AI</span>
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Upload a lease PDF — AI extracts all commercial terms instantly. Every new lease requires supervisor approval.</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { load(); loadApprovals(); }} title="Refresh" style={{ width:36, height:36, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => { setShowModal(true); setExtractMsg(""); }} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, boxShadow:"0 0 20px rgba(167,139,250,0.3)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            Upload Lease
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Leases",   value:leases.length,                                  color:"#f0f4f8",  sub:"Abstracted" },
          { label:"Active",         value:activeCount,                                     color:"#22d3a0",  sub:"Approved leases" },
          { label:"Pending Review", value:pendingCount,                                    color:"#f59e0b",  sub:"Awaiting approval" },
          { label:"Portfolio Rent", value:`$${(totalRent/1000).toFixed(1)}K`,             color:"#a78bfa",  sub:"Monthly total" },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Lease list */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:48 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", border:"2px solid rgba(167,139,250,0.2)", borderTopColor:"#a78bfa", animation:"spin 0.7s linear infinite" }}/>
        </div>
      ) : leases.length === 0 ? (
        <div style={{ ...card, textAlign:"center", padding:56, color:"rgba(255,255,255,0.2)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📄</div>
          <div style={{ fontSize:14, marginBottom:6 }}>No leases abstracted yet</div>
          <div style={{ fontSize:12 }}>Click "Upload Lease" and drop a lease PDF — AI extracts all terms in seconds.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {leases.map(l => {
            const apr = approvalFor(l.id);
            const displayStatus = apr ? (apr.status === "Approved" ? "Active" : apr.status === "Pending" ? "Pending Approval" : "Rejected") : (l.status || "Active");
            const sc = APR_STYLE[displayStatus] || APR_STYLE.Active;
            const conf = CONF_STYLE[l.extraction_confidence] || CONF_STYLE.Medium;
            const isExp = expanded === l.id;
            const leaseYears = (() => {
              try {
                const s = new Date(l.lease_start); const e = new Date(l.lease_end);
                const y = ((e.getTime()-s.getTime())/(1000*60*60*24*365.25)).toFixed(1);
                return isNaN(Number(y)) ? "—" : `${y}yr`;
              } catch { return "—"; }
            })();

            return (
              <div key={l.id} style={{ ...card, padding:0, overflow:"hidden", animation:"fadeUp 0.2s ease", border:`1px solid ${apr?.status==="Pending" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                {/* Row */}
                <div style={{ display:"grid", gridTemplateColumns:"90px 1fr 160px 130px 110px 90px 160px 36px", gap:12, padding:"16px 20px", cursor:"pointer", alignItems:"center" }}
                  onClick={() => setExpanded(isExp ? null : l.id)}>

                  <div style={{ fontFamily:M, fontSize:11, color:"#a78bfa", fontWeight:600 }}>{l.id}</div>

                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{l.tenant_name?.replace("Not found — review document","⚠ Unknown") || "Unknown Tenant"}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.property_address || "—"}</div>
                  </div>

                  {/* Dates + term */}
                  <div>
                    <div style={{ fontSize:11, fontFamily:M, color:"rgba(255,255,255,0.5)" }}>{l.lease_start || "—"} → {l.lease_end || "—"}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{leaseYears} term</div>
                  </div>

                  {/* Rent */}
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:"#a78bfa" }}>${(l.monthly_rent||0).toLocaleString()}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:1 }}>per month</div>
                  </div>

                  {/* CAM */}
                  <div>
                    <div style={{ fontSize:11, color: l.cam_included ? "#22d3a0" : "rgba(255,255,255,0.4)" }}>{l.cam_included ? "CAM incl." : "CAM excl."}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:1 }}>{notFound(l.cam_cap) ? "No cap" : l.cam_cap}</div>
                  </div>

                  {/* TI */}
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color: (l.ti_allowance||0) > 0 ? "#38bfff" : "rgba(255,255,255,0.3)" }}>${(l.ti_allowance||0).toLocaleString()}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:1 }}>TI allowance</div>
                  </div>

                  {/* Status + confidence */}
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <span style={{ fontSize:10, fontFamily:M, padding:"3px 8px", borderRadius:5, background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`, whiteSpace:"nowrap" }}>{displayStatus}</span>
                    <span style={{ fontSize:9, fontFamily:M, padding:"2px 6px", borderRadius:4, background:conf.bg, color:conf.text, border:`1px solid ${conf.border}`, whiteSpace:"nowrap" }}>{conf.icon} {l.extraction_confidence||"Medium"} confidence</span>
                  </div>

                  <svg style={{ color:"rgba(255,255,255,0.2)", transform:isExp?"rotate(180deg)":"none", transition:"transform 200ms", justifySelf:"end" }} width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px", background:"rgba(255,255,255,0.01)", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>

                    {/* Financial terms */}
                    <div>
                      <div style={{ fontSize:10, fontFamily:M, color:"rgba(167,139,250,0.7)", letterSpacing:"0.08em", marginBottom:12 }}>FINANCIAL TERMS</div>
                      {([
                        ["Monthly Rent",      `$${(l.monthly_rent||0).toLocaleString()}`],
                        ["Security Deposit",  `$${(l.security_deposit||0).toLocaleString()}`],
                        ["TI Allowance",      `$${(l.ti_allowance||0).toLocaleString()}`],
                        ["Rent Escalation",   l.rent_escalation],
                        ["CAM Included",      l.cam_included ? "Yes" : "No"],
                        ["CAM Cap",           l.cam_cap],
                      ] as [string,any][]).map(([k,v]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:7, gap:8 }}>
                          <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", flexShrink:0 }}>{k}</span>
                          <span style={{ fontSize:12, fontFamily:M, color: notFound(v) ? "#f59e0b" : "#f0f4f8", textAlign:"right" }}>{String(v||"—")}</span>
                        </div>
                      ))}
                    </div>

                    {/* Lease terms */}
                    <div>
                      <div style={{ fontSize:10, fontFamily:M, color:"rgba(167,139,250,0.7)", letterSpacing:"0.08em", marginBottom:12 }}>LEASE TERMS</div>
                      {([
                        ["Lease Start",     l.lease_start],
                        ["Lease End",       l.lease_end],
                        ["Term Length",     leaseYears],
                        ["Renewal Options", l.renewal_options],
                        ["Permitted Use",   l.permitted_use],
                        ["Termination",     l.termination_clause],
                      ] as [string,any][]).map(([k,v]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:7, gap:8 }}>
                          <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", flexShrink:0 }}>{k}</span>
                          <span style={{ fontSize:12, color: notFound(v) ? "#f59e0b" : "#f0f4f8", textAlign:"right" }}>{String(v||"—")}</span>
                        </div>
                      ))}
                    </div>

                    {/* AI Summary + approval */}
                    <div>
                      <div style={{ fontSize:10, fontFamily:M, color:"rgba(34,211,160,0.7)", letterSpacing:"0.08em", marginBottom:12 }}>AI SUMMARY</div>

                      {/* Confidence badge */}
                      <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginBottom:10, padding:"3px 8px", borderRadius:5, fontFamily:M, fontSize:10, fontWeight:600, background:conf.bg, color:conf.text, border:`1px solid ${conf.border}` }}>
                        {conf.icon} {l.extraction_confidence||"Medium"} confidence
                      </div>
                      {(l.extraction_confidence === "Low" || l.extraction_confidence === "Medium") && (
                        <div style={{ fontSize:11, color:"#f59e0b", marginBottom:10, lineHeight:1.5 }}>
                          Fields shown in amber were not found in the document — verify manually.
                        </div>
                      )}

                      <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65, margin:"0 0 14px" }}>{l.ai_summary || "No summary available."}</p>

                      {/* Approval status */}
                      {apr && (
                        <div style={{ padding:"10px 12px", borderRadius:8, background: sc.bg, border:`1px solid ${sc.border}` }}>
                          <div style={{ fontSize:11, fontWeight:600, color:sc.text, marginBottom:4 }}>
                            {apr.status === "Pending" ? "Awaiting supervisor approval" : apr.status === "Approved" ? "Approved — lease is active" : "Rejected"}
                          </div>
                          {apr.review_notes && <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{apr.review_notes}</div>}
                          {apr.reviewed_by && <div style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.25)", marginTop:4 }}>Reviewed by {apr.reviewed_by}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
          onClick={() => !extracting && !parsing && setShowModal(false)}>
          <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:32, width:580, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#fff" strokeWidth="1.8"/></svg>
              </div>
              <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>Abstract Lease</h2>
            </div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", margin:"0 0 20px" }}>
              Upload a PDF — text is extracted and shown below. Review it, then click "AI Extract Terms".
            </p>

            {/* Step 1 — Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !parsing && !extracting && fileRef.current?.click()}
              style={{
                border:`2px dashed ${dragOver ? "rgba(167,139,250,0.7)" : fileName ? "rgba(34,211,160,0.4)" : "rgba(167,139,250,0.3)"}`,
                borderRadius:10, padding:"20px 24px", textAlign:"center",
                cursor: parsing || extracting ? "not-allowed" : "pointer",
                background: fileName ? "rgba(34,211,160,0.04)" : dragOver ? "rgba(167,139,250,0.05)" : "transparent",
                transition:"all 0.2s", marginBottom:14,
              }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display:"none" }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>

              {parsing ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(167,139,250,0.2)", borderTopColor:"#a78bfa", animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ color:"#a78bfa", fontSize:13 }}>Reading PDF…</span>
                </div>
              ) : fileName ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#22d3a0" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke="#22d3a0" strokeWidth="1.5"/></svg>
                  <span style={{ color:"#22d3a0", fontSize:13, fontWeight:600 }}>{fileName}</span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>— click to change</span>
                </div>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color:"rgba(167,139,250,0.5)", marginBottom:8 }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginBottom:3 }}>Drop lease PDF here or click to browse</div>
                  <div style={{ color:"rgba(255,255,255,0.2)", fontSize:11, fontFamily:M }}>Residential · Commercial · Office · Retail</div>
                </>
              )}
            </div>

            {/* Property address */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>PROPERTY ADDRESS (optional override)</label>
              <input value={propAddr} onChange={e => setPropAddr(e.target.value)} placeholder="e.g. Suite 400, 1200 Harbor Blvd" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" }}/>
            </div>

            {/* Step 2 — Extracted text preview */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em" }}>EXTRACTED TEXT — review before submitting</label>
                {rawText && <span style={{ fontSize:10, fontFamily:M, color:"rgba(255,255,255,0.2)" }}>{rawText.length.toLocaleString()} chars</span>}
              </div>
              <textarea
                rows={10}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={parsing ? "Extracting text from PDF…" : "Text will appear here after you upload a PDF. You can also paste lease text directly."}
                style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:`1px solid ${rawText ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius:8, padding:"10px 12px", color:"#f0f4f8", fontSize:12, fontFamily:M, outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }}
              />
            </div>

            {extractMsg && (
              <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:8, background: extractMsg.includes("Extracting") ? "rgba(167,139,250,0.08)" : "rgba(244,63,94,0.08)", border:`1px solid ${extractMsg.includes("Extracting") ? "rgba(167,139,250,0.2)" : "rgba(244,63,94,0.2)"}`, fontSize:12, color: extractMsg.includes("Extracting") ? "#a78bfa" : "#f43f5e", display:"flex", alignItems:"center", gap:8 }}>
                {extracting && <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(167,139,250,0.3)", borderTopColor:"#a78bfa", animation:"spin 0.7s linear infinite", flexShrink:0 }}/>}
                {extractMsg}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setShowModal(false); setRawText(""); setPropAddr(""); setFileName(""); setExtractMsg(""); }}
                style={{ flex:1, padding:11, borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", fontFamily:F }}>
                Cancel
              </button>
              <button onClick={abstractLease} disabled={extracting || !rawText.trim()}
                style={{ flex:2, padding:11, borderRadius:9, border:"none", background: rawText.trim() ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "rgba(255,255,255,0.06)", color: rawText.trim() ? "#fff" : "rgba(255,255,255,0.2)", fontSize:13, fontWeight:600, cursor: rawText.trim() && !extracting ? "pointer" : "not-allowed", fontFamily:F }}>
                {extracting ? "Extracting…" : "AI Extract Terms"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
