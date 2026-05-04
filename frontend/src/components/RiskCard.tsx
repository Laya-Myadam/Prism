interface Risk {
  level: "high" | "medium" | "low";
  title: string;
  category?: string;
  detail?: string;
}

interface Props {
  risk: Risk;
}

const colors = {
  high:   { dot:"#f43f5e", glow:"0 0 6px #f43f5e", badge:"rgba(244,63,94,0.1)",  text:"#f43f5e",  border:"rgba(244,63,94,0.2)"  },
  medium: { dot:"#f59e0b", glow:"none",              badge:"rgba(245,158,11,0.1)", text:"#f59e0b",  border:"rgba(245,158,11,0.2)" },
  low:    { dot:"#22d3a0", glow:"none",              badge:"rgba(34,211,160,0.1)", text:"#22d3a0",  border:"rgba(34,211,160,0.2)" },
};

export default function RiskCard({ risk }: Props) {
  const c = colors[risk.level];
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background:c.dot, boxShadow:c.glow, flexShrink:0, marginTop:5 }}/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.4 }}>{risk.title}</div>
        {risk.detail && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3, lineHeight:1.5 }}>{risk.detail}</div>}
      </div>
      {risk.category && (
        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontFamily:"'JetBrains Mono',monospace", background:c.badge, color:c.text, border:`1px solid ${c.border}`, flexShrink:0 }}>
          {risk.category}
        </span>
      )}
    </div>
  );
}