import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

type WeatherCondition = "Clear" | "Partly Cloudy" | "Overcast" | "Rain" | "Heavy Rain" | "Wind" | "Extreme Heat" | "Fog";

type DailyLogEntry = {
  id: string;
  date: string;
  weather: WeatherCondition;
  temp_high: string;
  temp_low: string;
  crew_count: number;
  labor_hours: number;
  work_performed: string;
  delays: string;
  equipment: string;
  incidents: string;
  visitors: string;
  ai_narrative?: string;
  delay_claims?: string[];
  weather_impact?: boolean;
  created_by: string;
};

const WEATHER_ICON: Record<string, string> = {
  Clear: "☀️", "Partly Cloudy": "⛅", Overcast: "☁️", Rain: "🌧️",
  "Heavy Rain": "⛈️", Wind: "💨", "Extreme Heat": "🌡️", Fog: "🌫️",
};

const WEATHER_COLORS: Record<string, string> = {
  Clear: "#22d3a0", "Partly Cloudy": "#eab308", Overcast: "rgba(255,255,255,0.4)",
  Rain: "#00a8f0", "Heavy Rain": "#f43f5e", Wind: "#eab308", "Extreme Heat": "#f97316", Fog: "rgba(255,255,255,0.35)",
};

const DEMO_LOGS: DailyLogEntry[] = [
  {
    id: "dl1", date: "2025-05-28",
    weather: "Clear", temp_high: "82°F", temp_low: "65°F",
    crew_count: 34, labor_hours: 272,
    work_performed: "Completed Level 3 slab pour (2,400 SF). Installed conduit runs in north wing. Framing crew completed exterior stud walls on east elevation. Mechanical crew roughed in supply ductwork for zones 3A-3D.",
    delays: "None reported.",
    equipment: "1x Concrete Pump, 2x Scissor Lifts, 1x Telehandler, 1x Tower Crane",
    incidents: "None",
    visitors: "Owner's Rep — Sarah Johnson (AM inspection)",
    ai_narrative: "Site activities on 5/28 progressed on schedule with the Level 3 concrete pour completed as planned. 34 workers on site logged 272 labor hours across structural, electrical, and mechanical trades. No safety incidents recorded and no delay events observed. Weather conditions were favorable with clear skies and temperatures within acceptable range for concrete placement. Owner's representative conducted an AM walkthrough with no items raised.",
    delay_claims: [],
    weather_impact: false,
    created_by: "Marcus Rivera",
  },
  {
    id: "dl2", date: "2025-05-27",
    weather: "Rain", temp_high: "71°F", temp_low: "58°F",
    crew_count: 21, labor_hours: 147,
    work_performed: "Interior work only due to weather. Tile installation in Level 2 restrooms (north side). Electrical panel terminations at boards B-1 through B-4. Drywall taping and mud on Level 1 corridor B.",
    delays: "Concrete pour on Level 3 deferred to 5/28 due to sustained rain. Crane operations suspended from 08:00 to 13:30. Exterior framing crew stood down for 5.5 hours.",
    equipment: "2x Scissor Lifts, 1x Drywall Lift, 1x Boom Lift (secured)",
    incidents: "Near-miss: Worker slipped on wet ramp access — no injury. Corrective action: anti-slip mat installed at ramp entry.",
    visitors: "None",
    ai_narrative: "Adverse weather on 5/27 resulted in significant productivity loss. Rain-driven suspension of crane operations and exterior works caused a net delay to the Level 3 pour, which is on the critical path. Crew count reduced to 21 (vs planned 38) as exterior trades could not safely operate. A near-miss slip incident was promptly addressed with corrective measures. The delay to the concrete pour may constitute a compensable weather delay event — contractor should document daily rainfall data and compare against specification weather day allowances.",
    delay_claims: [
      "Concrete pour deferred by 1 day due to rain — potential weather delay claim if rainfall exceeds contractual allowance",
      "Crane suspension 08:00–13:30 — 5.5 crew-hours lost on crane-dependent activities (steel placement, material lifts)",
    ],
    weather_impact: true,
    created_by: "Marcus Rivera",
  },
  {
    id: "dl3", date: "2025-05-26",
    weather: "Clear", temp_high: "78°F", temp_low: "62°F",
    crew_count: 38, labor_hours: 304,
    work_performed: "Reinforcement steel placed and inspected on Level 3 slab (ready for pour). Curtain wall installation progressed on south elevation bays 5-9. MEP rough-in inspections passed on Level 1. Interior framing 85% complete on Level 2.",
    delays: "Inspections took longer than anticipated — structural engineer arrived 90 minutes late. Concrete delivery rescheduled to 5/28.",
    equipment: "1x Tower Crane, 3x Scissor Lifts, 1x Telehandler, 1x Boom Lift",
    incidents: "None",
    visitors: "Structural Engineer — Michael Park (rebar inspection, 10:30 AM)",
    ai_narrative: "Productive day with 38 personnel and 304 labor hours. Rebar inspection passed and Level 3 slab is ready for pour. Structural engineer's late arrival caused a 90-minute delay cascading to concrete delivery rescheduling — this is contractor-caused and not compensable. Curtain wall installation is tracking on schedule. MEP rough-in inspection approvals on Level 1 unlock the next phase of interior finishes.",
    delay_claims: [
      "Structural engineer 90-minute late arrival — contractor-caused delay, non-compensable but should be documented",
    ],
    weather_impact: false,
    created_by: "Sarah Kim",
  },
];

const WEATHER_OPTIONS: WeatherCondition[] = ["Clear", "Partly Cloudy", "Overcast", "Rain", "Heavy Rain", "Wind", "Extreme Heat", "Fog"];

export default function DailyLog({ appState }: { appState: AppState }) {
  const [logs, setLogs] = useState<DailyLogEntry[]>(DEMO_LOGS);
  const [expanded, setExpanded] = useState<string | null>("dl1");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{
    date: string; weather: WeatherCondition; temp_high: string; temp_low: string;
    crew_count: string; labor_hours: string; work_performed: string;
    delays: string; equipment: string; incidents: string; visitors: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    weather: "Clear", temp_high: "", temp_low: "",
    crew_count: "", labor_hours: "",
    work_performed: "", delays: "", equipment: "", incidents: "", visitors: "",
  });

  useEffect(() => {
    if (!appState.sessionId) return;
    fetch(`${BASE}/construction/daily-log/${appState.sessionId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setLogs(d); })
      .catch(() => {});
  }, [appState.sessionId]);

  const stats = {
    total: logs.length,
    withDelays: logs.filter(l => l.delays && l.delays !== "None reported." && l.delays !== "None").length,
    weatherEvents: logs.filter(l => l.weather_impact).length,
    delayClaims: logs.reduce((sum, l) => sum + (l.delay_claims?.length || 0), 0),
    totalHours: logs.reduce((sum, l) => sum + l.labor_hours, 0),
  };

  async function generateNarrative(log: DailyLogEntry) {
    setAiLoading(log.id);
    try {
      const r = await fetch(`${BASE}/construction/daily-log/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: appState.sessionId,
          log_id: log.id,
          date: log.date,
          weather: log.weather,
          crew_count: log.crew_count,
          labor_hours: log.labor_hours,
          work_performed: log.work_performed,
          delays: log.delays,
          incidents: log.incidents,
        }),
      });
      const data = await r.json();
      setLogs(prev => prev.map(l => l.id === log.id ? {
        ...l,
        ai_narrative: data.narrative || l.ai_narrative,
        delay_claims: data.delay_claims || l.delay_claims,
        weather_impact: data.weather_impact ?? l.weather_impact,
      } : l));
    } catch {
      setLogs(prev => prev.map(l => l.id === log.id ? {
        ...l,
        ai_narrative: `Site activities on ${log.date} — ${log.crew_count} workers logged ${log.labor_hours} labor hours across active trades. ${log.delays && log.delays !== "None reported." ? "Delays noted: " + log.delays : "No delay events reported."} Weather conditions: ${log.weather}, ${log.temp_high}/${log.temp_low}. ${log.incidents && log.incidents !== "None" ? "Safety incident recorded — requires follow-up." : "No safety incidents."}`,
        delay_claims: log.delays && log.delays !== "None reported." && log.delays !== "None"
          ? ["Delay documented — review against contract schedule baseline for claim eligibility"]
          : [],
        weather_impact: ["Rain", "Heavy Rain", "Extreme Heat", "Wind"].includes(log.weather),
      } : l));
    }
    setAiLoading(null);
  }

  async function createLog() {
    if (!form.date || !form.work_performed) return;
    setAiLoading("create");
    const newLog: DailyLogEntry = {
      id: `dl${Date.now()}`,
      date: form.date,
      weather: form.weather,
      temp_high: form.temp_high,
      temp_low: form.temp_low,
      crew_count: Number(form.crew_count) || 0,
      labor_hours: Number(form.labor_hours) || 0,
      work_performed: form.work_performed,
      delays: form.delays || "None reported.",
      equipment: form.equipment,
      incidents: form.incidents || "None",
      visitors: form.visitors,
      created_by: appState.user?.name || "Unknown",
    };
    try {
      const r = await fetch(`${BASE}/construction/daily-log/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: appState.sessionId, ...form }),
      });
      const data = await r.json();
      setLogs(prev => [data.log || newLog, ...prev]);
    } catch {
      setLogs(prev => [newLog, ...prev]);
    }
    setForm({
      date: new Date().toISOString().split("T")[0], weather: "Clear", temp_high: "", temp_low: "",
      crew_count: "", labor_hours: "", work_performed: "", delays: "", equipment: "", incidents: "", visitors: "",
    });
    setShowModal(false);
    setAiLoading(null);
  }

  return (
    <div style={{ padding: 28, maxWidth: 1300, margin: "0 auto" }}>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Logs", value: stats.total, color: "#38bfff" },
          { label: "With Delays", value: stats.withDelays, color: "#f97316" },
          { label: "Weather Events", value: stats.weatherEvents, color: "#eab308" },
          { label: "Delay Claims Detected", value: stats.delayClaims, color: "#f43f5e" },
          { label: "Total Labor Hours", value: stats.totalHours.toLocaleString(), color: "#22d3a0" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#151b24", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", marginBottom: 8 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={() => setShowModal(true)}
          style={{ padding: "9px 18px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + New Daily Log
        </button>
      </div>

      {/* ── Log cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {logs.map(log => {
          const isExp = expanded === log.id;
          const hasDelays = log.delays && log.delays !== "None reported." && log.delays !== "None";
          const hasIncidents = log.incidents && log.incidents !== "None";
          const hasClaims = log.delay_claims && log.delay_claims.length > 0;

          return (
            <div key={log.id} style={{
              background: "#151b24",
              border: `1px solid ${isExp ? "rgba(0,168,240,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderLeft: `3px solid ${log.weather_impact ? "#f97316" : hasClaims ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, overflow: "hidden",
            }}>

              {/* ── Log header ── */}
              <div onClick={() => setExpanded(isExp ? null : log.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 20 }}>

                {/* Date */}
                <div style={{ minWidth: 90 }}>
                  <div style={{ color: "#f0f4f8", fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                    {new Date(log.date + "T12:00:00").getFullYear()}
                  </div>
                </div>

                {/* Weather */}
                <div style={{ minWidth: 110, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{WEATHER_ICON[log.weather]}</span>
                  <div>
                    <div style={{ color: WEATHER_COLORS[log.weather], fontSize: 12, fontWeight: 600 }}>{log.weather}</div>
                    {(log.temp_high || log.temp_low) && (
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                        {log.temp_high}{log.temp_low ? ` / ${log.temp_low}` : ""}
                      </div>
                    )}
                  </div>
                </div>

                {/* Crew + hours */}
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>CREW</div>
                    <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700 }}>{log.crew_count}</div>
                  </div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>HOURS</div>
                    <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700 }}>{log.labor_hours}</div>
                  </div>
                </div>

                {/* Summary snippet */}
                <div style={{ flex: 1, color: "rgba(255,255,255,0.5)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.work_performed}
                </div>

                {/* Flags */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {hasDelays && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(249,115,22,0.12)", color: "#f97316", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>DELAY</span>
                  )}
                  {hasIncidents && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(244,63,94,0.12)", color: "#f43f5e", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>INCIDENT</span>
                  )}
                  {hasClaims && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(234,179,8,0.12)", color: "#eab308", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>CLAIM RISK</span>
                  )}
                  {log.weather_impact && (
                    <span style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(249,115,22,0.1)", color: "#f97316", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>WEATHER</span>
                  )}
                </div>

                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}>
                  <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* ── Expanded detail ── */}
              {isExp && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

                    {/* Work performed */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>WORK PERFORMED</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.7, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                        {log.work_performed}
                      </div>
                    </div>

                    {/* Delays */}
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>DELAYS / ISSUES</div>
                      <div style={{
                        color: hasDelays ? "#f97316" : "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6,
                        padding: "10px 12px", background: hasDelays ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.02)",
                        borderRadius: 8, border: `1px solid ${hasDelays ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.05)"}`,
                      }}>
                        {log.delays || "None reported."}
                      </div>
                    </div>

                    {/* Incidents */}
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>SAFETY INCIDENTS</div>
                      <div style={{
                        color: hasIncidents ? "#f43f5e" : "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6,
                        padding: "10px 12px", background: hasIncidents ? "rgba(244,63,94,0.06)" : "rgba(255,255,255,0.02)",
                        borderRadius: 8, border: `1px solid ${hasIncidents ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.05)"}`,
                      }}>
                        {log.incidents || "None"}
                      </div>
                    </div>

                    {/* Equipment */}
                    {log.equipment && (
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>EQUIPMENT ON SITE</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>{log.equipment}</div>
                      </div>
                    )}

                    {/* Visitors */}
                    {log.visitors && (
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>VISITORS</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>{log.visitors}</div>
                      </div>
                    )}
                  </div>

                  {/* Delay claims */}
                  {hasClaims && (
                    <div style={{ marginBottom: 16, padding: "14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                        <span style={{ color: "#eab308", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                          POTENTIAL DELAY CLAIMS DETECTED
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {log.delay_claims!.map((claim, i) => (
                          <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6, paddingLeft: 10, borderLeft: "2px solid rgba(234,179,8,0.3)" }}>
                            {claim}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI narrative */}
                  {log.ai_narrative ? (
                    <div style={{ padding: "14px", background: "rgba(0,168,240,0.06)", border: "1px solid rgba(0,168,240,0.15)", borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ color: "#38bfff", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>AI DAILY REPORT NARRATIVE</div>
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7 }}>{log.ai_narrative}</div>
                    </div>
                  ) : (
                    <button onClick={() => generateNarrative(log)} disabled={aiLoading === log.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                        padding: "10px 18px", borderRadius: 8,
                        background: "rgba(0,168,240,0.08)", border: "1px solid rgba(0,168,240,0.18)",
                        color: "#38bfff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>
                      {aiLoading === log.id ? (
                        <span style={{ width: 13, height: 13, border: "2px solid rgba(56,191,255,0.3)", borderTopColor: "#38bfff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {aiLoading === log.id ? "Generating narrative & scanning for claims..." : "Generate AI Narrative & Detect Delay Claims"}
                    </button>
                  )}

                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
                    Logged by {log.created_by}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "#151b24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ color: "#f0f4f8", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Daily Log</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Weather</label>
                  <select value={form.weather} onChange={e => setForm(p => ({ ...p, weather: e.target.value as WeatherCondition }))}
                    style={{ width: "100%", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", cursor: "pointer" }}>
                    {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{WEATHER_ICON[w]} {w}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                {[
                  { label: "Temp High", key: "temp_high", placeholder: "82°F" },
                  { label: "Temp Low", key: "temp_low", placeholder: "65°F" },
                  { label: "Crew Count", key: "crew_count", placeholder: "34" },
                  { label: "Labor Hours", key: "labor_hours", placeholder: "272" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none" }} />
                  </div>
                ))}
              </div>

              {[
                { label: "Work Performed", key: "work_performed", placeholder: "Describe all work activities completed today...", rows: 4 },
                { label: "Delays / Issues", key: "delays", placeholder: "Describe any delays, disruptions, or issues...", rows: 2 },
                { label: "Equipment on Site", key: "equipment", placeholder: "e.g. 1x Tower Crane, 2x Scissor Lifts...", rows: 2 },
                { label: "Safety Incidents", key: "incidents", placeholder: "None — or describe any incidents or near-misses", rows: 2 },
                { label: "Visitors", key: "visitors", placeholder: "e.g. Owner's Rep — Jane Smith (AM inspection)", rows: 1 },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <textarea value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} rows={f.rows}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f1319", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4f8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={createLog} disabled={aiLoading === "create"}
                style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #00a8f0, #0054a0)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {aiLoading === "create" ? "Saving..." : "Save Daily Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
