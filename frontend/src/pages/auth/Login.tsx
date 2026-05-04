import { useNavigate } from "react-router-dom";
import type { AppUser } from "../../App";

const DUMMY_USERS = [
  {
    uid: "dummy-pm-001",
    name: "Marcus Rivera",
    email: "marcus@prism.build",
    company: "Hardrock General Contracting",
    role: "Project Manager",
    color: "linear-gradient(135deg,#00a8f0,#0054a0)",
    glow: "rgba(0,168,240,0.3)",
    accent: "#00a8f0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
    description: "Full platform access · Project oversight · Risk management",
  },
  {
    uid: "dummy-se-002",
    name: "Sarah Kim",
    email: "sarah@prism.build",
    company: "Hardrock General Contracting",
    role: "Site Engineer",
    color: "linear-gradient(135deg,#10b981,#065f46)",
    glow: "rgba(16,185,129,0.3)",
    accent: "#10b981",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    description: "Blueprint analysis · Field reporting · Schedule tracking",
  },
  {
    uid: "dummy-qs-003",
    name: "Ahmed Hassan",
    email: "ahmed@prism.build",
    company: "Hardrock General Contracting",
    role: "Quantity Surveyor",
    color: "linear-gradient(135deg,#f59e0b,#92400e)",
    glow: "rgba(245,158,11,0.3)",
    accent: "#f59e0b",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 20l4-8 4 4 4-6 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 4h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    description: "Cost forecasting · Valuations · Change order analysis",
  },
  {
    uid: "dummy-so-004",
    name: "Priya Nair",
    email: "priya@prism.build",
    company: "Hardrock General Contracting",
    role: "Safety Officer",
    color: "linear-gradient(135deg,#f43f5e,#881337)",
    glow: "rgba(244,63,94,0.3)",
    accent: "#f43f5e",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    description: "PPE compliance · Hazard detection · Safety scoring",
  },
];

export default function Login({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const navigate = useNavigate();

  const handleSelect = (user: typeof DUMMY_USERS[0]) => {
    const { icon: _icon, color, glow, accent, description, ...userData } = user;
    localStorage.setItem("prism_dummy_user", JSON.stringify(userData));
    onLogin(userData);
    navigate("/dashboard");
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0f1319", display:"flex", fontFamily:"'Outfit',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes aiDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .login-card { transition: all 220ms ease; cursor: pointer; }
        .login-card:hover { transform: translateY(-3px); }
      `}</style>

      {/* Ambient bg */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"5%", left:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,90,160,0.15) 0%,transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", bottom:"0%", right:"10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,168,240,0.08) 0%,transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px", position:"relative", zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48, animation:"fadeUp 0.5s ease forwards" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#00a8f0,#0054a0)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(0,168,240,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color:"#f0f4f8", fontSize:22, fontWeight:800, letterSpacing:"-0.03em", lineHeight:1 }}>PRISM</div>
            <div style={{ color:"rgba(0,168,240,0.6)", fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.14em", marginTop:2 }}>CONSTRUCTION INTELLIGENCE</div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign:"center", marginBottom:48, animation:"fadeUp 0.5s 0.1s ease forwards", opacity:0 }}>
          <h1 style={{ fontSize:32, fontWeight:800, color:"#f0f4f8", letterSpacing:"-0.03em", marginBottom:10 }}>Select your role</h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.35)", maxWidth:420 }}>
            Choose a demo profile to explore Prism with a tailored workspace experience.
          </p>
        </div>

        {/* Role cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16, maxWidth:720, width:"100%", animation:"fadeUp 0.5s 0.2s ease forwards", opacity:0 }}>
          {DUMMY_USERS.map((user) => (
            <div
              key={user.uid}
              className="login-card"
              onClick={() => handleSelect(user)}
              style={{
                background:"rgba(21,27,36,0.9)",
                border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:16,
                padding:"28px 24px",
                display:"flex",
                flexDirection:"column",
                gap:16,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.border = `1px solid ${user.accent}44`;
                el.style.background = "rgba(21,27,36,0.98)";
                el.style.boxShadow = `0 0 32px ${user.glow}`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.border = "1px solid rgba(255,255,255,0.08)";
                el.style.background = "rgba(21,27,36,0.9)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Avatar + name */}
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:user.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0, boxShadow:`0 4px 16px ${user.glow}` }}>
                  {user.icon}
                </div>
                <div>
                  <div style={{ color:"#f0f4f8", fontSize:15, fontWeight:700, letterSpacing:"-0.02em" }}>{user.name}</div>
                  <div style={{ color:user.accent, fontSize:11, fontFamily:"'JetBrains Mono',monospace", marginTop:3, fontWeight:500 }}>{user.role}</div>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>{user.description}</div>

              {/* Enter button */}
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize:11, color:user.accent, fontFamily:"'JetBrains Mono',monospace", fontWeight:600, letterSpacing:"0.04em" }}>
                  ENTER →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:48, animation:"fadeUp 0.5s 0.35s ease forwards", opacity:0 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#22d3a0", boxShadow:"0 0 8px #22d3a0", display:"inline-block", animation:"aiDot 2.5s ease-in-out infinite" }}/>
          <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.2)", letterSpacing:"0.08em" }}>
            AI systems online · Demo mode
          </span>
        </div>
      </div>
    </div>
  );
}
