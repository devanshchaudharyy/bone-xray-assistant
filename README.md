# 🦴 RadVision AI | Autonomous Orthopedic Radiography Suite

A modern, full-stack AI-powered medical web application designed for real-time orthopedic X-ray visual analysis and interactive diagnostic support using local multimodal LLMs.

---

## 🌟 Architectural Features

* **Decoupled Architecture:** Built with a modern **FastAPI** backend server (Python) and a high-performance **Next.js 14** web frontend (TypeScript + Tailwind CSS).
* **Local AI Vision Engine:** Powered by **Ollama** running the multimodal `llava` vision model locally for complete data privacy.
* **Fallback Safety Engine:** Automatic offline detection that graceful switches to mock structured data if local AI models are unavailable.
* **Interactive Diagnostic Workspace:**
  * Multi-metric telemetry (Anatomical Region, Image Quality, Confidence Scoring).
  * Identified Indications & Abnormalities breakdown.
  * Context-aware Radiology Summary Narrative.
  * Follow-up clinical assistant chat interface.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
* **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic
* **AI Engine:** Ollama (`llava` 7B vision model)

---
## 📸 Application Screenshot

![Dark-themed RadVision AI orthopedic radiography dashboard. The header shows RadVision AI, V1.0 Enterprise, Autonomous Orthopedic Radiography Suite, Workspace, API Docs, System Info, and Vision Engine: Fallback Mode. The main workspace contains three panels: Import Radiograph with Choose File and Run Vision Pipeline controls, Vision Analytics prompting the user to upload a radiograph and run the pipeline, and Clinical Assistant with guidance about joint alignment, fracture severity, and rehabilitation protocols, plus a follow-up query field and Send button. A warning banner states that RadVision AI is an experimental computer-vision decision-support prototype, not a certified medical diagnostic device, and that all findings must be independently reviewed by a licensed medical practitioner or radiologist. The footer shows © 2026 RadVision AI All rights reserved and Maintained & Developed by Devansh. The spacious dark interface has a professional clinical tone.](.\frontend\public\Live ScreenShot.png)


## 📁 Repository Structure

```text
bone-xray-assistant/
├── backend/                  # FastAPI Python Backend
│   ├── main.py               # REST API Endpoints (/api/analyze, /api/chat, /api/health)
│   ├── ai_agent.py           # Core Vision Agent & Ollama Integration
│   ├── requirements.txt      # Python Dependencies
│   └── uploads/              # Local Storage for Analyzed Radiographs
│
└── frontend/                 # Next.js 14 Frontend Client
    ├── app/
    │   ├── page.tsx          # Production Medical Dashboard Layout
    │   ├── globals.css       # Tailwind Styles & Obsidian Dark Theme
    │   └── layout.tsx
    ├── package.json
    └── tailwind.config.ts