import { useNavigate, useLocation } from "react-router-dom";
import type { AppState } from "../App";

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const navItems: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
        </svg>
      )},
      { path: "/projects", label: "Projects", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M3 7c0-1.1.9-2 2-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.7"/>
        </svg>
      )},
      { path: "/analytics", label: "Analytics", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M3 20l4-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )},
    ]
  },
  {
    group: "PROJECT TOOLS",
    items: [
      { path: "/documents", label: "Documents", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      )},
      { path: "/generate", label: "Generate Docs", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M12 18v-6M9 15l3 3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), badge: "AI" },
      { path: "/workforce", label: "Workforce", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      )},
      { path: "/scheduling", label: "Scheduling", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      )},
    ]
  },
  {
    group: "AI INTELLIGENCE",
    items: [
      { path: "/intelligence", label: "Intelligence", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), badge: "AI" },
      { path: "/safety", label: "Safety AI", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), badge: "AI" },
    ]
  },
  {
    group: "ACCOUNT",
    items: [
      { path: "/settings", label: "Settings", icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke="currentColor" strokeWidth="1.7"/>
        </svg>
      )},
    ]
  }
];

export default function Sidebar({ appState }: { appState: AppState }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside style={{
      width: 216,
      minWidth: 216,
      background: "#151b24",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: "100vh",
      overflowY: "auto",
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: "18px 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, #00a8f0, #0054a0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(0,168,240,0.3)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{
              color: "#f0f4f8",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              PRISM
            </div>
            <div style={{
              color: "rgba(0,168,240,0.7)",
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.12em",
              marginTop: 2,
            }}>
              CONSTRUCTION
            </div>
          </div>
        </div>

        {/* Active project chip */}
        {appState.projectName && (
          <div style={{
            marginTop: 12,
            padding: "7px 10px",
            background: "rgba(0,168,240,0.07)",
            border: "1px solid rgba(0,168,240,0.15)",
            borderRadius: 8,
          }}>
            <div style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              marginBottom: 3,
            }}>
              ACTIVE PROJECT
            </div>
            <div style={{
              color: "#38bfff",
              fontSize: 12,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {appState.projectName}
            </div>
          </div>
        )}
      </div>

      {/* ── Nav groups ── */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {navItems.map(group => (
          <div key={group.group} style={{ marginBottom: 22 }}>
            <div style={{
              color: "rgba(255,255,255,0.18)",
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.12em",
              padding: "0 8px",
              marginBottom: 4,
              userSelect: "none",
            }}>
              {group.group}
            </div>

            {group.items.map(item => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: active ? "1px solid rgba(0,168,240,0.2)" : "1px solid transparent",
                    cursor: "pointer",
                    background: active ? "rgba(0,168,240,0.1)" : "transparent",
                    color: active ? "#38bfff" : "rgba(255,255,255,0.38)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all 150ms ease",
                    textAlign: "left",
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)";
                    }
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: "rgba(0,168,240,0.15)",
                      color: "#38bfff",
                      fontSize: 9,
                      padding: "2px 5px",
                      borderRadius: 4,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.04em",
                      fontWeight: 600,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      {appState.user && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
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
              flexShrink: 0,
            }}>
              {appState.user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{
                color: "#f0f4f8",
                fontSize: 12,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}>
                {appState.user.name}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 1,
              }}>
                {appState.user.role}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}