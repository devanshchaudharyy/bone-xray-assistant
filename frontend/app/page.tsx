"use client";

import React, { useState, useEffect } from "react";

interface AnalysisResult {
  anatomical_region?: string;
  quality?: string;
  confidence_score?: string;
  suspected_anomalies?: string[];
  findings?: string;
  error?: string;
  disclaimer?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [health, setHealth] = useState<{ status: string; ollama_active: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"workspace" | "docs" | "about">("workspace");

  // Poll backend status
  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: "offline", ollama_active: false }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      alert("Failed to reach FastAPI backend on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!userQuery.trim()) return;

    const newMsg: ChatMessage = { role: "user", content: userQuery };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setUserQuery("");
    setChatLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: userQuery,
          chat_history: chatHistory,
          image_analysis: analysis,
        }),
      });
      const data = await res.json();
      setChatHistory([...updatedHistory, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatHistory([...updatedHistory, { role: "assistant", content: "Error communicating with AI agent." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Top Professional Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/90 border-b border-slate-800/80 backdrop-blur-xl px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Meta */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              🦴
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-lg">RadVision AI</span>
                <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                  v1.0 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Orthopedic Radiography Suite</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "workspace"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "docs"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              API Docs
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "about"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              System Info
            </button>
          </nav>

          {/* System Health Badge */}
          <div className="flex items-center gap-2 text-xs bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 font-medium">Vision Engine:</span>
            {health?.ollama_active ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Ollama Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                Fallback Mode
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Viewport */}
      <div className="max-w-7xl w-full mx-auto p-6 my-auto">
        {activeTab === "workspace" && (
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. File Upload Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    1. Import Radiograph
                  </h2>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                    PNG / JPG
                  </span>
                </div>

                <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-4 text-center transition-colors bg-slate-950/40 mb-4">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                </div>

                {previewUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-800 bg-black/60 p-2">
                    <img src={previewUrl} alt="Active Scan" className="w-full object-contain max-h-64 rounded-lg" />
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Executing Neural Segmentation...
                    </>
                  ) : (
                    "🚀 Run Vision Pipeline"
                  )}
                </button>
              </div>
            </div>

            {/* 2. Analytics & 3. Clinical Assistant */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Analytics Output */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Vision Analytics
                </h2>

                {analysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#0B0F19] border border-slate-800/80 p-3 rounded-xl shadow-md">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Anatomy</div>
                        <div className="text-xs font-extrabold text-slate-100 mt-1 truncate">{analysis.anatomical_region || "N/A"}</div>
                      </div>
                      <div className="bg-[#0B0F19] border border-slate-800/80 p-3 rounded-xl shadow-md">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Quality</div>
                        <div className="text-xs font-extrabold text-slate-100 mt-1 truncate">{analysis.quality || "N/A"}</div>
                      </div>
                      <div className="bg-[#0B0F19] border border-slate-800/80 p-3 rounded-xl shadow-md">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence</div>
                        <div className="text-xs font-extrabold text-slate-100 mt-1 truncate">{analysis.confidence_score || "N/A"}</div>
                      </div>
                    </div>

                    <div className="bg-[#0B0F19] border border-slate-800/80 p-4 rounded-xl shadow-md">
                      <div className="text-xs font-semibold text-slate-400 mb-2">Identified Indications:</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.suspected_anomalies && analysis.suspected_anomalies.length > 0 ? (
                          analysis.suspected_anomalies.map((item, idx) => (
                            <span key={idx} className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              🚨 {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            ✓ No acute structural fractures detected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#0B0F19] border border-slate-800/80 p-4 rounded-xl shadow-md">
                      <div className="text-xs font-semibold text-slate-400 mb-2">Radiology Narrative Summary:</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysis.findings || "No narrative generated."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0B0F19]/40 border border-dashed border-slate-800/80 rounded-2xl p-10 text-center text-slate-500 text-xs">
                    Upload a radiograph scan in the left panel and click <b>Run Vision Pipeline</b> to view structural findings.
                  </div>
                )}
              </div>

              {/* Chat Viewport */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Clinical Assistant
                </h2>

                <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4 h-[420px] flex flex-col justify-between shadow-xl">
                  <div className="overflow-y-auto space-y-3 pr-2 text-xs">
                    {chatHistory.length === 0 && (
                      <p className="text-slate-500 text-center mt-32 leading-relaxed">
                        Ask questions regarding joint alignment, fracture severity, or rehabilitation protocols.
                      </p>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl leading-relaxed ${
                          msg.role === "user"
                            ? "bg-blue-600/20 border border-blue-500/30 ml-6 text-slate-100"
                            : "bg-slate-900 border border-slate-800 mr-6 text-slate-300"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="text-slate-500 text-xs animate-pulse">Consulting medical agent...</div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-800/80">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Ask a follow-up query..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={chatLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </main>
        )}

        {/* API Docs Tab */}
        {activeTab === "docs" && (
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-8 max-w-3xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-white">FastAPI Endpoints Reference</h2>
            <p className="text-xs text-slate-400">Your local backend server exposes the following REST endpoints:</p>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <span className="text-emerald-400 font-bold">GET</span> /api/health — Checks server & Ollama connectivity.
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <span className="text-blue-400 font-bold">POST</span> /api/analyze — Accepts radiograph image uploads and returns JSON vision findings.
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <span className="text-purple-400 font-bold">POST</span> /api/chat — Context-aware follow-up clinical dialogue endpoint.
              </div>
            </div>
          </div>
        )}

        {/* System Info Tab */}
        {activeTab === "about" && (
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto space-y-4 text-xs text-slate-300">
            <h2 className="text-lg font-bold text-white">System Specifications</h2>
            <p>
              RadVision AI operates on a local multimodal architecture designed to preserve patient data privacy by executing vision tensor analysis strictly on-device.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><b>Frontend Stack:</b> Next.js 14, React, Tailwind CSS</li>
              <li><b>Backend Server:</b> Python FastAPI with Uvicorn worker</li>
              <li><b>Vision Inference Model:</b> Ollama (LLaVA local model)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Production-Grade Footer with Disclaimer & Author Attribution */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Medical Disclaimer Banner */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 text-amber-400/90 text-[11px] leading-relaxed flex items-start gap-3">
            <span className="text-base">⚠️</span>
            <div>
              <b>MANDATORY MEDICAL DISCLAIMER:</b> RadVision AI is an experimental computer-vision decision-support prototype. It is NOT a certified medical diagnostic device. All findings, anatomical labels, and anomaly detections generated by this platform must be independently reviewed and verified by a licensed medical practitioner or radiologist before clinical reliance.
            </div>
          </div>

          {/* Copyright & Author Info */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800/50">
            <div>
              © 2026 <b>RadVision AI</b>. All rights reserved.
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span>Maintained & Developed by</span>
              <span className="text-blue-400 font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                Devansh
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}