import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createSession } from "./api/client";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AICopilot from "./components/AICopilot";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/construction/Dashboard";
import Projects from "./pages/construction/Projects";
import Documents from "./pages/construction/Documents";
import Workforce from "./pages/construction/Workforce";
import Scheduling from "./pages/construction/Scheduling";
import Analytics from "./pages/construction/Analytics";
import Intelligence from "./pages/construction/Intelligence";
import Settings from "./pages/construction/Settings";
import GenerateDocs from "./pages/construction/GenerateDocs";
import Safety from "./pages/construction/Safety";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  company: string;
  role: string;
};

export type AppState = {
  sessionId: string;
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  uploadedFile: string | null;
  setUploadedFile: (f: string | null) => void;
  uploadedFileB: string | null;
  setUploadedFileB: (f: string | null) => void;
  projectBuilt: boolean;
  setProjectBuilt: (b: boolean) => void;
  projectName: string;
  setProjectName: (n: string) => void;
  activeProject: string | null;
  setActiveProject: (p: string | null) => void;
  domain: string;
  setDomain: (d: string) => void;
  setMode: (m: string) => void;
  logout: () => void;
};

function ProtectedRoute({ user, authReady, children }: { user: AppUser | null; authReady: boolean; children: React.ReactNode }) {
  if (!authReady) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f1319" }}>
      <div style={{ width:32, height:32, border:"3px solid rgba(0,168,240,0.2)", borderTopColor:"#00a8f0", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppShell({ appState }: { appState: AppState }) {
  return (
    <div style={{ display:"flex", height:"100vh", background:"#0f1319", overflow:"hidden" }}>
      <Sidebar appState={appState} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Navbar appState={appState} />
        <main style={{ flex:1, overflow:"auto" }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard appState={appState} />} />
            <Route path="/projects" element={<Projects appState={appState} />} />
            <Route path="/documents" element={<Documents appState={appState} />} />
            <Route path="/workforce" element={<Workforce appState={appState} />} />
            <Route path="/scheduling" element={<Scheduling appState={appState} />} />
            <Route path="/analytics" element={<Analytics appState={appState} />} />
            <Route path="/intelligence" element={<Intelligence appState={appState} />} />
            <Route path="/safety" element={<Safety appState={appState} />} />
            <Route path="/settings" element={<Settings appState={appState} />} />
            <Route path="/generate" element={<GenerateDocs appState={appState} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <AICopilot appState={appState} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileB, setUploadedFileB] = useState<string | null>(null);
  const [projectBuilt, setProjectBuilt] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [domain, setDomain] = useState("Auto Detect");

  useEffect(() => {
    const stored = localStorage.getItem("prism_dummy_user");
    if (stored) {
      try {
        const parsed: AppUser = JSON.parse(stored);
        setUser(parsed);

        const sessionKey = `prism_session_${parsed.uid}`;
        const existing = localStorage.getItem(sessionKey);
        if (existing) {
          setSessionId(existing);
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/construction/dashboard/${existing}`)
            .then(r => r.json())
            .then(d => {
              if (d?.facts?.project_name) {
                setProjectBuilt(true);
                setProjectName(d.facts.project_name);
              }
            })
            .catch(() => {});
        } else {
          createSession().then(id => {
            setSessionId(id);
            localStorage.setItem(sessionKey, id);
          });
        }
      } catch {
        localStorage.removeItem("prism_dummy_user");
      }
    }
    setAuthReady(true);
  }, []);

  const setUserAndPersist = (u: AppUser | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("prism_dummy_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("prism_dummy_user");
    }
  };

  const logout = () => {
    localStorage.removeItem("prism_dummy_user");
    setUser(null);
    setProjectBuilt(false);
    setProjectName("");
    setSessionId("");
  };

  const appState: AppState = {
    sessionId, user, setUser: setUserAndPersist,
    uploadedFile, setUploadedFile,
    uploadedFileB, setUploadedFileB,
    projectBuilt, setProjectBuilt,
    projectName, setProjectName,
    activeProject, setActiveProject,
    domain, setDomain,
    setMode: () => {},
    logout,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          authReady && user ? <Navigate to="/dashboard" replace /> : <Login onLogin={u => { setUser(u); createSession().then(id => { setSessionId(id); localStorage.setItem(`prism_session_${u.uid}`, id); }); }} />
        } />
        <Route path="/*" element={
          <ProtectedRoute user={user} authReady={authReady}>
            <AppShell appState={appState} />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
