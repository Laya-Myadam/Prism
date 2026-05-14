import { useEffect, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  Handle,
  Position,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AppState } from "../../App";
import { getDashboard, getRFIs, getChangeOrders, getObligations } from "../../api/client";

interface Props { appState: AppState; }

const F = "'Outfit',sans-serif";

// ── Node colours by type ───────────────────────────────────────────────────────
const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  project:    { bg: "#1e3a5f", border: "#3b82f6", text: "#93c5fd" },
  party:      { bg: "#1e3a2f", border: "#22c55e", text: "#86efac" },
  document:   { bg: "#2d1e3a", border: "#a855f7", text: "#d8b4fe" },
  rfi:        { bg: "#3a2a1e", border: "#f97316", text: "#fed7aa" },
  co:         { bg: "#3a1e2a", border: "#ec4899", text: "#fbcfe8" },
  obligation: { bg: "#3a341e", border: "#eab308", text: "#fef08a" },
  risk:       { bg: "#3a1e1e", border: "#ef4444", text: "#fca5a5" },
  milestone:  { bg: "#1e3a3a", border: "#06b6d4", text: "#a5f3fc" },
};

// ── Custom node component ─────────────────────────────────────────────────────
function ProjectNode({ data }: { data: any }) {
  const c = COLORS[data.type] || COLORS.project;
  return (
    <div style={{
      background: c.bg,
      border: `2px solid ${c.border}`,
      borderRadius: data.type === "project" ? 16 : 10,
      padding: data.type === "project" ? "14px 20px" : "10px 14px",
      minWidth: data.type === "project" ? 180 : 140,
      maxWidth: 220,
      fontFamily: F,
      boxShadow: `0 0 16px ${c.border}33`,
      cursor: "default",
    }}>
      <Handle type="target" position={Position.Top} style={{ background: c.border, border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: data.type === "project" ? 18 : 14 }}>{data.icon}</span>
        <span style={{ color: c.border, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          {data.type}
        </span>
      </div>
      <div style={{ color: "#f1f5f9", fontSize: data.type === "project" ? 15 : 13, fontWeight: 600, lineHeight: 1.3 }}>
        {data.label}
      </div>
      {data.sub && (
        <div style={{ color: c.text, fontSize: 11, marginTop: 4, opacity: 0.9 }}>{data.sub}</div>
      )}
      {data.badge && (
        <div style={{ marginTop: 6, display: "inline-block", background: c.border + "33", color: c.text, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
          {data.badge}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: c.border, border: "none" }} />
    </div>
  );
}

const nodeTypes = { custom: ProjectNode };

// ── Demo graph (no session) ───────────────────────────────────────────────────
const DEMO_NODES: Node[] = [
  // Project
  { id: "project", type: "custom", position: { x: 400, y: 20 }, data: { type: "project", icon: "◈", label: "Riverside Heights Mixed-Use", sub: "$11.4M · Dec 2025", badge: "At Risk" } },
  // Parties
  { id: "owner",     type: "custom", position: { x: 80,  y: 180 }, data: { type: "party", icon: "🏢", label: "Pinnacle Urban Developers", sub: "Owner" } },
  { id: "gc",        type: "custom", position: { x: 320, y: 180 }, data: { type: "party", icon: "🏗️", label: "Hardrock General Contracting", sub: "General Contractor" } },
  { id: "architect", type: "custom", position: { x: 580, y: 180 }, data: { type: "party", icon: "📐", label: "Meridian Design Studio", sub: "Architect of Record" } },
  { id: "sub1",      type: "custom", position: { x: 820, y: 180 }, data: { type: "party", icon: "⚡", label: "Volt MEP Solutions", sub: "MEP Subcontractor" } },
  // Documents
  { id: "contract",  type: "custom", position: { x: 60,  y: 360 }, data: { type: "document", icon: "📄", label: "Prime Contract", sub: "Lump Sum · 5% retention", badge: "Active" } },
  { id: "drawings",  type: "custom", position: { x: 260, y: 360 }, data: { type: "document", icon: "📐", label: "Structural Drawings", sub: "Rev 4 · 28 sheets" } },
  { id: "specs",     type: "custom", position: { x: 460, y: 360 }, data: { type: "document", icon: "📋", label: "Project Specifications", sub: "CSI MasterFormat" } },
  // RFIs
  { id: "rfi1",      type: "custom", position: { x: 60,  y: 540 }, data: { type: "rfi", icon: "❓", label: "RFI-001: Rebar Spec", sub: "Grid C4 · Structural", badge: "Open 14d" } },
  { id: "rfi2",      type: "custom", position: { x: 240, y: 540 }, data: { type: "rfi", icon: "❓", label: "RFI-009: Waterproofing", sub: "Basement Level", badge: "Overdue" } },
  { id: "rfi3",      type: "custom", position: { x: 420, y: 540 }, data: { type: "rfi", icon: "❓", label: "RFI-012: HVAC Duct", sub: "Level 3 Coordination", badge: "Open" } },
  // Change Orders
  { id: "co1",       type: "custom", position: { x: 620, y: 540 }, data: { type: "co", icon: "💲", label: "CO-003: Rock Excavation", sub: "$45,000 · Approved" } },
  { id: "co2",       type: "custom", position: { x: 800, y: 540 }, data: { type: "co", icon: "💲", label: "CO-004: Waterproofing", sub: "$34,500 · Pending", badge: "8d pending" } },
  // Obligations
  { id: "obl1",      type: "custom", position: { x: 60,  y: 720 }, data: { type: "obligation", icon: "📅", label: "Notice of Delay", sub: "Within 48h of event", badge: "Active" } },
  { id: "obl2",      type: "custom", position: { x: 270, y: 720 }, data: { type: "obligation", icon: "📅", label: "Monthly Progress Report", sub: "Due 1st of each month" } },
  { id: "obl3",      type: "custom", position: { x: 480, y: 720 }, data: { type: "obligation", icon: "📅", label: "Retention Release", sub: "On practical completion" } },
  // Risks
  { id: "risk1",     type: "custom", position: { x: 700, y: 720 }, data: { type: "risk", icon: "⚠️", label: "LDs Exposure", sub: "$2,000/day · 2d behind", badge: "High" } },
  { id: "risk2",     type: "custom", position: { x: 880, y: 720 }, data: { type: "risk", icon: "⚠️", label: "RFI Delay Claim", sub: "3 RFIs overdue 14d+", badge: "High" } },
  // Milestones
  { id: "ms1",       type: "custom", position: { x: 600, y: 360 }, data: { type: "milestone", icon: "🎯", label: "Foundation Complete", sub: "Target: Mar 28 2026", badge: "At Risk" } },
  { id: "ms2",       type: "custom", position: { x: 800, y: 360 }, data: { type: "milestone", icon: "🎯", label: "Structural Topping Out", sub: "Target: Jun 15 2026" } },
];

const DEMO_EDGES: Edge[] = [
  // Project → Parties
  { id: "e-p-owner",     source: "project", target: "owner",     animated: false, style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e-p-gc",        source: "project", target: "gc",        animated: false, style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e-p-arch",      source: "project", target: "architect", animated: false, style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e-p-sub1",      source: "project", target: "sub1",      animated: false, style: { stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 2" } },
  // Parties → Documents
  { id: "e-gc-contract", source: "gc",      target: "contract",  style: { stroke: "#a855f7", strokeWidth: 1.5 } },
  { id: "e-gc-drawings", source: "gc",      target: "drawings",  style: { stroke: "#a855f7", strokeWidth: 1.5 } },
  { id: "e-arch-specs",  source: "architect",target:"specs",     style: { stroke: "#a855f7", strokeWidth: 1.5 } },
  // Documents → RFIs
  { id: "e-drawings-rfi1", source: "drawings", target: "rfi1",  animated: true, style: { stroke: "#f97316", strokeWidth: 1.5 } },
  { id: "e-specs-rfi2",    source: "specs",    target: "rfi2",  animated: true, style: { stroke: "#f97316", strokeWidth: 1.5 } },
  { id: "e-specs-rfi3",    source: "specs",    target: "rfi3",  animated: true, style: { stroke: "#f97316", strokeWidth: 1.5 } },
  // Documents → Change Orders
  { id: "e-contract-co1",  source: "contract", target: "co1",   style: { stroke: "#ec4899", strokeWidth: 1.5 } },
  { id: "e-contract-co2",  source: "contract", target: "co2",   animated: true, style: { stroke: "#ec4899", strokeWidth: 1.5 } },
  // Contract → Obligations
  { id: "e-contract-obl1", source: "contract", target: "obl1",  style: { stroke: "#eab308", strokeWidth: 1.5 } },
  { id: "e-contract-obl2", source: "contract", target: "obl2",  style: { stroke: "#eab308", strokeWidth: 1.5 } },
  { id: "e-contract-obl3", source: "contract", target: "obl3",  style: { stroke: "#eab308", strokeWidth: 1.5 } },
  // → Risks
  { id: "e-co2-risk1",   source: "co2",  target: "risk1",  animated: true, style: { stroke: "#ef4444", strokeWidth: 2 } },
  { id: "e-rfi2-risk2",  source: "rfi2", target: "risk2",  animated: true, style: { stroke: "#ef4444", strokeWidth: 2 } },
  // → Milestones
  { id: "e-p-ms1",       source: "project", target: "ms1", style: { stroke: "#06b6d4", strokeWidth: 1.5, strokeDasharray: "6 3" } },
  { id: "e-p-ms2",       source: "project", target: "ms2", style: { stroke: "#06b6d4", strokeWidth: 1.5, strokeDasharray: "6 3" } },
  { id: "e-ms1-risk1",   source: "ms1",     target: "risk1", animated: true, style: { stroke: "#ef4444", strokeWidth: 1.5 } },
];

// ── Legend entry ──────────────────────────────────────────────────────────────
function LegendDot({ type, label }: { type: string; label: string }) {
  const c = COLORS[type];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: c.bg, border: `2px solid ${c.border}` }} />
      <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: F }}>{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KnowledgeGraph({ appState }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEMO_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEMO_EDGES);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ── Build live graph from session data ──────────────────────────────────────
  useEffect(() => {
    if (!appState.sessionId || !appState.projectBuilt) return;

    const buildGraph = async () => {
      setLoading(true);
      try {
        const [dashboard, rfis, cos, obligations] = await Promise.allSettled([
          getDashboard(appState.sessionId!),
          getRFIs(appState.sessionId!),
          getChangeOrders(appState.sessionId!),
          getObligations(appState.sessionId!),
        ]);

        const db = dashboard.status === "fulfilled" ? dashboard.value : null;
        const rfiList: any[] = rfis.status === "fulfilled" ? (rfis.value || []) : [];
        const coList: any[]  = cos.status === "fulfilled"  ? (cos.value  || []) : [];
        const oblList: any[] = obligations.status === "fulfilled" ? (obligations.value || []) : [];

        const liveNodes: Node[] = [];
        const liveEdges: Edge[] = [];

        // Project node
        liveNodes.push({
          id: "project", type: "custom", position: { x: 400, y: 20 },
          data: {
            type: "project", icon: "◈",
            label: db?.project_name || "Your Project",
            sub: `${db?.contract_value || ""} · ${db?.completion_date || ""}`.replace(/^ · | · $/, ""),
          },
        });

        // Parties
        const parties = [
          { id: "owner", label: db?.owner || "Owner", sub: "Owner", icon: "🏢" },
          { id: "gc",    label: db?.gc    || "General Contractor", sub: "General Contractor", icon: "🏗️" },
          { id: "arch",  label: db?.architect || "Architect", sub: "Architect", icon: "📐" },
        ].filter(p => p.label && p.label !== "Unknown");

        parties.forEach((p, i) => {
          liveNodes.push({ id: p.id, type: "custom", position: { x: 80 + i * 280, y: 180 }, data: { type: "party", ...p } });
          liveEdges.push({ id: `e-p-${p.id}`, source: "project", target: p.id, style: { stroke: "#22c55e", strokeWidth: 2 } });
        });

        // Contract document node
        liveNodes.push({ id: "contract", type: "custom", position: { x: 80, y: 360 }, data: { type: "document", icon: "📄", label: "Prime Contract", sub: db?.contract_value || "" } });
        liveEdges.push({ id: "e-gc-contract", source: "gc", target: "contract", style: { stroke: "#a855f7", strokeWidth: 1.5 } });

        // RFI nodes (max 6)
        rfiList.slice(0, 6).forEach((rfi: any, i: number) => {
          const id = `rfi-${rfi.id || i}`;
          liveNodes.push({
            id, type: "custom",
            position: { x: 60 + i * 180, y: 540 },
            data: { type: "rfi", icon: "❓", label: rfi.subject || `RFI-${String(i+1).padStart(3,"0")}`, sub: rfi.trade || rfi.submitted_by || "", badge: rfi.status || "Open" },
          });
          liveEdges.push({ id: `e-contract-${id}`, source: "contract", target: id, animated: rfi.status === "Open", style: { stroke: "#f97316", strokeWidth: 1.5 } });
        });

        // CO nodes (max 4)
        coList.slice(0, 4).forEach((co: any, i: number) => {
          const id = `co-${co.id || i}`;
          liveNodes.push({
            id, type: "custom",
            position: { x: 60 + i * 200, y: 720 },
            data: { type: "co", icon: "💲", label: co.title || `CO-${String(i+1).padStart(3,"0")}`, sub: co.amount ? `$${Number(co.amount).toLocaleString()}` : "", badge: co.status || "" },
          });
          liveEdges.push({ id: `e-contract-${id}`, source: "contract", target: id, style: { stroke: "#ec4899", strokeWidth: 1.5 } });
        });

        // Obligation nodes (max 4)
        oblList.slice(0, 4).forEach((obl: any, i: number) => {
          const id = `obl-${obl.id || i}`;
          liveNodes.push({
            id, type: "custom",
            position: { x: 860 + i * 0, y: 360 + i * 160 },
            data: { type: "obligation", icon: "📅", label: obl.description || obl.title || `Obligation ${i+1}`, sub: obl.due_date || "", badge: obl.completed ? "Done" : "Active" },
          });
          liveEdges.push({ id: `e-contract-${id}`, source: "contract", target: id, style: { stroke: "#eab308", strokeWidth: 1.5 } });
        });

        if (liveNodes.length > 1) {
          setNodes(liveNodes);
          setEdges(liveEdges);
          setIsLive(true);
        }
      } catch (e) {
        // fallback to demo
      } finally {
        setLoading(false);
      }
    };

    buildGraph();
  }, [appState.sessionId, appState.projectBuilt]);

  return (
    <div style={{ height: "calc(100vh - 64px)", background: "#0f1623", position: "relative", fontFamily: F }}>

      {/* Legend */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        background: "rgba(15,22,35,0.92)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10, padding: "12px 16px", backdropFilter: "blur(8px)",
      }}>
        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Node Types
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <LegendDot type="project"    label="Project" />
          <LegendDot type="party"      label="Parties" />
          <LegendDot type="document"   label="Documents" />
          <LegendDot type="rfi"        label="RFIs" />
          <LegendDot type="co"         label="Change Orders" />
          <LegendDot type="obligation" label="Obligations" />
          <LegendDot type="risk"       label="Risks" />
          <LegendDot type="milestone"  label="Milestones" />
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 10,
        background: isLive ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
        border: `1px solid ${isLive ? "#22c55e" : "#475569"}`,
        borderRadius: 20, padding: "6px 14px",
        color: isLive ? "#86efac" : "#94a3b8",
        fontSize: 12, fontWeight: 600,
      }}>
        {loading ? "⟳ Loading live data…" : isLive ? "● Live project data" : "◌ Demo graph — upload documents to see your project"}
      </div>

      {/* Edge legend */}
      <div style={{
        position: "absolute", bottom: 80, left: 16, zIndex: 10,
        background: "rgba(15,22,35,0.92)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(8px)",
      }}>
        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Edge Types
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { color: "#22c55e", label: "Contractual relationship", dash: false },
            { color: "#a855f7", label: "Document ownership", dash: false },
            { color: "#f97316", label: "RFI reference", dash: false, animated: true },
            { color: "#ec4899", label: "Change order link", dash: false },
            { color: "#eab308", label: "Obligation", dash: false },
            { color: "#ef4444", label: "Risk link", dash: false, animated: true },
            { color: "#06b6d4", label: "Milestone", dash: true },
          ].map(e => (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="28" height="10">
                <line x1="0" y1="5" x2="28" y2="5"
                  stroke={e.color} strokeWidth="2"
                  strokeDasharray={e.dash ? "4 2" : "none"} />
              </svg>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        style={{ background: "#0f1623" }}
      >
        <Background color="#1e293b" gap={24} variant={BackgroundVariant.Dots} />
        <Controls style={{ background: "#1c2535", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }} />
        <MiniMap
          style={{ background: "#1c2535", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
          nodeColor={(n) => COLORS[(n.data as any)?.type]?.border || "#64748b"}
          maskColor="rgba(15,22,35,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
