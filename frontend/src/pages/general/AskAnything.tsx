import { useState, useRef, useEffect } from "react";
import type { AppState } from "../../App";
import {
  Send, Trash2, FileText, Bot,
  Loader2, AlertCircle, Lightbulb
} from "lucide-react";
import { askDocument, clearGeneralChat } from "../../api/client";
import type { ChatMessage } from "../../api/client";
interface Props { appState: AppState; }

const EXAMPLE_QUESTIONS = [
  "What are the key terms and conditions?",
  "What happens if the contract is breached?",
  "Who are the parties involved?",
  "What are the payment terms?",
  "What are the termination conditions?",
  "Summarize the main obligations of each party.",
];

export default function AskAnything({ appState }: Props) {
  const { sessionId, uploadedFile } = appState;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await askDocument(sessionId, question);
      setMessages(res.chat_history);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to get answer.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = async () => {
    await clearGeneralChat(sessionId);
    setMessages([]);
    setError(null);
  };

  if (!uploadedFile) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Ask Anything</h1>
            <p className="page-sub">Ask questions about your document in plain English.</p>
          </div>
        </div>
        <div className="empty-state mt-16">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-title">No document uploaded yet</div>
          <div className="empty-state-sub">Upload a PDF in Key Insights first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in flex flex-col h-full">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ask Anything</h1>
          <p className="page-sub">Ask questions about your document. Answers include confidence scoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-prism-50 border border-prism-200 rounded-lg">
            <FileText size={13} className="text-prism-600" />
            <span className="text-xs font-medium text-prism-700 max-w-36 truncate">{uploadedFile}</span>
          </div>
          {messages.length > 0 && (
            <button onClick={handleClear} className="btn-ghost text-xs gap-1.5">
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Example questions */}
      {messages.length === 0 && (
        <div className="card mb-5">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-500" />
              <span className="card-title">Example questions</span>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2.5 rounded-lg border border-border
                             text-xs text-ink-secondary bg-surface-secondary
                             hover:border-prism-300 hover:bg-prism-50 hover:text-ink
                             transition-all duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-4 mb-5 flex-1 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-prism-700 flex items-center
                                justify-center flex-shrink-0 mt-1">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={msg.role === "user" ? "bubble-user" : "bubble-ai"}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-prism-700 flex items-center
                              justify-center flex-shrink-0 mt-1">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bubble-ai flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-ink-tertiary" />
                <span className="text-ink-tertiary text-xs">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <div className="alert-error mb-4">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input */}
      <div className="card mt-auto">
        <div className="card-body">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your document... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="textarea flex-1 resize-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : <Send size={15} />
              }
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-ink-tertiary">
              Powered by LLaMA 3.1 · MMR retrieval · Confidence scoring
            </span>
            <span className="text-xs text-ink-tertiary font-mono">
              {messages.length} messages
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}