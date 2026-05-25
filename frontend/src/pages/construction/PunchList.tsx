import { useState, useEffect, useRef } from "react";
import type { AppState } from "../../App";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

type PunchItem = {
  id: string;
  number: string;
  location: string;
  description: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  assignee: string;
  trade: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  due_date: string;
  created_at: string;
  ai_notes?: string;
  inspection_ready?: boolean;
  ball_in_court?: "Contractor" | "Owner" | "Architect" | "Inspector";
};

const PRIORITY_COLOR: Record<string, string> = {
  Critical: "#f43f5e",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22d3a0",
};

const STATUS_COLOR: Record<string, string> = {
  Open: "#f43f5e",
  "In Progress": "#00a8f0",
  Resolved: "#22d3a0",
  Closed: "rgba(255,255,255,0.3)",
};


const CATEGORIES = ["All", "Safety", "Quality", "Incomplete Work", "Damage Risk", "Spec Non-Conformance", "Cosmetic"];
const STATUSES = ["All", "Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["All", "Critical", "High", "Medium", "Low"];
const BIC_OPTIONS = ["Contractor", "Owner", "Architect", "Inspector"] as const;

const TURNOVER_CHECKLIST = [
  "Clean all surfaces and appliances","Check all light fixtures","Test smoke/CO detectors",
  "Inspect HVAC filters","Check plumbing for leaks","Test all electrical outlets",
  "Inspect windows and locks","Paint touch-up where needed","Replace worn carpet/flooring",
  "Clean bathrooms thoroughly","Check exterior doors/hardware","Final walk-through with photos",
];

function UnitTurnover({ appState, onBack }: { appState: AppState; onBack: () => void }) {
  const [unit, setUnit] = useState("");
  const [checked, setChecked] = useState<Record<string,boolean>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedUnits, setSavedUnits] = useState<{unit:string; completed:boolean; updated_at:string}[]>([]);
  const F2 = "'Outfit',sans-serif";
  const M2 = "'JetBrains Mono',monospace";
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / TURNOVER_CHECKLIST.length) * 100);

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/pm/turnover/${appState.sessionId}`)
      .then(r => r.json())
      .then((rows: {unit:string; completed:boolean; updated_at:string}[]) => {
        if (Array.isArray(rows)) setSavedUnits(rows);
      })
      .catch(() => {});
  }, [appState.sessionId]);

  useEffect(() => {
    if (!unit || !appState.sessionId) return;
    fetch(`${BASE}/pm/turnover/${appState.sessionId}/${encodeURIComponent(unit)}`)
      .then(r => r.json())
      .then((data: {checked_items?: string[]; notes?: string}) => {
        if (data && Array.isArray(data.checked_items)) {
          const map: Record<string,boolean> = {};
          data.checked_items.forEach((item: string) => { map[item] = true; });
          setChecked(map);
          setNotes(data.notes || "");
        }
      })
      .catch(() => {});
  }, [unit, appState.sessionId]);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function persistSave(nextChecked: Record<string,boolean>, nextNotes: string) {
    if (!appState.sessionId || !unit) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      setSaving(true);
      const checkedItems = Object.entries(nextChecked).filter(([,v]) => v).map(([k]) => k);
      const isComplete = checkedItems.length === TURNOVER_CHECKLIST.length;
      try {
        await fetch(`${BASE}/pm/turnover/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: appState.sessionId,
            unit,
            checked_items: checkedItems,
            notes: nextNotes,
            completed: isComplete,
          }),
        });
        setSavedUnits(prev => {
          const existing = prev.find(r => r.unit === unit);
          const updated = { unit, completed: isComplete, updated_at: new Date().toISOString() };
          return existing ? prev.map(r => r.unit === unit ? updated : r) : [...prev, updated];
        });
      } catch {}
      setSaving(false);
    }, 800);
  }

  function toggleItem(item: string, val: boolean) {
    const next = { ...checked, [item]: val };
    setChecked(next);
    persistSave(next, notes);
  }

  function updateNotes(val: string) {
    setNotes(val);
    persistSave(checked, val);
  }

  return (
    <div style={{ padding:"0 28px 28px", fontFamily:F2, color:"#f0f4f8" }}>
      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:4, marginBottom:24, width:"fit-content" }}>
        <button onClick={onBack} style={{ padding:"7px 18px", borderRadius:7, border:"none", background:"transparent", color:"rgba(255,255,255,0.38)", fontSize:13, cursor:"pointer", fontFamily:F2 }}>Construction Punch</button>
        <button style={{ padding:"7px 18px", borderRadius:7, border:"none", background:"rgba(0,168,240,0.15)", color:"#38bfff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F2 }}>Unit Turnover Checklist</button>
      </div>

      {/* Saved units strip */}
      {savedUnits.length > 0 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {savedUnits.map(r => (
            <button key={r.unit} onClick={() => setUnit(r.unit)}
              style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${r.unit===unit?"rgba(0,168,240,0.4)":r.completed?"rgba(34,211,160,0.3)":"rgba(255,255,255,0.1)"}`, background:r.unit===unit?"rgba(0,168,240,0.12)":r.completed?"rgba(34,211,160,0.06)":"rgba(255,255,255,0.03)", color:r.unit===unit?"#38bfff":r.completed?"#22d3a0":"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer", fontFamily:F2 }}>
              {r.completed ? "✓ " : ""}{r.unit}
            </button>
          ))}
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", alignSelf:"center", fontFamily:M2 }}>click to load saved unit</span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Unit Turnover Checklist</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:M2 }}>{done}/{TURNOVER_CHECKLIST.length} items complete</div>
                {saving && <div style={{ width:10, height:10, border:"2px solid rgba(56,191,255,0.2)", borderTopColor:"#38bfff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>}
                {!saving && unit && <span style={{ fontSize:10, color:"rgba(34,211,160,0.5)", fontFamily:M2 }}>saved</span>}
              </div>
            </div>
            <input value={unit} onChange={e => { setUnit(e.target.value); setChecked({}); setNotes(""); }} placeholder="Unit # (e.g. 4B)" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"7px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F2, outline:"none", width:120 }}/>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:2, marginBottom:16 }}>
            <div style={{ height:"100%", borderRadius:2, background:pct===100?"#22d3a0":pct>50?"#f59e0b":"#38bfff", width:`${pct}%`, transition:"width 0.3s" }}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {TURNOVER_CHECKLIST.map((item, i) => (
              <label key={i} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"8px 10px", borderRadius:7, background:checked[item]?"rgba(34,211,160,0.05)":"transparent", border:checked[item]?"1px solid rgba(34,211,160,0.15)":"1px solid transparent" }}>
                <input type="checkbox" checked={!!checked[item]} onChange={e => toggleItem(item, e.target.checked)} style={{ width:15, height:15, accentColor:"#22d3a0", cursor:"pointer" }}/>
                <span style={{ fontSize:13, color:checked[item]?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.8)", textDecoration:checked[item]?"line-through":"none" }}>{item}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ background:"#1c2535", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Turnover Summary</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[{l:"Unit",v:unit||"—"},{l:"Progress",v:`${pct}%`},{l:"Complete",v:String(done)},{l:"Remaining",v:String(TURNOVER_CHECKLIST.length-done)}].map(s => (
              <div key={s.l} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, fontFamily:M2, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:4 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize:16, fontWeight:700, color:s.l==="Progress"?(pct===100?"#22d3a0":"#38bfff"):"#f0f4f8" }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:M2, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:6 }}>NOTES</div>
            <textarea rows={4} value={notes} onChange={e => updateNotes(e.target.value)} placeholder="Additional notes for this turnover..." style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", color:"#f0f4f8", fontSize:13, fontFamily:F2, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
          </div>
          {savedUnits.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontFamily:M2, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", marginBottom:8 }}>ALL UNITS ({savedUnits.length})</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {savedUnits.map(r => (
                  <div key={r.unit} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", borderRadius:6, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:M2 }}>Unit {r.unit}</span>
                    <span style={{ fontSize:11, color:r.completed?"#22d3a0":"#f59e0b" }}>{r.completed?"Complete":"In Progress"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pct === 100 && (
            <div style={{ background:"rgba(34,211,160,0.08)", border:"1px solid rgba(34,211,160,0.2)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#22d3a0" }}>
              ✓ Unit {unit||""} turnover complete — ready for new tenant move-in
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PunchList({ appState }: { appState: AppState }) {
  const [tab, setTab] = useState("construction");
  const [items, setItems] = useState<PunchItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ location: "", description: "", assignee: "", trade: "", priority: "Medium", due_date: "" });

  // Per-item photo map: { [itemId]: { url, analysis? }[] }
  const [punchPhotos, setPunchPhotos] = useState<Record<string, {url: string; file: File; analysis?: any}[]>>({});
  const [photoLoading, setPhotoLoading] = useState<string | null>(null);
  const punchPhotoInputRef = useRef<HTMLInputElement>(null);
  const [photoTargetId, setPhotoTargetId] = useState<string>("");

  async function addPunchPhoto(itemId: string, file: File) {
    const url = URL.createObjectURL(file);
    setPunchPhotos(prev => ({ ...prev, [itemId]: [...(prev[itemId] || []), { url, file }] }));
    setPhotoLoading(itemId);
    try {
      const fd = new FormData();
      fd.append("session_id", appState.sessionId || "");
      fd.append("file", file);
      fd.append("context", "punch");
      const r = await fetch(`${BASE}/media/analyze-photo`, { method: "POST", body: fd });
      if (r.ok) {
        const analysis = await r.json();
        setPunchPhotos(prev => ({
          ...prev,
          [itemId]: (prev[itemId] || []).map(p => p.url === url ? { ...p, analysis } : p),
        }));
        if (analysis.ai_notes) {
          setItems(prev => prev.map(it => it.id === itemId ? {
            ...it, ai_notes: (it.ai_notes ? it.ai_notes + "\n" : "") + "📷 " + analysis.ai_notes,
          } : it));
        }
      }
    } catch {}
    setPhotoLoading(null);
  }

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/construction/punch/${appState.sessionId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setItems(d); })
      .catch(() => {});
  }, [appState.sessionId]);

  const filtered = items.filter(it => {
    if (filterStatus !== "All" && it.status !== filterStatus) return false;
    if (filterPriority !== "All" && it.priority !== filterPriority) return false;
    if (filterCategory !== "All" && it.category !== filterCategory) return false;
    if (search && !it.description.toLowerCase().includes(search.toLowerCase()) &&
        !it.location.toLowerCase().includes(search.toLowerCase()) &&
        !it.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    open: items.filter(i => i.status === "Open").length,
    inProgress: items.filter(i => i.status === "In Progress").length,
    resolved: items.filter(i => i.status === "Resolved").length,
    critical: items.filter(i => i.priority === "Critical").length,
  };

  async function aiCategorizeAll() {
    const openItems = items.filter(i => i.status === "Open" || i.status === "In Progress");
    if (openItems.length === 0) return;
    setAiLoading("bulk");
    try {
      const r = await fetch(`${BASE}/construction/punch/ai-categorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, items: openItems }),
      });
      const data = await r.json();
      if (Array.isArray(data.categorized)) {
        setItems(prev => prev.map(it => {
          const updated = data.categorized.find((c: PunchItem) => c.id === it.id);
          return updated ? { ...it, ...updated } : it;
        }));
      }
    } catch {}
    setAiLoading(null);
  }

  async function updateStatus(id: string, status: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status: status as PunchItem["status"] } : it));
    try {
      await fetch(`${BASE}/construction/punch/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, punch_id: id, status }),
      });
    } catch {}
  }

  async function updateBIC(id: string, bic: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ball_in_court: bic as PunchItem["ball_in_court"] } : it));
    try {
      await fetch(`${BASE}/construction/punch/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, punch_id: id, ball_in_court: bic }),
      });
    } catch {}
  }

  async function createItem() {
    if (!form.location || !form.description) return;
    setAiLoading("create");
    const newItem: PunchItem = {
      id: `p${Date.now()}`,
      number: `PL-${String(items.length + 1).padStart(3, "0")}`,
      location: form.location,
      description: form.description,
      category: "Uncategorized",
      priority: form.priority as PunchItem["priority"],
      assignee: form.assignee,
      trade: form.trade,
      status: "Open",
      due_date: form.due_date,
      created_at: new Date().toISOString().split("T")[0],
      ball_in_court: "Contractor",
    };
    try {
      const r = await fetch(`${BASE}/construction/punch/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, ...form }),
      });
      const data = await r.json();
      setItems(prev => [data.item || newItem, ...prev]);
    } catch {
      setItems(prev => [newItem, ...prev]);
    }
    setForm({ location: "", description: "", assignee: "", trade: "", priority: "Medium", due_date: "" });
    setShowModal(false);
    setAiLoading(null);
  }

  function daysUntil(date: string) {
    const d = new Date(date).getTime() - Date.now();
    return Math.ceil(d / 86400000);
  }

  const TabPL = () => (
    <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:4, marginBottom:24, width:"fit-content" }}>
      {[{id:"construction",label:"Construction Punch"},{id:"pm",label:"Unit Turnover Checklist"}].map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"7px 18px", borderRadius:7, border:"none", background:tab===t.id?"rgba(0,168,240,0.15)":"transparent", color:tab===t.id?"#38bfff":"rgba(255,255,255,0.38)", fontSize:13, fontWeight:tab===t.id?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 150ms" }}>
          {t.label}
        </button>
      ))}
    </div>
  );

  if (tab === "pm") return <UnitTurnover appState={appState} onBack={() => setTab("construction")} />;

  return (
    <div style={{ padding: 28, maxWidth: 1300, margin: "0 auto" }}>
      <TabPL />
      {/* ── Stats header ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Items", value: stats.total, color: "#38bfff" },
          { label: "Open", value: stats.open, color: "#f43f5e" },
          { label: "In Progress", value: stats.inProgress, color: "#00a8f0" },
          { label: "Resolved", value: stats.resolved, color: "#22d3a0" },
          { label: "Critical", value: stats.critical, color: "#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#151b24",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "16px 20px",
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", marginBottom: 8 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ color: s.color, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by location, description, number..."
          style={{
            flex: 1, minWidth: 200, padding: "9px 14px",
            background: "#151b24", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none",
          }}
        />
        {[
          { label: "Status", value: filterStatus, set: setFilterStatus, opts: STATUSES },
          { label: "Priority", value: filterPriority, set: setFilterPriority, opts: PRIORITIES },
          { label: "Category", value: filterCategory, set: setFilterCategory, opts: CATEGORIES },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
            style={{
              padding: "9px 12px", background: "#151b24",
              border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8,
              color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer",
            }}>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={aiCategorizeAll} disabled={aiLoading === "bulk"}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 8,
            background: aiLoading === "bulk" ? "rgba(0,168,240,0.08)" : "rgba(0,168,240,0.12)",
            border: "1px solid rgba(0,168,240,0.2)",
            color: "#38bfff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.02em",
          }}>
          {aiLoading === "bulk" ? (
            <span style={{ width: 12, height: 12, border: "2px solid rgba(56,191,255,0.3)", borderTopColor: "#38bfff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          AI Categorize All
        </button>
        <button onClick={() => setShowModal(true)}
          style={{
            padding: "9px 18px", borderRadius: 8,
            background: "linear-gradient(135deg, #00a8f0, #0054a0)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", letterSpacing: "-0.01em",
          }}>
          + Add Item
        </button>
      </div>

      {/* ── Items list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
            No punch items match your filters
          </div>
        )}
        {filtered.map(item => {
          const isExpanded = expanded === item.id;
          const days = item.due_date ? daysUntil(item.due_date) : null;
          const overdue = days !== null && days < 0;
          return (
            <div key={item.id} style={{
              background: "#151b24",
              border: `1px solid ${isExpanded ? "rgba(0,168,240,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderLeft: `3px solid ${PRIORITY_COLOR[item.priority]}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color 200ms ease",
            }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 16 }}
              >
                {/* Number + location */}
                <div style={{ minWidth: 100 }}>
                  <div style={{ color: "#38bfff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{item.number}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>{item.location}</div>
                </div>

                {/* Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: "#f0f4f8", fontSize: 13, fontWeight: 500, lineHeight: 1.5,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap",
                  }}>
                    {item.description}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)", fontSize: 11,
                    }}>
                      {item.category}
                    </span>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.4)", fontSize: 11,
                    }}>
                      {item.trade}
                    </span>
                  </div>
                </div>

                {/* Right: priority, status, BIC, due date */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                      background: `${PRIORITY_COLOR[item.priority]}1a`,
                      color: PRIORITY_COLOR[item.priority],
                      border: `1px solid ${PRIORITY_COLOR[item.priority]}33`,
                    }}>
                      {item.priority}
                    </span>
                    <span style={{
                      padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: `${STATUS_COLOR[item.status]}18`,
                      color: STATUS_COLOR[item.status],
                      border: `1px solid ${STATUS_COLOR[item.status]}30`,
                    }}>
                      {item.status}
                    </span>
                  </div>
                  {item.ball_in_court && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00a8f0" }} />
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>BIC: <span style={{ color: "#38bfff" }}>{item.ball_in_court}</span></span>
                    </div>
                  )}
                  {days !== null && (
                    <span style={{
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      color: overdue ? "#f43f5e" : days <= 3 ? "#f97316" : "rgba(255,255,255,0.3)",
                    }}>
                      {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>ASSIGNEE</div>
                      <div style={{ color: "#f0f4f8", fontSize: 13 }}>{item.assignee || "Unassigned"}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>DUE DATE</div>
                      <div style={{ color: "#f0f4f8", fontSize: 13 }}>{item.due_date || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>CREATED</div>
                      <div style={{ color: "#f0f4f8", fontSize: 13 }}>{item.created_at}</div>
                    </div>
                  </div>

                  {item.ai_notes && (
                    <div style={{
                      padding: "12px 14px",
                      background: "rgba(0,168,240,0.06)",
                      border: "1px solid rgba(0,168,240,0.15)",
                      borderRadius: 8, marginBottom: 14,
                    }}>
                      <div style={{ color: "#38bfff", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>AI ASSESSMENT</div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6 }}>{item.ai_notes}</div>
                    </div>
                  )}

                  {/* ── Photo documentation ── */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>SITE PHOTOS</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                      {(punchPhotos[item.id] || []).map((p, i) => (
                        <div key={i} style={{ position:"relative", width:72, height:72 }}>
                          <img src={p.url} style={{ width:72, height:72, objectFit:"cover", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)" }} />
                          {photoLoading === item.id && !p.analysis && (
                            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <div style={{ width:12, height:12, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                            </div>
                          )}
                          {p.analysis && (
                            <div title={p.analysis.description} style={{ position:"absolute", bottom:3, right:3, background:p.analysis.severity==="Critical"||p.analysis.severity==="High"?"#f43f5e":p.analysis.severity==="Medium"?"#f97316":"#22d3a0", borderRadius:4, padding:"2px 5px", fontSize:9, fontWeight:700, color:"#fff" }}>
                              {p.analysis.severity}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => { setPhotoTargetId(item.id); punchPhotoInputRef.current?.click(); }}
                        title="Attach site photo — AI will analyze defects"
                        style={{ width:72, height:72, borderRadius:8, border:"2px dashed rgba(255,255,255,0.12)", background:"transparent", color:"rgba(255,255,255,0.3)", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span style={{ fontSize:10 }}>Photo</span>
                      </button>
                    </div>
                    {(punchPhotos[item.id] || []).some(p => p.analysis?.findings?.length) && (
                      <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
                        {(punchPhotos[item.id] || []).flatMap(p => p.analysis?.findings || []).map((f: string, i: number) => (
                          <div key={i}>• {f}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* Status updater */}
                    {(["Open", "In Progress", "Resolved", "Closed"] as PunchItem["status"][]).map(s => (
                      <button key={s} onClick={() => updateStatus(item.id, s)}
                        disabled={item.status === s}
                        style={{
                          padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: item.status === s ? "default" : "pointer",
                          background: item.status === s ? `${STATUS_COLOR[s]}20` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${item.status === s ? STATUS_COLOR[s] + "40" : "rgba(255,255,255,0.08)"}`,
                          color: item.status === s ? STATUS_COLOR[s] : "rgba(255,255,255,0.4)",
                          fontWeight: item.status === s ? 700 : 400,
                        }}>
                        {s}
                      </button>
                    ))}
                    <div style={{ width: 1, background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, alignSelf: "center" }}>Ball in court:</span>
                    {BIC_OPTIONS.map(bic => (
                      <button key={bic} onClick={() => updateBIC(item.id, bic)}
                        style={{
                          padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                          background: item.ball_in_court === bic ? "rgba(0,168,240,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${item.ball_in_court === bic ? "rgba(0,168,240,0.3)" : "rgba(255,255,255,0.08)"}`,
                          color: item.ball_in_court === bic ? "#38bfff" : "rgba(255,255,255,0.4)",
                          fontWeight: item.ball_in_court === bic ? 700 : 400,
                        }}>
                        {bic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "#151b24", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: 28, width: 520, maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Punch Item</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Location / Area", key: "location", placeholder: "e.g. Level 2 — East Corridor" },
                { label: "Description", key: "description", placeholder: "Describe the deficiency..." },
                { label: "Responsible Party / Assignee", key: "assignee", placeholder: "e.g. Premier Tile Works" },
                { label: "Trade", key: "trade", placeholder: "e.g. Electrical, Tile, HVAC..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
                  {f.key === "description" ? (
                    <textarea value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={3}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                  ) : (
                    <input value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                  )}
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", cursor: "pointer" }}>
                    {["Critical", "High", "Medium", "Low"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={createItem} disabled={aiLoading === "create"}
                style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {aiLoading === "create" ? "Creating..." : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden photo input for punch items */}
      <input ref={punchPhotoInputRef} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f && photoTargetId) addPunchPhoto(photoTargetId, f); e.target.value = ""; }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
