import { useState, useEffect } from "react";
import type { AppState } from "../../App";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const F = "'Outfit',sans-serif";
const M = "'JetBrains Mono',monospace";

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  lease:       { label: "Lease",         color: "#a78bfa", icon: "📄" },
  maintenance: { label: "Maintenance",   color: "#38bfff", icon: "🔧" },
  cam:         { label: "CAM Recon",     color: "#f43f5e", icon: "📊" },
  noi:         { label: "NOI Report",    color: "#22d3a0", icon: "📈" },
  tenant:      { label: "Tenant Risk",   color: "#f59e0b", icon: "👤" },
};

type Approval = {
  id: string;
  type: string;
  reference_id: string;
  title: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected";
  requested_by: string;
  review_notes?: string;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
};

export default function Approvals({ appState }: { appState: AppState }) {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"Approved" | "Rejected">("Approved");

  useEffect(() => { load(); }, [appState.sessionId]);

  const load = async () => {
    if (!appState.sessionId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/approvals/${appState.sessionId}`);
      if (r.ok) setApprovals(await r.json());
    } catch {}
    setLoading(false);
  };

  const openReview = (id: string, action: "Approved" | "Rejected") => {
    setReviewingId(id);
    setReviewAction(action);
    setNotes("");
    setReviewing(id);
  };

  const submitReview = async () => {
    if (!reviewingId) return;
    try {
      const r = await fetch(`${API}/approvals/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: appState.sessionId,
          approval_id: reviewingId,
          status: reviewAction,
          review_notes: notes,
          reviewed_by: appState.user?.name || "Supervisor",
        }),
      });
      if (r.ok) {
        setApprovals(prev => prev.map(a =>
          a.id === reviewingId
            ? { ...a, status: reviewAction, review_notes: notes, reviewed_by: appState.user?.name || "Supervisor", reviewed_at: new Date().toISOString() }
            : a
        ));
      }
    } catch {}
    setReviewing(null);
    setReviewingId(null);
  };

  const pending = approvals.filter(a => a.status === "Pending");
  const history = approvals.filter(a => a.status !== "Pending");

  const displayed = tab === "pending" ? pending : history;

  const fmtDate = (s?: string) => {
    if (!s) return "—";
    try { return new Date(s).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return s; }
  };

  return (
    <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto", fontFamily: F, color: "#f0f4f8" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            ✅
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Approval Queue</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: M }}>Human guardrails — supervisor sign-off required</div>
          </div>
          {pending.length > 0 && (
            <div style={{ marginLeft: "auto", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#f43f5e", fontFamily: M }}>
              {pending.length} pending
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", value: approvals.length, color: "#38bfff" },
          { label: "Pending", value: pending.length, color: "#f59e0b" },
          { label: "Approved", value: approvals.filter(a => a.status === "Approved").length, color: "#22d3a0" },
          { label: "Rejected", value: approvals.filter(a => a.status === "Rejected").length, color: "#f43f5e" },
        ].map(s => (
          <div key={s.label} style={{ background: "#151b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 10, fontFamily: M, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {([["pending","Pending Review"],["history","History"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)} style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: tab === id ? "rgba(245,158,11,0.15)" : "transparent", color: tab === id ? "#f59e0b" : "rgba(255,255,255,0.38)", fontSize: 13, fontWeight: tab === id ? 600 : 400, cursor: "pointer", fontFamily: F }}>
            {label}{id === "pending" && pending.length > 0 ? ` (${pending.length})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Loading approvals...</div>}
      {!loading && displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          {tab === "pending" ? "No items pending approval" : "No approval history yet"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {displayed.map(a => {
          const meta = TYPE_META[a.type] || { label: a.type, color: "#64748b", icon: "📋" };
          const isApproved = a.status === "Approved";
          const isRejected = a.status === "Rejected";
          return (
            <div key={a.id} style={{ background: "#151b24", border: `1px solid ${a.status === "Pending" ? "rgba(245,158,11,0.2)" : isApproved ? "rgba(34,211,160,0.15)" : "rgba(244,63,94,0.15)"}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Type badge */}
                  <div style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30`, borderRadius: 8, padding: "8px 10px", flexShrink: 0, textAlign: "center", minWidth: 72 }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{meta.icon}</div>
                    <div style={{ fontSize: 9, fontFamily: M, color: meta.color, letterSpacing: "0.06em", fontWeight: 700 }}>{meta.label.toUpperCase()}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f4f8" }}>{a.title}</div>
                      <span style={{ padding: "2px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: a.status === "Pending" ? "rgba(245,158,11,0.12)" : isApproved ? "rgba(34,211,160,0.12)" : "rgba(244,63,94,0.12)", color: a.status === "Pending" ? "#f59e0b" : isApproved ? "#22d3a0" : "#f43f5e", border: `1px solid ${a.status === "Pending" ? "rgba(245,158,11,0.25)" : isApproved ? "rgba(34,211,160,0.25)" : "rgba(244,63,94,0.25)"}` }}>
                        {a.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 8 }}>{a.description}</div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontFamily: M, color: "rgba(255,255,255,0.25)" }}>Requested by: <span style={{ color: "rgba(255,255,255,0.5)" }}>{a.requested_by}</span></span>
                      <span style={{ fontSize: 11, fontFamily: M, color: "rgba(255,255,255,0.25)" }}>Submitted: <span style={{ color: "rgba(255,255,255,0.5)" }}>{fmtDate(a.created_at)}</span></span>
                      <span style={{ fontSize: 11, fontFamily: M, color: "rgba(255,255,255,0.25)" }}>Ref: <span style={{ color: "rgba(255,255,255,0.35)" }}>{a.reference_id}</span></span>
                    </div>
                    {a.review_notes && (
                      <div style={{ marginTop: 10, background: isApproved ? "rgba(34,211,160,0.06)" : "rgba(244,63,94,0.06)", border: `1px solid ${isApproved ? "rgba(34,211,160,0.15)" : "rgba(244,63,94,0.15)"}`, borderRadius: 8, padding: "9px 12px" }}>
                        <div style={{ fontSize: 10, fontFamily: M, color: isApproved ? "#22d3a0" : "#f43f5e", letterSpacing: "0.06em", marginBottom: 4 }}>
                          {isApproved ? "APPROVAL NOTE" : "REJECTION REASON"} — {a.reviewed_by} · {fmtDate(a.reviewed_at)}
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{a.review_notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {a.status === "Pending" && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openReview(a.id, "Approved")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "rgba(34,211,160,0.15)", color: "#22d3a0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                        Approve
                      </button>
                      <button onClick={() => openReview(a.id, "Rejected")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(244,63,94,0.2)", background: "transparent", color: "#f43f5e", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setReviewing(null); }}>
          <div style={{ background: "#151b24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 480 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              {reviewAction === "Approved" ? "✅ Approve Item" : "❌ Reject Item"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
              {reviewAction === "Approved"
                ? "The item status will be updated and the requester notified."
                : "Please provide a reason so the requester can take corrective action."}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: M, letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                {reviewAction === "Approved" ? "APPROVAL NOTES (OPTIONAL)" : "REJECTION REASON *"}
              </label>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={reviewAction === "Approved" ? "Any conditions or notes for this approval..." : "Explain why this is being rejected..."}
                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#f0f4f8", fontSize: 13, fontFamily: F, outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setReviewing(null)} style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitReview} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: reviewAction === "Approved" ? "rgba(34,211,160,0.2)" : "rgba(244,63,94,0.2)", color: reviewAction === "Approved" ? "#22d3a0" : "#f43f5e", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Confirm {reviewAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
