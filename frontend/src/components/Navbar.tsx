import { useNavigate, useLocation } from "react-router-dom";
import type { AppState } from "../App";

const pageTitles: Record<string, { title: string; sub: string }> = {
  "/dashboard":    { title: "Dashboard",                  sub: "Project overview & risk intelligence" },
  "/projects":     { title: "Projects",                   sub: "Manage your construction projects" },
  "/documents":    { title: "Documents",                  sub: "AI-powered document analysis" },
  "/workforce":    { title: "Workforce",                  sub: "Crew management & attendance" },
  "/scheduling":   { title: "Scheduling",                 sub: "Tasks, milestones & Gantt" },
  "/analytics":    { title: "Analytics",                  sub: "Cost, schedule & performance insights" },
  "/intelligence": { title: "Construction Intelligence",  sub: "Blueprint CV · 3D Visualization · Materials Forecasting" },
  "/settings":     { title: "Settings",                   sub: "Account & workspace preferences" },
  "/generate": { title: "Generate Documents",         sub: "RFI responses, delay notices, change order assessments" },
  "/safety":   { title: "Safety Intelligence",         sub: "PPE compliance · Hazard detection · Safety scoring" },
};

export default function Navbar({ appState }: { appState: AppState }) {
  const navigate = useNavigate();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Prism", sub: "" };

  return (
    <header style={{
      height: 52,
      background: "#151b24",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      flexShrink: 0,
      position: "relative",
      zIndex: 10,
    }}>

      {/* Page title */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{
          color: "#f0f4f8",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
        }}>
          {page.title}
        </span>
        {page.sub && (
          <span style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            / {page.sub}
          </span>
        )}
      </div>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* AI Status chip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          background: "rgba(34,211,160,0.08)",
          border: "1px solid rgba(34,211,160,0.15)",
          borderRadius: 100,
        }}>
          <span style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#22d3a0",
            boxShadow: "0 0 6px #22d3a0",
            display: "inline-block",
            animation: "navDot 2.5s ease-in-out infinite",
          }} />
          <span style={{
            color: "#22d3a0",
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}>
            AI ONLINE
          </span>
        </div>

        {/* Bell */}
        <button
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.35)",
            position: "relative",
            transition: "all 200ms ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Notification badge */}
          <span style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#f43f5e",
            border: "1.5px solid #151b24",
          }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

        {/* User section */}
        {appState.user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00a8f0, #0054a0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}>
              {appState.user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {appState.user.name}
            </span>
            <button
              onClick={() => appState.logout()}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(244,63,94,0.2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              logout
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes navDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </header>
  );
}