import { useState } from "react";

type Trend = "up" | "down" | "neutral";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: Trend;
  trendValue?: string;
  icon?: React.ReactNode;
  accent?: "cyan" | "success" | "warning" | "danger";
  loading?: boolean;
}

const accentMap = {
  cyan:    { color: "#00a8f0", glow: "rgba(0,168,240,0.2)",   dim: "rgba(0,168,240,0.08)"   },
  success: { color: "#22d3a0", glow: "rgba(34,211,160,0.2)",  dim: "rgba(34,211,160,0.08)"  },
  warning: { color: "#f59e0b", glow: "rgba(245,158,11,0.2)",  dim: "rgba(245,158,11,0.08)"  },
  danger:  { color: "#f43f5e", glow: "rgba(244,63,94,0.2)",   dim: "rgba(244,63,94,0.08)"   },
};

const trendIcon = (trend: Trend) => {
  if (trend === "up") return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (trend === "down") return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return null;
};

export default function MetricCard({
  label,
  value,
  sub,
  trend = "neutral",
  trendValue,
  icon,
  accent = "cyan",
  loading = false,
}: MetricCardProps) {
  const [hovered, setHovered] = useState(false);
  const a = accentMap[accent];

  const trendColor =
    trend === "up"   ? "#22d3a0" :
    trend === "down" ? "#f43f5e" :
    "rgba(255,255,255,0.3)";

  if (loading) {
    return (
      <div style={{
        background: "#1c2535",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div className="skeleton" style={{ height: 10, width: "50%", marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 28, width: "70%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 10, width: "40%" }} />
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#1c2535",
        border: `1px solid ${hovered ? a.color + "40" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12,
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        transition: "all 250ms cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${a.glow}` : "none",
        cursor: "default",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${a.color}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 250ms ease",
      }} />

      {/* Corner glow */}
      <div style={{
        position: "absolute",
        top: -40, right: -40,
        width: 100, height: 100,
        borderRadius: "50%",
        background: a.glow,
        filter: "blur(30px)",
        opacity: hovered ? 0.6 : 0.2,
        transition: "opacity 350ms ease",
        pointerEvents: "none",
      }} />

      {/* Header row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {label}
        </span>

        {icon && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: a.dim,
            border: `1px solid ${a.color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: a.color,
          }}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: "#f0f4f8",
        letterSpacing: "-0.035em",
        lineHeight: 1,
        marginBottom: 8,
        fontFamily: "'Outfit', sans-serif",
      }}>
        {value}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {sub && (
          <span style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Outfit', sans-serif",
          }}>
            {sub}
          </span>
        )}

        {trendValue && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            fontWeight: 600,
            color: trendColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {trendIcon(trend)}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}