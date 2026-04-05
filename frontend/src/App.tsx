import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createSession } from "./api/client";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import KeyInsights from "./pages/general/KeyInsights";
import AskAnything from "./pages/general/AskAnything";
import Compare from "./pages/general/Compare";
import Export from "./pages/general/Export";
import Setup from "./pages/construction/Setup";
import Dashboard from "./pages/construction/Dashboard";
import AskProject from "./pages/construction/AskProject";
import GenerateDocs from "./pages/construction/GenerateDocs";

export type Mode = "general" | "construction" | null;

export type AppState = {
  sessionId: string;
  mode: Mode;
  setMode: (m: Mode) => void;
  uploadedFile: string | null;
  setUploadedFile: (f: string | null) => void;
  domain: string;
  setDomain: (d: string) => void;
  uploadedFileB: string | null;
  setUploadedFileB: (f: string | null) => void;
  projectBuilt: boolean;
  setProjectBuilt: (b: boolean) => void;
  projectName: string;
  setProjectName: (n: string) => void;
};

export default function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [mode, setMode] = useState<Mode>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileB, setUploadedFileB] = useState<string | null>(null);
  const [domain, setDomain] = useState<string>("General");
  const [projectBuilt, setProjectBuilt] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createSession().then((id) => {
      setSessionId(id);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-border border-t-prism-600 rounded-full animate-spin" />
          <p className="text-sm text-ink-secondary font-medium">Starting Prism...</p>
        </div>
      </div>
    );
  }

  const appState: AppState = {
    sessionId,
    mode,
    setMode,
    uploadedFile,
    setUploadedFile,
    domain,
    setDomain,
    uploadedFileB,
    setUploadedFileB,
    projectBuilt,
    setProjectBuilt,
    projectName,
    setProjectName,
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-secondary flex flex-col">
        <Navbar appState={appState} />
        <div className="flex flex-1 overflow-hidden">
          {mode && <Sidebar mode={mode} />}
          <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
            <Routes>
              <Route path="/" element={<Home appState={appState} />} />
              <Route path="/general/insights" element={<KeyInsights appState={appState} />} />
              <Route path="/general/ask" element={<AskAnything appState={appState} />} />
              <Route path="/general/compare" element={<Compare appState={appState} />} />
              <Route path="/general/export" element={<Export appState={appState} />} />
              <Route path="/construction/setup" element={<Setup appState={appState} />} />
              <Route path="/construction/dashboard" element={<Dashboard appState={appState} />} />
              <Route path="/construction/ask" element={<AskProject appState={appState} />} />
              <Route path="/construction/generate" element={<GenerateDocs appState={appState} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}