import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min — LLM calls can be slow
});

// ─────────────────────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────────────────────

export const createSession = async (): Promise<string> => {
  const res = await api.post("/session/new");
  return res.data.session_id;
};

export const clearSession = async (sessionId: string): Promise<void> => {
  await api.delete(`/session/${sessionId}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL MODE
// ─────────────────────────────────────────────────────────────────────────────

export const uploadDocument = async (
  sessionId: string,
  file: File,
  domainOverride: string = "Auto Detect"
) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("file", file);
  form.append("domain_override", domainOverride);
  const res = await api.post("/general/upload", form);
  return res.data;
};

export const uploadDocumentB = async (sessionId: string, file: File) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("file", file);
  const res = await api.post("/general/upload-b", form);
  return res.data;
};

export const extractInsights = async (
  sessionId: string,
  domain: string = "Auto Detect"
) => {
  const res = await api.post("/general/insights", {
    session_id: sessionId,
    domain,
  });
  return res.data;
};

export const askDocument = async (sessionId: string, question: string) => {
  const res = await api.post("/general/ask", {
    session_id: sessionId,
    question,
  });
  return res.data;
};

export const compareDocuments = async (sessionId: string, topic: string) => {
  const res = await api.post("/general/compare", {
    session_id: sessionId,
    topic,
  });
  return res.data;
};

export const exportReport = async (sessionId: string): Promise<Blob> => {
  const res = await api.post(
    "/general/export",
    { session_id: sessionId },
    { responseType: "blob" }
  );
  return res.data;
};

export const clearGeneralChat = async (sessionId: string) => {
  const res = await api.post("/general/clear-chat", {
    session_id: sessionId,
    question: "",
  });
  return res.data;
};

// ── RFI ───────────────────────────────────────────────────────────────────────

export const uploadRFIProject = async (sessionId: string, files: File[]) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  files.forEach((f) => form.append("files", f));
  const res = await api.post("/general/rfi/upload-project", form);
  return res.data;
};

export const answerRFI = async (
  sessionId: string,
  rfi: {
    rfi_number: string;
    subject: string;
    question: string;
    drawing_ref?: string;
    spec_ref?: string;
    submitted_by?: string;
  }
) => {
  const res = await api.post("/general/rfi/answer", {
    session_id: sessionId,
    ...rfi,
  });
  return res.data;
};

export const getRFILog = async (sessionId: string) => {
  const res = await api.get(`/general/rfi/log/${sessionId}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTION MODE
// ─────────────────────────────────────────────────────────────────────────────

export const uploadAndClassify = async (
  sessionId: string,
  files: File[]
) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  files.forEach((f) => form.append("files", f));
  const res = await api.post("/construction/upload-classify", form);
  return res.data;
};

export const buildProject = async (
  sessionId: string,
  classifiedDocs: any[]
) => {
  const res = await api.post("/construction/build-project", {
    session_id: sessionId,
    classified_docs: classifiedDocs,
  });
  return res.data;
};

export const getDashboard = async (sessionId: string) => {
  const res = await api.get(`/construction/dashboard/${sessionId}`);
  return res.data;
};

export const askProject = async (sessionId: string, question: string) => {
  const res = await api.post("/construction/ask", {
    session_id: sessionId,
    question,
  });
  return res.data;
};

export const clearConstructionChat = async (sessionId: string) => {
  const res = await api.post("/construction/clear-chat", {
    session_id: sessionId,
    question: "",
  });
  return res.data;
};

export const generateDocument = async (
  sessionId: string,
  docType: string,
  formData: Record<string, any>
) => {
  const res = await api.post("/construction/generate", {
    session_id: sessionId,
    doc_type: docType,
    form_data: formData,
  });
  return res.data;
};

export const getGeneratedDocs = async (sessionId: string) => {
  const res = await api.get(`/construction/generated-docs/${sessionId}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadResult {
  status: string;
  filename: string;
  domain: string;
  text_chunks: number;
  image_count: number;
}

export interface InsightsResult {
  insights: Record<string, string>;
  domain: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskResult {
  answer: string;
  chat_history: ChatMessage[];
}

export interface CompareResult {
  doc_a: string;
  doc_b: string;
  doc_a_summary: string;
  doc_b_summary: string;
  comparison: string;
}

export interface RFIResult {
  rfi_number: string;
  subject: string;
  response: string;
  citations: string[];
  confidence: string;
}

export interface ClassifiedDoc {
  filename: string;
  path: string;
  doc_type: string;
  icon: string;
  confidence: string;
}

export interface ProjectFacts {
  project_name: string | null;
  project_value: string | null;
  owner: string | null;
  general_contractor: string | null;
  architect: string | null;
  start_date: string | null;
  completion_date: string | null;
  liquidated_damages: string | null;
  retention: string | null;
  project_location: string | null;
}

export interface Risk {
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  source: string;
}

export interface ScheduleHealth {
  status: "On Track" | "At Risk" | "Delayed" | "Unknown";
  summary: string;
  days_ahead_behind: string;
  critical_activities: string[];
}

export interface ProjectStats {
  total_documents: number;
  contracts: number;
  drawings: number;
  specs: number;
  daily_reports: number;
  rfis: number;
  change_orders: number;
  inspections: number;
}

export interface Dashboard {
  facts: ProjectFacts;
  stats: ProjectStats;
  risks: Risk[];
  schedule_health: ScheduleHealth;
}

export interface GeneratedDoc {
  type: string;
  content: string;
  form_data: Record<string, any>;
}