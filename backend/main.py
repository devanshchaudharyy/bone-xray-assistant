import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_agent import XRayAnalysisAgent, MEDICAL_DISCLAIMER

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="RadVision AI API")

# Allow Next.js frontend (running on port 3000) to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = XRayAnalysisAgent(model_name="llava")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_message: str
    chat_history: Optional[List[ChatMessage]] = []
    image_analysis: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "online", "ollama_active": agent._is_ollama_available()}

@app.post("/api/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in {".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=400, detail="Invalid image format.")

    saved_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{file_ext}")
    with open(saved_path, "wb") as buffer:
        buffer.write(await file.read())

    return agent.analyze_xray(saved_path)

@app.post("/api/chat")
def chat_followup(payload: ChatRequest):
    history_dicts = [msg.model_dump() for msg in payload.chat_history]
    reply = agent.chat_followup(
        chat_history=history_dicts,
        user_message=payload.user_message,
        image_analysis=payload.image_analysis
    )
    return {"reply": reply, "disclaimer": MEDICAL_DISCLAIMER}