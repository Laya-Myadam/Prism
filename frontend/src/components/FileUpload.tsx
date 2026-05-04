import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface UploadedFile {
  file: File;
  id: string;
}

interface Props {
  onUploadComplete: (classified: any[]) => void;
  sessionId: string;
  loading: boolean;
  setLoading: (b: boolean) => void;
  setError: (e: string) => void;
}

export default function FileUpload({ onUploadComplete, sessionId, loading, setLoading, setError }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(f => f.type === "application/pdf");
    if (!pdfs.length) { setError("Only PDF files are supported."); return; }
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))]);
    setError("");
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleUpload = async () => {
    if (!files.length) { setError("Add at least one PDF."); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("session_id", sessionId);
      files.forEach(f => fd.append("files", f.file));
      const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${base}/construction/upload-classify`, { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Classification failed."); }
      const data = await res.json();
      onUploadComplete(data.classified);
    } catch (e: any) {
      setError(e.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const S = {
    zone: {
      border: `2px dashed ${dragging ? "rgba(0,168,240,0.6)" : "rgba(255,255,255,0.12)"}`,
      borderRadius: 12, padding: "40px 24px",
      background: dragging ? "rgba(0,168,240,0.06)" : "rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column" as const, alignItems: "center",
      justifyContent: "center", cursor: "pointer", transition: "all 0.2s",
      textAlign: "center" as const,
    },
  };

  return (
    <div>
      <div
        style={S.zone}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      >
        <div style={{ width:52, height:52, borderRadius:12, background:"rgba(0,168,240,0.1)", border:"1px solid rgba(0,168,240,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, color:"#00a8f0" }}>
          <Upload size={22}/>
        </div>
        <div style={{ fontSize:15, fontWeight:600, color:"#f0f4f8", marginBottom:6 }}>Drop all project PDFs here</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>Contracts · Drawings · Specs · RFIs · Daily Reports</div>
        <input ref={inputRef} type="file" accept=".pdf" multiple style={{ display:"none" }} onChange={e => addFiles(e.target.files)}/>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:6 }}>
          {files.map(f => (
            <div key={f.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8 }}>
              <FileText size={14} color="#00a8f0"/>
              <span style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.7)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.file.name}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>{(f.file.size/1024/1024).toFixed(1)} MB</span>
              <button onClick={e => { e.stopPropagation(); removeFile(f.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", padding:2, display:"flex" }}>
                <X size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button onClick={handleUpload} disabled={loading} style={{ marginTop:16, width:"100%", padding:"11px", borderRadius:9, border:"none", background:loading?"rgba(0,168,240,0.4)":"linear-gradient(135deg,#00a8f0,#0072b8)", color:"#fff", fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:loading?"none":"0 0 20px rgba(0,168,240,0.25)", transition:"all 0.2s" }}>
          {loading ? <><Loader2 size={15} style={{ animation:"spin 0.7s linear infinite" }}/> Classifying {files.length} document{files.length>1?"s":""}...</> : <>Classify {files.length} Document{files.length>1?"s":""}</>}
        </button>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}