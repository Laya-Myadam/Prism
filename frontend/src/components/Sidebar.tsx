import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText, MessageSquare, GitCompare, Download,
  FolderOpen, LayoutDashboard, Bot, FilePlus,
  AlertTriangle, CheckCircle, Clock
} from "lucide-react";

interface Props {
  mode: "general" | "construction";
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const generalNav: NavItem[] = [
  { label: "Key Insights", path: "/general/insights", icon: <FileText size={15} /> },
  { label: "Ask Anything", path: "/general/ask", icon: <MessageSquare size={15} /> },
  { label: "Compare Docs", path: "/general/compare", icon: <GitCompare size={15} /> },
  { label: "Export Report", path: "/general/export", icon: <Download size={15} /> },
];

const constructionNav: NavItem[] = [
  { label: "Project Setup", path: "/construction/setup", icon: <FolderOpen size={15} /> },
  { label: "Dashboard", path: "/construction/dashboard", icon: <LayoutDashboard size={15} /> },
  { label: "Ask Your Project", path: "/construction/ask", icon: <Bot size={15} /> },
  { label: "Generate Docs", path: "/construction/generate", icon: <FilePlus size={15} /> },
];

export default function Sidebar({ mode }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = mode === "general" ? generalNav : constructionNav;

  return (
    <aside className="w-52 bg-white border-r border-border flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="p-3 flex flex-col gap-1">

        {/* Section label */}
        <div className="section-label px-3 pt-2">
          {mode === "general" ? "Document Intelligence" : "Construction IQ"}
        </div>

        {/* Nav items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={isActive ? "sidebar-item-active" : "sidebar-item"}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    item.badgeColor === "red"
                      ? "bg-red-100 text-red-700"
                      : "bg-prism-100 text-prism-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom info panel */}
      <div className="mt-auto p-3 border-t border-border">
        {mode === "general" ? (
          <div className="bg-surface-secondary rounded-lg p-3 border border-border">
            <div className="text-xs font-semibold text-ink mb-1">Powered by</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-prism-500" />
                <span className="text-xs text-ink-secondary">LLaMA 3.1 via Groq</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs text-ink-secondary">FAISS Vector Search</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-xs text-ink-secondary">BLIP Vision AI</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-secondary rounded-lg p-3 border border-border">
            <div className="text-xs font-semibold text-ink mb-2">System Status</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-green-500" />
                <span className="text-xs text-ink-secondary">AI Engine Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-green-500" />
                <span className="text-xs text-ink-secondary">Groq API Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-ink-tertiary" />
                <span className="text-xs text-ink-tertiary">Response &lt;2s avg</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}