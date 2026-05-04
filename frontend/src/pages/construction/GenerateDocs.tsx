import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../../App";
import { FileText, Loader2, AlertCircle, Download, Trash2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { generateDocument } from "../../api/client";
import type { GeneratedDoc } from "../../api/client";

interface Props { appState: AppState; }

const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";
const card = { background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 } as React.CSSProperties;

const DOC_TYPES = [
  { id:"RFI Response",            emoji:"❓", title:"RFI Response",            desc:"Formal response to a Request for Information with document citations",          accent:"#38bfff", accentBg:"rgba(56,191,255,0.08)",  accentBorder:"rgba(56,191,255,0.25)"  },
  { id:"Delay Notice Letter",     emoji:"⏱", title:"Delay Notice Letter",      desc:"Formal delay notice with contract clause references and time claim",            accent:"#f59e0b", accentBg:"rgba(245,158,11,0.08)", accentBorder:"rgba(245,158,11,0.25)"  },
  { id:"Change Order Assessment", emoji:"🔄", title:"Change Order Assessment",  desc:"Assess scope, cost reasonableness, and schedule impact of a change order",     accent:"#f43f5e", accentBg:"rgba(244,63,94,0.08)",  accentBorder:"rgba(244,63,94,0.25)"   },
  { id:"Weekly Progress Summary", emoji:"📅", title:"Weekly Progress Summary",  desc:"Structured weekly report pulled from your uploaded daily reports",             accent:"#22d3a0", accentBg:"rgba(34,211,160,0.08)", accentBorder:"rgba(34,211,160,0.25)"  },
];

const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F, outline:"none", boxSizing:"border-box" };
const lbl: React.CSSProperties = { display:"block", fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 };

export default function GenerateDocs({ appState }: Props) {
  const { sessionId, projectBuilt } = appState;
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string|null>(null);
  const [formData, setFormData] = useState<Record<string,string>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [expanded, setExpanded] = useState<Record<number,boolean>>({});

  const upd = (k: string, v: string) => setFormData(p => ({ ...p, [k]:v }));

  const handleGenerate = async () => {
    if (!selectedType) { setError("Select a document type first."); return; }
    setError(null); setGenerating(true);
    try {
      const res = await generateDocument(sessionId, selectedType, formData);
      setGeneratedDocs(p => [{ type:res.type, content:res.document, form_data:formData }, ...p]);
      setExpanded({ 0:true });
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Generation failed.");
    } finally { setGenerating(false); }
  };

  const downloadDoc = (doc: GeneratedDoc, i: number) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([doc.content], { type:"text/plain" }));
    a.download = `${doc.type.replace(/ /g,"_").toLowerCase()}_${i+1}.txt`;
    a.click();
  };

  const sel = DOC_TYPES.find(d => d.id === selectedType);

  if (!projectBuilt) return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8" }}>
      <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Generate Documents</h1>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:32 }}>AI generates complete formatted construction documents ready to send.</p>
      <div style={{ ...card, padding:40, textAlign:"center", maxWidth:480, margin:"0 auto" }}>
        <div style={{ fontSize:40, marginBottom:14 }}>📝</div>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>No project built yet</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:24 }}>Upload your project documents first so AI can generate accurate, document-backed outputs.</div>
        <button onClick={()=>navigate("/documents")} style={{ padding:"10px 24px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F }}>
          Go to Documents →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"28px 32px", fontFamily:F, color:"#f0f4f8", maxWidth:900 }}>
      <style>{`input:focus,textarea:focus,select:focus{border-color:rgba(0,168,240,0.5)!important}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}select option{background:#1c2535;color:#f0f4f8}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.025em", marginBottom:4 }}>Generate Documents</h1>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:24 }}>Select a document type, fill in the details, get a complete formatted document ready to send.</p>

      {/* Type selector */}
      <div style={{ ...card, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>Select Document Type</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {DOC_TYPES.map(type => {
            const active = selectedType === type.id;
            return (
              <button key={type.id} onClick={()=>{ setSelectedType(type.id); setFormData({}); setError(null); }}
                style={{ textAlign:"left", padding:16, borderRadius:10, border:`1.5px solid ${active?type.accentBorder:"rgba(255,255,255,0.07)"}`, background:active?type.accentBg:"rgba(255,255,255,0.02)", cursor:"pointer", fontFamily:F, transition:"all 0.15s" }}
                onMouseEnter={e=>{ if(!active){ (e.currentTarget as HTMLButtonElement).style.borderColor=type.accentBorder; (e.currentTarget as HTMLButtonElement).style.background=type.accentBg; }}}
                onMouseLeave={e=>{ if(!active){ (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.02)"; }}}>
                <div style={{ fontSize:22, marginBottom:10 }}>{type.emoji}</div>
                <div style={{ fontSize:13, fontWeight:600, color:active?type.accent:"#f0f4f8", marginBottom:4 }}>{type.title}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>{type.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      {selectedType && sel && (
        <div style={{ ...card, padding:20, marginBottom:16, animation:"fadeIn 0.2s ease", borderColor:sel.accentBorder }}>
          <div style={{ fontSize:10, fontWeight:600, fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:16, color:sel.accent }}>{selectedType} — Details</div>

          {selectedType==="RFI Response" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={lbl}>RFI Number</label><input style={inp} placeholder="e.g. RFI-008" value={formData.rfi_number||""} onChange={e=>upd("rfi_number",e.target.value)}/></div>
                <div><label style={lbl}>Submitted By</label><input style={inp} placeholder="e.g. Pacific Coast Builders" value={formData.submitted_by||""} onChange={e=>upd("submitted_by",e.target.value)}/></div>
                <div><label style={lbl}>Drawing Reference</label><input style={inp} placeholder="e.g. S-301" value={formData.drawing_ref||""} onChange={e=>upd("drawing_ref",e.target.value)}/></div>
                <div><label style={lbl}>Spec Section</label><input style={inp} placeholder="e.g. 03 30 00" value={formData.spec_ref||""} onChange={e=>upd("spec_ref",e.target.value)}/></div>
              </div>
              <div><label style={lbl}>Subject *</label><input style={inp} placeholder="e.g. Concrete compressive strength conflict" value={formData.subject||""} onChange={e=>upd("subject",e.target.value)}/></div>
              <div><label style={lbl}>Question *</label><textarea style={{ ...inp, resize:"none" }} rows={4} placeholder="State the full RFI question in detail..." value={formData.question||""} onChange={e=>upd("question",e.target.value)}/></div>
            </div>
          )}

          {selectedType==="Delay Notice Letter" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={lbl}>Delay Event *</label><input style={inp} placeholder="e.g. Architect failed to respond to RFI-003" value={formData.delay_event||""} onChange={e=>upd("delay_event",e.target.value)}/></div>
                <div><label style={lbl}>Date Delay Began *</label><input style={inp} placeholder="e.g. February 22, 2024" value={formData.delay_date||""} onChange={e=>upd("delay_date",e.target.value)}/></div>
                <div>
                  <label style={lbl}>Cause of Delay *</label>
                  <select style={{ ...inp, cursor:"pointer" }} value={formData.delay_cause||""} onChange={e=>upd("delay_cause",e.target.value)}>
                    <option value="">Select cause...</option>
                    {["Owner-caused","Force Majeure","Differing Site Condition","Weather","Design Error","Other"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Days Claimed</label><input style={inp} placeholder="e.g. 18 days" value={formData.days_claimed||""} onChange={e=>upd("days_claimed",e.target.value)}/></div>
              </div>
              <div><label style={lbl}>Impact Description *</label><textarea style={{ ...inp, resize:"none" }} rows={4} placeholder="Describe the schedule impact and critical path activities affected..." value={formData.delay_impact||""} onChange={e=>upd("delay_impact",e.target.value)}/></div>
            </div>
          )}

          {selectedType==="Change Order Assessment" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={lbl}>CO Number</label><input style={inp} placeholder="e.g. COR-005" value={formData.co_number||""} onChange={e=>upd("co_number",e.target.value)}/></div>
                <div><label style={lbl}>Claimed Cost *</label><input style={inp} placeholder="e.g. $47,800" value={formData.claimed_cost||""} onChange={e=>upd("claimed_cost",e.target.value)}/></div>
                <div><label style={lbl}>Claimed Days</label><input style={inp} placeholder="e.g. 5 days" value={formData.claimed_days||""} onChange={e=>upd("claimed_days",e.target.value)}/></div>
                <div><label style={lbl}>Reason Given *</label><input style={inp} placeholder="e.g. Steel fabrication delay" value={formData.co_reason||""} onChange={e=>upd("co_reason",e.target.value)}/></div>
              </div>
              <div><label style={lbl}>Description of Work *</label><textarea style={{ ...inp, resize:"none" }} rows={4} placeholder="Describe exactly what work is being claimed..." value={formData.co_description||""} onChange={e=>upd("co_description",e.target.value)}/></div>
            </div>
          )}

          {selectedType==="Weekly Progress Summary" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={lbl}>Week Ending Date</label><input style={{ ...inp, maxWidth:220 }} type="date" value={formData.week_ending||new Date().toISOString().split("T")[0]} onChange={e=>upd("week_ending",e.target.value)}/></div>
              <div style={{ display:"flex", gap:10, padding:"12px 16px", borderRadius:9, background:"rgba(34,211,160,0.07)", border:"1px solid rgba(34,211,160,0.15)" }}>
                <FileText size={14} color="#22d3a0" style={{ flexShrink:0, marginTop:1 }}/>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>AI will automatically pull work completed, open items, safety incidents, and weather delays from your uploaded daily reports.</span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:9, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e", fontSize:13, marginTop:14 }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/>{error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating}
            style={{ marginTop:16, width:"100%", padding:12, borderRadius:9, border:"none", background:generating?"rgba(0,168,240,0.35)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:14, fontWeight:600, cursor:generating?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:generating?"none":"0 0 20px rgba(0,168,240,0.2)", transition:"all 0.2s" }}>
            {generating
              ? <><Loader2 size={15} style={{ animation:"spin 0.7s linear infinite" }}/> Generating {selectedType}...</>
              : <><FileText size={15}/> Generate {selectedType}</>
            }
          </button>
        </div>
      )}

      {/* Generated docs */}
      {generatedDocs.length > 0 && (
        <div style={{ animation:"fadeIn 0.2s ease" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:M, letterSpacing:"0.1em", textTransform:"uppercase" }}>Generated Documents</div>
            <button onClick={()=>setGeneratedDocs([])} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)", fontSize:11, cursor:"pointer", fontFamily:F }}>
              <Trash2 size={11}/> Clear all
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {generatedDocs.map((doc,i)=>(
              <div key={i} style={{ ...card, overflow:"hidden" }}>
                <button onClick={()=>setExpanded(p=>({ ...p, [i]:!p[i] }))}
                  style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", background:"transparent", border:"none", cursor:"pointer", fontFamily:F }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.03)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <CheckCircle size={14} color="#22d3a0"/>
                    <span style={{ fontSize:13, fontWeight:600, color:"#f0f4f8" }}>{doc.type}</span>
                    <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(34,211,160,0.1)", color:"#22d3a0", border:"1px solid rgba(34,211,160,0.2)", fontFamily:M }}>READY</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={e=>{ e.stopPropagation(); downloadDoc(doc,i); }}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:6, background:"rgba(0,168,240,0.1)", border:"1px solid rgba(0,168,240,0.2)", color:"#38bfff", fontSize:11, cursor:"pointer", fontFamily:F }}>
                      <Download size={11}/> Download
                    </button>
                    {expanded[i] ? <ChevronUp size={14} color="rgba(255,255,255,0.3)"/> : <ChevronDown size={14} color="rgba(255,255,255,0.3)"/>}
                  </div>
                </button>
                {expanded[i] && (
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", animation:"fadeIn 0.15s ease" }}>
                    <textarea readOnly value={doc.content} rows={18}
                      style={{ width:"100%", padding:"16px 18px", background:"rgba(0,0,0,0.2)", border:"none", color:"rgba(255,255,255,0.7)", fontSize:12, fontFamily:M, lineHeight:1.7, resize:"none", outline:"none", boxSizing:"border-box" }}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}