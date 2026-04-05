import { useNavigate, useLocation } from "react-router-dom";
import type { AppState } from "../App";

interface Props {
  appState: AppState;
}

export default function Navbar({ appState }: Props) {
  const { mode, setMode, setUploadedFile, setUploadedFileB, setProjectBuilt, setProjectName } = appState;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    setMode(null);
    setUploadedFile(null);
    setUploadedFileB(null);
    setProjectBuilt(false);
    setProjectName("");
    navigate("/");
  };

  const isConstruction = mode === "construction";
  const isGeneral = mode === "general";

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-50">
      {/* Left — Logo */}
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 bg-prism-700 rounded-lg flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.2"/>
            <path d="M7 1L13 4.5L7 8L1 4.5L7 1Z" fill="white"/>
          </svg>
        </div>
        <span className="text-base font-semibold text-ink tracking-tight">Prism</span>
      </button>

      {/* Center — Mode indicator */}
      {mode && (
        <div className="flex items-center gap-1 bg-surface-secondary border border-border rounded-lg p-1">
          <button
            onClick={() => {
              setMode("general");
              navigate("/general/insights");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isGeneral
                ? "bg-white text-ink shadow-card border border-border"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            General Mode
          </button>
          <button
            onClick={() => {
              setMode("construction");
              navigate("/construction/setup");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              isConstruction
                ? "bg-white text-ink shadow-card border border-border"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Construction Mode
          </button>
        </div>
      )}

      {/* Right — Status + session */}
      <div className="flex items-center gap-3">
        {mode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-prism-50 border border-prism-200">
            <div className="live-dot" />
            <span className="text-xs font-medium text-prism-700">AI Active</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="text-xs text-ink-tertiary font-mono hidden sm:block">
            {appState.sessionId.slice(0, 8)}
          </div>
          <div className="w-7 h-7 rounded-full bg-prism-700 flex items-center justify-center text-white text-xs font-semibold">
            P
          </div>
        </div>
      </div>
    </header>
  );
}