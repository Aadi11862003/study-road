import React, { useState, useRef } from "react";
import axios from "axios";
import "./AIAssistant.css";

export default function AIAssistant() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [history, setHistory] = useState([]); // {q, a}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const replyRef = useRef(null);

  const quickPrompts = [
    "Summarize React in 2 sentences.",
    "3-step checklist to debug an API call.",
    "Explain OAuth briefly in 3 bullets.",
    "What's the difference between var, let, const?",
  ];

  const ask = async (ev) => {
    ev?.preventDefault();
    setError("");
    const question = prompt.trim();
    if (!question) return setError("Write a question first.");

    setLoading(true);
    setReply("");
    try {
      const res = await axios.post("http://localhost:5000/api/assist", { answer: question });
      const answer = res.data?.answer || "No answer received.";
      setReply(answer);
      setHistory((h) => [{ q: question, a: answer }, ...h]);
      setPrompt("");
      // scroll into view
      setTimeout(() => replyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (text) => {
    setPrompt(text);
  };

  const copyReply = async () => {
    if (!reply) return;
    await navigator.clipboard.writeText(reply);
    // small visual feedback (optional)
  };

  const clearHistory = () => {
    setHistory([]);
    setReply("");
    setError("");
  };

  return (
    <div className="ai-assistant-shell">
      <aside className="ai-sidebar">
        <div className="brand">
          <div className="logo">AI</div>
          <div>
            <h3>Precise Assistant</h3>
            <p className="muted">Short & accurate answers</p>
          </div>
        </div>

        <div className="history-header">
          <span>Recent</span>
          <button className="small-ghost" onClick={clearHistory} title="Clear history">Clear</button>
        </div>

        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty">No recent questions yet.</div>
          ) : (
            history.map((item, idx) => (
              <button
                key={idx}
                className="history-item"
                onClick={() => {
                  setPrompt(item.q);
                  setReply(item.a);
                }}
                title="Load this Q/A"
              >
                <div className="h-q">{item.q}</div>
                <div className="h-a">{item.a.slice(0, 80)}{item.a.length>80?"…":""}</div>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-footer muted">
          Tip: use quick prompts to test faster.
        </div>
      </aside>

      <main className="ai-main">
        <form className="prompt-form" onSubmit={ask}>
          <textarea
            className="prompt-input"
            placeholder="Ask anything — answers will be concise and precise"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            aria-label="Assistant question"
          />
          <div className="form-row">
            <div className="quick-row">
              {quickPrompts.map((q) => (
                <button key={q} type="button" onClick={() => handleQuick(q)} className="quick-chip">
                  {q}
                </button>
              ))}
            </div>

            <div className="controls">
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  setPrompt("");
                  setError("");
                }}
              >
                Clear
              </button>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Thinking…" : "Ask"}
              </button>
            </div>
          </div>
        </form>

        <section className="result-area">
          {error && <div className="error">{error}</div>}

          <div className="response-card" ref={replyRef}>
            <div className="response-head">
              <h4>Answer</h4>
              <div className="response-actions">
                <button
                  className="icon-btn"
                  onClick={() => {
                    if (reply) copyReply();
                  }}
                  title="Copy answer"
                >
                  ⧉
                </button>
              </div>
            </div>

            <div className="response-content">
              {loading ? (
                <div className="loader-row">
                  <div className="dot" /> <div className="dot" /> <div className="dot" />
                </div>
              ) : (
                <pre className="reply-text">{reply || "Ask a question to see a concise answer."}</pre>
              )}
            </div>
          </div>

          {/* <div className="explain-muted">
            {/* The assistant is instructed to answer in 1–4 short sentences. If unsure it will say so and suggest verification.
          </div> */} 
        </section>
      </main>

      {/* Floating help button + modal */}
      <div className="floating-help">
        <button className="help-btn" onClick={() => setShowHelp(true)} aria-label="Help">
          ?
        </button>

        {showHelp && (
          <div className="help-panel" role="dialog" aria-modal="true">
            <div className="help-top">
              <h4>How to get best answers</h4>
              <button className="icon-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>

            <div className="help-body">
              <ul>
                <li>Be specific: include context (e.g., "in React 18").</li>
                <li>Ask for format if needed: "Give 3 bullets" or "2-sentence summary".</li>
                <li>For factual claims ask: "Provide sources" — the assistant will suggest ways to verify.</li>
                <li>Use quick prompts for common tasks.</li>
              </ul>
            </div>

            <div className="help-footer">
              <button className="btn-primary" onClick={() => setShowHelp(false)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
