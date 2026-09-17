"use client";

import React, { useEffect, useState, useRef, useSyncExternalStore } from "react";

interface UserSession {
  full_name: string;
  email: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

export default function WorkspacePage() {
  const [user] = useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;

    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Analysis & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);

  // Assistant Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.replace("/login");
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Analysis Error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    const updatedHistory = [...chatHistory, { role: "user", content: userMessage }];
    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: userMessage,
          chat_history: updatedHistory,
          image_analysis: analysisResult,
        }),
      });
      const data = await res.json();
      setChatHistory([...updatedHistory, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Prevent SSR/Client HTML Mismatch during initial hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070A11] text-slate-100 flex items-center justify-center font-sans">
        <p className="text-xs text-slate-400 animate-pulse">Loading RadVision AI Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
            🦴
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">RadVision AI Workspace</h1>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                V1.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Orthopedic Radiography Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-200">
              Dr. <span className="text-white">{user?.full_name}</span>
            </p>
            <p className="text-[10px] text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Workspace Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] w-full mx-auto">
        {/* Panel 1: Import Radiograph */}
        <section className="lg:col-span-4 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span>📤</span> Import Radiograph
            </h2>

            <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors bg-slate-950/50">
              {previewUrl ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/40 border border-slate-800">
                  <img src={previewUrl} alt="Radiograph preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <div className="text-3xl mb-3">🩻</div>
                  <p className="text-xs font-medium text-slate-300">Select DICOM or X-Ray image</p>
                  <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or JPEG up to 15MB</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="xray-upload"
              />
              <label
                htmlFor="xray-upload"
                className="mt-4 inline-block text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-slate-200 cursor-pointer transition-colors"
              >
                {previewUrl ? "Change Image" : "Choose File"}
              </label>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzing}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20"
          >
            {analyzing ? "Running Vision Engine..." : "Run Vision Pipeline"}
          </button>
        </section>

        {/* Panel 2: Vision Analytics */}
        <section className="lg:col-span-4 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-col">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <span>📊</span> Vision Analytics
          </h2>

          <div className="flex-1 bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 overflow-y-auto">
            {analysisResult ? (
              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <span className="font-bold">Status:</span> Analysis Complete
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {typeof analysisResult === "string" 
                    ? analysisResult 
                    : JSON.stringify(analysisResult, null, 2)}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <p>Upload a radiograph and run the pipeline to generate clinical findings.</p>
              </div>
            )}
          </div>
        </section>

        {/* Panel 3: Clinical Assistant Chat */}
        <section className="lg:col-span-4 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <span>💬</span> Clinical Assistant
          </h2>

          <div className="flex-1 bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 mb-4 overflow-y-auto max-h-[400px] space-y-3">
            {chatHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-12">
                Ask follow-up questions regarding joint alignment, fracture severity, or rehabilitation protocols.
              </p>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <p className="text-xs text-blue-400 animate-pulse">Assistant is thinking...</p>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type follow-up query..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Send
            </button>
          </form>
        </section>
      </main>

      {/* Medical Disclaimer Banner */}
      <footer className="px-6 py-4 bg-[#0B0F19] border-t border-slate-800/80 text-center text-[11px] text-slate-500">
        <p className="max-w-4xl mx-auto">
          ⚠️ <strong>Medical Disclaimer:</strong> RadVision AI is an experimental computer-vision decision-support prototype, not a certified medical diagnostic device. All findings must be independently reviewed by a licensed medical practitioner or radiologist.
        </p>
      </footer>
    </div>
  );
}