import { useState } from "react";
import { FileText, ChevronDown, CheckCircle, Loader2, Edit2 } from "lucide-react";

const DOC_TYPES = ["Contract","Drawings","Specifications","RFI","Daily Reports","Change Order","Submittal","General"];

const typeColors: Record<string, string> = {
  Contract: "#00a8f0", Drawings: "#a78bfa", Specifications: "#f59e0b",
  RFI: "#38bfff", "Daily Reports": "#22d3a0", "Change Order": "#f97316",
  Submittal: "#ec4899", General: "rgba(255,255,255,0.4)",
};

interface ClassifiedDoc {
  filename: string;
  path: string;
  doc_type: string;
  confidence: number;
  summary?: string;
}

interface Props {
  classified: ClassifiedDoc[];
  onBuild: (docs: ClassifiedDoc[]) => void;
  loading: boolean;
  setError: (e: string) => void;
}

export default function DocClassifier({ classified, onBuild, loading, setError }: Props) {
  const [docs, setDocs] = useState<ClassifiedDoc[]>(classified);
  const [editing, setEditing] = useState<number | null>(null);

  const changeType = (i: number, type: string) => {
    setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, doc_type: type } : d));
    setEditing(null);
  };

  const grouped = docs.reduce((acc, d) => {
    acc[d.doc_type] = (acc[d.doc_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Summary chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
        {Object.entries(grouped).map(([type, count]) => (
          <span key={type} style={{ padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", background:`${typeColors[type]}18`, color:typeColors[type]||"#f0f4f8", border:`1px solid ${typeColors[type]}35` }}>
            {count}× {type}
          </span>
        ))}
      </div>

      {/* Doc list */}
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
        {docs.map((doc, i) => (
          <div key={i} style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <FileText size={14} color={typeColors[doc.doc_type]||"#f0f4f8"} style={{ flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.filename}</div>
              {doc.summary && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.summary}</div>}
            </div>
            {/* Confidence */}
            {doc.confidence != null && (
              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.3)", flexShrink:0 }}>{Math.round(doc.confidence * 100)}%</span>
            )}
            {/* Type selector */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <button onClick={() => setEditing(editing === i ? null : i)} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, border:`1px solid ${typeColors[doc.doc_type]||"rgba(255,255,255,0.15)"}40`, background:`${typeColors[doc.doc_type]||"rgba(255,255,255,0.1)"}15`, color:typeColors[doc.doc_type]||"rgba(255,255,255,0.6)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace" }}>
                {doc.doc_type} <ChevronDown size={10}/>
              </button>
              {editing === i && (
                <div style={{ position:"absolute", right:0, top:"110%", background:"#212d3d", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, zIndex:10, minWidth:160, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", overflow:"hidden" }}>
                  {DOC_TYPES.map(t => (
                    <button key={t} onClick={() => changeType(i, t)} style={{ display:"block", width:"100%", padding:"8px 14px", textAlign:"left", background:doc.doc_type===t?"rgba(0,168,240,0.1)":"transparent", color:typeColors[t]||"rgba(255,255,255,0.6)", fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"background 0.15s" }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Build btn */}
      <button onClick={() => onBuild(docs)} disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:9, border:"none", background:loading?"rgba(0,168,240,0.4)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:loading?"none":"0 0 20px rgba(0,168,240,0.25)", transition:"all 0.2s" }}>
        {loading ? <><Loader2 size={15} style={{ animation:"spin 0.7s linear infinite" }}/> Building Project Index...</> : <><CheckCircle size={15}/> Build Project — {docs.length} Documents</>}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}